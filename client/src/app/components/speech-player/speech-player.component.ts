import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  OnInit,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-speech-player',
  standalone: true,
  imports: [CommonModule],
  providers: [SpeechService],
  templateUrl: './speech-player.component.html',
  styleUrl: './speech-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeechPlayerComponent implements OnInit, OnDestroy {
  text = input<string | null>(null);
  voice = input<SpeechSynthesisVoice | null>(null);

  #speechService = inject(SpeechService);
  #injector = inject(Injector);
  #progressInterval = signal<number | undefined>(undefined);
  #startProgress = signal<number>(0); // Track the progress when speech started (for seeking)
  #previousText = signal<string | null>(null); // Track previous text to detect changes

  isPlaying = signal<boolean>(false);
  isPaused = signal<boolean>(false);
  progress = signal<number>(0);

  ngOnInit(): void {
    // Reset state when text changes
    runInInjectionContext(this.#injector, () => {
      effect(() => {
        const currentText = this.text();
        // Only reset if text actually changed (not on initial null or same value)
        if (currentText !== null && currentText !== this.#previousText()) {
          this.#previousText.set(currentText);
          // Stop any ongoing speech first
          this.#speechService.stop();
          this.#stopProgressTracking();
          // Reset component state
          this.#speechService.resetState();
          this.isPlaying.set(false);
          this.isPaused.set(false);
          this.progress.set(0);
          this.#startProgress.set(0);
        } else if (currentText === null) {
          // Reset previous text when text becomes null
          this.#previousText.set(null);
        }
      });
    });
  }

  ngOnDestroy(): void {
    // Stop speech and cleanup when component is destroyed
    this.#speechService.stop();
    const interval = this.#progressInterval();
    if (interval) {
      clearInterval(interval);
    }
  }

  async togglePlayPause(): Promise<void> {
    if (!this.text()) {
      return;
    }

    if (this.isPaused()) {
      this.resume();
    } else if (this.isPlaying()) {
      this.pause();
    } else {
      await this.play();
    }
  }

  async play(): Promise<void> {
    if (!this.text()) {
      return;
    }

    // Reset to beginning if not seeking
    if (this.progress() === 0 || this.progress() === 100) {
      await this.#playFromText(this.text()!, 0);
    } else {
      // Continue from current position
      await this.#seekTo(this.progress());
    }
  }

  pause(): void {
    this.#speechService.pause();
    this.isPaused.set(true);
    this.isPlaying.set(false);
    this.#stopProgressTracking();
  }

  resume(): void {
    this.#speechService.resume();
    this.isPaused.set(false);
    this.isPlaying.set(true);
    // Don't reset startProgress - continue from where we paused
    this.#startProgressTracking();
  }

  stop(): void {
    this.#speechService.stop();
    this.isPlaying.set(false);
    this.isPaused.set(false);
    this.#stopProgressTracking();
    this.progress.set(0);
    this.#startProgress.set(0);
  }

  onProgressBarClick(event: MouseEvent): void {
    if (!this.text()) {
      return;
    }

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;

    this.#seekTo(percentage);
  }

  onSliderChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    this.#seekTo(value);
  }

  async #seekTo(percentage: number): Promise<void> {
    const textValue = this.text();
    if (!textValue) {
      return;
    }

    // Clamp percentage between 0 and 100
    const targetProgress = Math.max(0, Math.min(100, percentage));

    // If speech is playing or paused, stop it and restart from the new position
    if (this.isPlaying() || this.isPaused()) {
      this.#speechService.stop();
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.#stopProgressTracking();
    }

    // Calculate which part of the text to speak based on percentage
    const textLength = textValue.length;
    const startCharIndex = Math.floor((targetProgress / 100) * textLength);

    // Extract text from the calculated position
    const textToSpeak = textValue.substring(startCharIndex);

    // Update progress
    this.progress.set(targetProgress);

    // If we have text to speak, start playing from that position
    if (textToSpeak.trim().length > 0) {
      await this.#playFromText(textToSpeak, targetProgress);
    } else {
      // If we're at the end, just set progress to 100
      this.progress.set(100);
    }
  }

  async #playFromText(text: string, startProgress: number): Promise<void> {
    this.isPaused.set(false);
    this.progress.set(startProgress);

    try {
      // Set initial state - speech is about to start
      this.isPlaying.set(true);

      // Start progress tracking immediately - it will wait for speech to start
      this.#startProgressTracking();

      // Speak the text with selected voice
      await this.#speechService.speak(text, {
        lang: 'nl-NL',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voice: this.voice() || undefined,
      });

      // Speech ended successfully
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.#stopProgressTracking();
      this.progress.set(100);
    } catch (error) {
      // Only log non-canceled errors
      if (error !== 'canceled') {
        console.error('Error playing speech:', error);
      }
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.#stopProgressTracking();
      this.progress.set(startProgress);
    }
  }

  #startProgressTracking(): void {
    const currentInterval = this.#progressInterval();
    if (currentInterval) {
      clearInterval(currentInterval);
    }

    // Store the initial progress when starting to track
    this.#startProgress.set(this.progress());

    const interval = window.setInterval(() => {
      const isSpeaking = this.#speechService.getIsSpeaking();
      const isPaused = this.#speechService.getIsPaused();

      // Sync component state with speech service state
      if (isPaused) {
        this.isPaused.set(true);
        this.isPlaying.set(false);
      } else if (isSpeaking) {
        this.isPaused.set(false);
        this.isPlaying.set(true);

        // Calculate progress: combine start progress with current speech progress
        const speechProgress = this.#speechService.getProgress();
        // Map speech progress (0-100 for current segment) to overall progress
        const remainingProgress = 100 - this.#startProgress();
        const adjustedProgress = this.#startProgress() + (speechProgress * remainingProgress) / 100;
        this.progress.set(Math.min(100, adjustedProgress));
      } else {
        // Speech hasn't started yet or has ended
        // If we're in playing state but speech hasn't started, keep waiting
        // Only stop tracking if speech has definitely ended (not pending and not speaking)
        if (
          (this.isPlaying() || this.isPaused()) &&
          !speechSynthesis.speaking &&
          !speechSynthesis.pending &&
          !speechSynthesis.paused
        ) {
          // Speech has definitely ended - stop tracking
          this.#stopProgressTracking();
          this.progress.set(100);
          this.isPlaying.set(false);
          this.isPaused.set(false);
        }
        // If speech hasn't started yet but we're in playing state, keep the interval running
        // It will start updating once speech begins
      }
    }, 50); // Update every 50ms for smoother progress updates

    this.#progressInterval.set(interval);
  }

  #stopProgressTracking(): void {
    const interval = this.#progressInterval();
    if (interval) {
      clearInterval(interval);
      this.#progressInterval.set(undefined);
    }
  }
}
