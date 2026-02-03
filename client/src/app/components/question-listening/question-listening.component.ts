import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Question } from '../../models/exam-response';
import { LocalStorageService } from '../../services/local-storage.service';
import { VoicesService } from '../../services/voices.service';
import { SpeechPlayerComponent } from '../speech-player/speech-player.component';

@Component({
  selector: 'app-question-listening',
  standalone: true,
  imports: [CommonModule, SpeechPlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-listening.component.html',
  styleUrl: './question-listening.component.scss',
})
export class QuestionListeningComponent implements OnInit {
  question = input<Question | null>(null);

  private voicesService = inject(VoicesService);
  private localStorageService = inject(LocalStorageService);

  availableVoices = signal<SpeechSynthesisVoice[]>([]);
  selectedVoice = signal<SpeechSynthesisVoice | null>(null);

  ngOnInit(): void {
    // Load voices
    this.loadVoices();

    // Setup listener for asynchronous voice loading
    this.setupVoiceChangeListener();
  }

  private setupVoiceChangeListener(): void {
    // Listen for voice changes (voices load asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices(): void {
    const voices = this.voicesService.getAvailableDutchVoices();
    this.availableVoices.set(voices);

    // Try to restore selected voice from localStorage
    const savedVoiceName = this.localStorageService.getSelectedVoiceName();
    if (savedVoiceName) {
      const savedVoice = voices.find((voice) => voice.name === savedVoiceName);
      if (savedVoice) {
        this.selectedVoice.set(savedVoice);
        return;
      }
    }

    // Set default voice if none selected
    if (!this.selectedVoice() && voices.length > 0) {
      this.selectedVoice.set(voices[0]);
      // Save default voice to localStorage
      this.localStorageService.setSelectedVoiceName(voices[0].name);
    }
  }

  onVoiceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const voiceName = target.value;
    const voice = this.availableVoices().find((v) => v.name === voiceName);
    if (voice) {
      this.selectedVoice.set(voice);
      // Save selected voice to localStorage
      this.localStorageService.setSelectedVoiceName(voiceName);
    }
  }
}
