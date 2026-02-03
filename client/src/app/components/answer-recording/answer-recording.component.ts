import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnDestroy, output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AudioBlobPlayerComponent } from '../audio-blob-player/audio-blob-player.component';
import { Question } from '../../models/exam-response';
import { VoiceRecordingStateService } from '../../services/voice-recording-state.service';
import { VoiceRecordingUtilityService } from '../../services/voice-recording-utility.service';

@Component({
  selector: 'app-answer-recording',
  standalone: true,
  imports: [CommonModule, AudioBlobPlayerComponent],
  providers: [VoiceRecordingStateService],
  templateUrl: './answer-recording.component.html',
  styleUrl: './answer-recording.component.scss',
})
export class AnswerRecordingComponent implements OnDestroy {
  question = input<Question | null>(null);
  initialAnswer = input<number | string | Blob | null>(null);
  answerRecorded = output<Blob | null>();

  #utilityService = inject(VoiceRecordingUtilityService);
  #stateService = inject(VoiceRecordingStateService);

  isRecording = signal<boolean>(false);
  transcription = signal<string>('');
  recordedAudioBlob = signal<Blob | null>(null);
  isSupported = signal<boolean>(true);
  speechRecognitionError = signal<string>('');

  #subscriptions = new Subscription();

  constructor() {
    this.#initializeRecordingState();

    effect(() => {
      // Track both inputs - effect will re-run when either changes
      const questionValue = this.question();
      const initialAnswerValue = this.initialAnswer();
      // Initialize answer when inputs change
      if (questionValue !== null || initialAnswerValue !== null) {
        this.#initializeAnswer();
      }
    });
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
    this.#stateService.cleanup();
  }

  #initializeAnswer(): void {
    const initialAnswerValue = this.initialAnswer();
    if (typeof initialAnswerValue === 'string') {
      this.transcription.set(initialAnswerValue);
      this.#stateService.setTranscription(initialAnswerValue);
      this.recordedAudioBlob.set(null);
    } else if (initialAnswerValue instanceof Blob) {
      this.recordedAudioBlob.set(initialAnswerValue);
    } else {
      this.transcription.set('');
      this.#stateService.setTranscription('');
      this.recordedAudioBlob.set(null);
    }
    this.isRecording.set(false);
    this.speechRecognitionError.set('');
  }

  #initializeRecordingState(): void {
    this.isSupported.set(this.#utilityService.isSupported());

    this.#subscriptions.add(
      this.#stateService.isRecording$.subscribe((isRecording) => {
        this.isRecording.set(isRecording);
      }),
    );

    this.#subscriptions.add(
      this.#stateService.transcription$.subscribe((transcription) => {
        this.transcription.set(transcription);
      }),
    );

    this.#subscriptions.add(
      this.#stateService.recordingComplete$.subscribe((recordingData) => {
        this.recordedAudioBlob.set(recordingData.audioBlob);
        this.answerRecorded.emit(recordingData.audioBlob);
      }),
    );

    this.#subscriptions.add(
      this.#stateService.speechRecognitionError$.subscribe((error) => {
        this.speechRecognitionError.set(error);
      }),
    );
  }

  async onStartRecording(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      await this.#stateService.startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isSupported.set(false);
    }
  }

  onStopRecording(): void {
    this.#stateService.stopRecording();
  }

  onTranscriptionChange(event: Event): void {
    if (this.isRecording()) {
      return;
    }

    const target = event.target as HTMLTextAreaElement;
    const text = target.value;
    this.#stateService.setTranscription(text);

    this.answerRecorded.emit(null);
  }
}
