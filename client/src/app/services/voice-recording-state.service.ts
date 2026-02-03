import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { VoiceRecordingUtilityService } from './voice-recording-utility.service';

export interface RecordingData {
  transcription: string;
  audioBlob: Blob | null;
  audioUrl?: string;
}

@Injectable()
export class VoiceRecordingStateService implements OnDestroy {
  private utilityService = inject(VoiceRecordingUtilityService);

  private speechRecognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioStream: MediaStream | null = null;
  private finalTranscript: string = '';

  private isRecordingSubject = new BehaviorSubject<boolean>(false);
  private transcriptionSubject = new BehaviorSubject<string>('');
  private recordingCompleteSubject = new Subject<RecordingData>();
  private transcriptionUpdateSubject = new Subject<string>();
  private speechRecognitionErrorSubject = new Subject<string>();

  isRecording$: Observable<boolean> = this.isRecordingSubject.asObservable();
  transcription$: Observable<string> = this.transcriptionSubject.asObservable();
  recordingComplete$: Observable<RecordingData> = this.recordingCompleteSubject.asObservable();
  transcriptionUpdate$: Observable<string> = this.transcriptionUpdateSubject.asObservable();
  speechRecognitionError$: Observable<string> = this.speechRecognitionErrorSubject.asObservable();

  constructor() {
    this.initializeSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize SpeechRecognition API
   */
  private initializeSpeechRecognition(): void {
    if (!this.utilityService.isSupported()) {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.lang = 'nl-NL';
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;

      this.speechRecognition.onresult = (event: any) => {
        let interimTranscript = '';

        // Process only new results starting from event.resultIndex
        // This ensures we don't reprocess results we've already handled
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Add final transcript to the accumulated final transcript
            this.finalTranscript += transcript + ' ';
          } else {
            // Interim results are temporary, only show current interim
            interimTranscript += transcript;
          }
        }

        // Combine final transcript (accumulated) with current interim transcript
        const newText = this.finalTranscript + interimTranscript;
        const trimmedText = newText.trim();

        this.transcriptionSubject.next(trimmedText);
        this.transcriptionUpdateSubject.next(trimmedText);
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          // User stopped speaking, continue recording audio
          return;
        }
        
        // Handle network errors and other critical errors
        if (event.error === 'network') {
          // Network error - speech recognition won't work, but audio recording can continue
          this.speechRecognitionErrorSubject.next('network');
          // Stop trying to restart recognition on network errors
          return;
        }
        
        // For other errors, emit them but don't stop audio recording
        if (event.error !== 'aborted' && event.error !== 'not-allowed') {
          this.speechRecognitionErrorSubject.next(event.error);
        }
      };

      this.speechRecognition.onend = () => {
        // When recognition ends and restarts, the API resets its result index
        // But we keep the finalTranscript accumulated so far
        // The API will start with a fresh results array when it restarts
        
        // Restart recognition if still recording and no critical error occurred
        // Don't restart if there was a network error
        if (this.isRecordingSubject.value && this.speechRecognition) {
          try {
            this.speechRecognition.start();
          } catch (error) {
            // If restart fails, it might be because recognition is already starting
            // or there's a persistent error - don't spam errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('already started') && !errorMessage.includes('already running')) {
              console.error('Error restarting speech recognition:', error);
            }
          }
        }
      };
    }
  }

  /**
   * Start recording audio and transcription
   */
  async startRecording(): Promise<void> {
    if (!this.utilityService.isSupported()) {
      throw new Error('Voice recording is not supported in this browser');
    }

    if (this.isRecordingSubject.value) {
      console.warn('Recording is already in progress');
      return;
    }

    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder for audio capture
      const mimeType = this.utilityService.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: mimeType || undefined,
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecordingSubject.next(true);
      
      // Reset transcription tracking for new recording session
      this.finalTranscript = '';
      this.transcriptionSubject.next(''); // Clear previous transcription

      // Start speech recognition
      if (this.speechRecognition) {
        try {
          // Clear any previous error state
          this.speechRecognitionErrorSubject.next('');
          this.speechRecognition.start();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('already started') && !errorMessage.includes('already running')) {
            console.warn('Speech recognition start error:', error);
            this.speechRecognitionErrorSubject.next('start-failed');
          }
        }
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop recording and process the results
   */
  stopRecording(): void {
    if (!this.isRecordingSubject.value) {
      return;
    }

    // Mark as not recording FIRST so speech recognition's onend won't try to restart
    this.isRecordingSubject.next(false);

    // Capture current transcription before stopping - transcriptionSubject is updated on every
    // onresult and has the latest. finalTranscript can lag when stopping quickly (last onresult
    // may not have fired yet), so we must preserve transcriptionSubject.value.
    const preservedTranscription = this.transcriptionSubject.value.trim();

    // Stop speech recognition
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }

    // Stop MediaRecorder (this will async trigger processRecording via onstop)
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    // Keep transcription visible: use the value we captured (transcriptionSubject can be
    // overwritten by late onresult/onend when stopping quickly). Restore it sync and again
    // in a microtask to override any stray empty emissions after stop.
    if (preservedTranscription) {
      this.transcriptionSubject.next(preservedTranscription);
      queueMicrotask(() => {
        this.transcriptionSubject.next(preservedTranscription);
      });
    }
  }

  /**
   * Process the recorded audio and emit the final result
   */
  private processRecording(): void {
    const transcription = this.transcriptionSubject.value;

    if (this.audioChunks.length === 0) {
      // No audio recorded, emit transcription only
      this.emitRecordingData(transcription, null);
      return;
    }

    // Create audio blob
    const mimeType = this.utilityService.getSupportedMimeType() || 'audio/webm';
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });

    // Create object URL for potential playback (optional)
    const audioUrl = URL.createObjectURL(audioBlob);

    // Emit both transcription and audio
    this.emitRecordingData(transcription, audioBlob, audioUrl);
  }

  /**
   * Emit the final recording data
   */
  private emitRecordingData(
    transcription: string,
    audioBlob: Blob | null,
    audioUrl?: string,
  ): void {
    const recordingData: RecordingData = {
      transcription: transcription.trim(),
      audioBlob: audioBlob,
      audioUrl: audioUrl,
    };

    this.recordingCompleteSubject.next(recordingData);
  }

  /**
   * Get the current transcription value
   */
  getCurrentTranscription(): string {
    return this.transcriptionSubject.value;
  }

  /**
   * Set transcription manually (for manual editing)
   */
  setTranscription(text: string): void {
    if (this.isRecordingSubject.value) {
      // Don't allow manual editing while recording
      return;
    }
    this.transcriptionSubject.next(text);
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    // Clear error state
    this.speechRecognitionErrorSubject.next('');
    
    // Stop speech recognition
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    }

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    this.isRecordingSubject.next(false);
  }
}
