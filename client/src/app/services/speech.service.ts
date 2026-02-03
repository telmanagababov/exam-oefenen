import { Injectable } from '@angular/core';
import { VoicesService } from './voices.service';

export interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

@Injectable()
export class SpeechService {
  private isSpeaking = false;
  private startTime: number = 0;
  private estimatedDuration: number = 0;
  private voicesService = new VoicesService();

  /**
   * Reset state (isSpeaking, startTime, estimatedDuration)
   */
  resetState(): void {
    this.isSpeaking = false;
    this.startTime = 0;
    this.estimatedDuration = 0;
  }

  /**
   * Estimate duration of speech in milliseconds
   */
  private estimateDuration(text: string, rate: number = 1): number {
    // Average speaking rate is about 150-200 words per minute
    // We'll use 175 words per minute as baseline
    const wordsPerMinute = 175 * rate;
    const wordCount = text.split(/\s+/).length;
    const minutes = wordCount / wordsPerMinute;
    return Math.ceil(minutes * 60 * 1000); // Convert to milliseconds
  }

  /**
   * Speak text with options
   */
  speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech first
      // speechSynthesis.speak() will automatically cancel ongoing speech,
      // but we need to reset our state first
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
        // Reset state immediately
        this.resetState();
        // Give the browser a brief moment to process the cancellation
        // This prevents the new utterance from being canceled immediately
        setTimeout(() => {
          this.startNewUtterance(text, options, resolve, reject);
        }, 50);
      } else {
        this.resetState();
        this.startNewUtterance(text, options, resolve, reject);
      }
    });
  }

  private startNewUtterance(
    text: string,
    options: SpeechOptions,
    resolve: () => void,
    reject: (error: any) => void
  ): void {
    if (!text || text.trim().length === 0) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());

    // Set language (default to Dutch)
    utterance.lang = options.lang || 'nl-NL';

    // Set voice
    const voice = options.voice || this.voicesService.getDefaultDutchVoice();
    if (voice) {
      utterance.voice = voice;
    }

    // Set speech parameters
    utterance.rate = options.rate ?? 0.9; // Slightly slower for A2 level
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Estimate duration
    this.estimatedDuration = this.estimateDuration(text, utterance.rate);
    this.startTime = Date.now();

    let hasStarted = false;
    let hasEnded = false;

    // Event handlers
    utterance.onstart = () => {
      hasStarted = true;
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      hasEnded = true;
      this.isSpeaking = false;
      this.startTime = 0;
      resolve();
    };

    utterance.onerror = (event) => {
      // "canceled" errors are common when speech is interrupted
      // Don't treat them as fatal errors - just resolve silently
      if (event.error === 'canceled') {
        this.isSpeaking = false;
        this.startTime = 0;
        // Resolve instead of rejecting for canceled errors
        resolve();
        return;
      }
      
      // Log and reject other errors
      console.error('Speech synthesis error:', event.error);
      this.isSpeaking = false;
      this.startTime = 0;
      reject(event.error);
    };

    // Start speaking
    try {
      speechSynthesis.speak(utterance);
      
      // Add a timeout to detect if speech doesn't start
      setTimeout(() => {
        if (!hasStarted && !hasEnded && !speechSynthesis.speaking && !speechSynthesis.pending) {
          console.warn('Speech did not start - possible browser issue or voice unavailable');
          // Reset state
          this.isSpeaking = false;
          this.startTime = 0;
          reject(new Error('Speech did not start'));
        }
      }, 1000);
    } catch (error) {
      console.error('Error calling speechSynthesis.speak:', error);
      this.isSpeaking = false;
      this.startTime = 0;
      reject(error);
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.isSpeaking && (speechSynthesis.speaking || speechSynthesis.pending)) {
      speechSynthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (speechSynthesis.speaking || speechSynthesis.paused) {
      speechSynthesis.cancel();
    }
    this.resetState();
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    // Only return true if onstart has fired (this.isSpeaking) AND speechSynthesis confirms it
    return this.isSpeaking && (speechSynthesis.speaking || speechSynthesis.pending);
  }

  /**
   * Check if currently paused
   */
  getIsPaused(): boolean {
    return speechSynthesis.paused;
  }

  /**
   * Get current progress (0-100)
   */
  getProgress(): number {
    if (!this.isSpeaking || this.estimatedDuration === 0) {
      return 0;
    }
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min((elapsed / this.estimatedDuration) * 100, 100);
    return progress;
  }
}
