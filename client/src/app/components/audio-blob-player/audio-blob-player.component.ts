import { CommonModule } from '@angular/common';
import { Component, effect, input, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-audio-blob-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-blob-player.component.html',
  styleUrl: './audio-blob-player.component.scss',
})
export class AudioBlobPlayerComponent implements OnDestroy {
  audioBlob = input<Blob | null>(null);

  private audio: HTMLAudioElement | null = null;
  private progressInterval?: number;
  private objectUrl: string | null = null;

  isPlaying = signal<boolean>(false);
  isPaused = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  progress = signal<number>(0);

  constructor() {
    // Watch for changes in audioBlob
    effect(() => {
      const blob = this.audioBlob();
      if (blob) {
        this.initializeAudio(blob);
      } else {
        this.cleanup();
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private initializeAudio(blob: Blob): void {
    this.cleanup();

    // Create object URL from blob
    this.objectUrl = URL.createObjectURL(blob);
    this.audio = new Audio(this.objectUrl);

    // Set up event listeners
    this.audio.addEventListener('loadedmetadata', () => {
      this.isLoading.set(false);
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.stopProgressTracking();
      this.progress.set(0);
    });

    this.audio.addEventListener('error', () => {
      console.error('Error loading audio');
      this.isLoading.set(false);
      this.isPlaying.set(false);
      this.isPaused.set(false);
    });

    // Start loading
    this.isLoading.set(true);
    this.audio.load();
  }

  private cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.stopProgressTracking();
    this.isPlaying.set(false);
    this.isPaused.set(false);
    this.isLoading.set(false);
    this.progress.set(0);
  }

  togglePlayPause(): void {
    if (!this.audio || !this.audioBlob()) {
      return;
    }

    if (this.isPaused()) {
      this.resume();
    } else if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  async play(): Promise<void> {
    if (!this.audio || !this.audioBlob()) {
      return;
    }

    try {
      await this.audio.play();
      this.isPlaying.set(true);
      this.isPaused.set(false);
      this.startProgressTracking();
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying.set(false);
      this.isPaused.set(false);
    }
  }

  pause(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.isPaused.set(true);
    this.isPlaying.set(false);
    this.stopProgressTracking();
  }

  resume(): void {
    if (!this.audio) {
      return;
    }

    this.audio.play();
    this.isPaused.set(false);
    this.isPlaying.set(true);
    this.startProgressTracking();
  }

  stop(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying.set(false);
    this.isPaused.set(false);
    this.stopProgressTracking();
    this.progress.set(0);
  }

  onSliderChange(event: Event): void {
    if (!this.audio) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    const duration = this.audio.duration;

    if (duration && !isNaN(duration)) {
      this.audio.currentTime = (value / 100) * duration;
      this.progress.set(value);
    }
  }

  private updateProgress(): void {
    if (!this.audio) {
      return;
    }

    const duration = this.audio.duration;
    const currentTime = this.audio.currentTime;

    if (duration && !isNaN(duration) && duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      this.progress.set(progressPercent);
    }
  }

  private startProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progressInterval = window.setInterval(() => {
      this.updateProgress();
    }, 100); // Update every 100ms
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
  }
}
