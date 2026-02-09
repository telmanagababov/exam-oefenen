import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AVAILABLE_MODELS,
  GeminiConfigService,
} from '../../services/gemini-config.service';

@Component({
  selector: 'app-gemini-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gemini-config-modal.component.html',
  styleUrl: './gemini-config-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class GeminiConfigModalComponent {
  #configService = inject(GeminiConfigService);

  close = output<void>();
  save = output<void>();

  availableModels = AVAILABLE_MODELS;

  // Form fields
  apiKey = signal<string>(this.#configService.apiKey());
  model = signal<string>(this.#configService.model());
  remember = signal<boolean>(this.#configService.rememberSettings());
  showPassword = signal<boolean>(false);

  // Server config status
  serverHasConfig = this.#configService.serverHasConfig;

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    // Only close if clicking directly on the overlay, not its children
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onSave(): void {
    const apiKeyValue = this.apiKey().trim();
    const modelValue = this.model();
    const rememberValue = this.remember();

    if (!apiKeyValue) {
      alert('Voer een geldige API-sleutel in');
      return;
    }

    this.#configService.updateConfig(apiKeyValue, modelValue, rememberValue);
    this.save.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }
}
