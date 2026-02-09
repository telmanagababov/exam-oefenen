import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../config/api.config';
import { LocalStorageService, LOCAL_STORAGE_KEYS } from './local-storage.service';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface ServerConfigResponse {
  hasApiKey: boolean;
  model?: string;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';

export const AVAILABLE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
] as const;

@Injectable({
  providedIn: 'root',
})
export class GeminiConfigService {
  #http = inject(HttpClient);
  #localStorage = inject(LocalStorageService);
  readonly #apiUrl = inject(API_URL);

  // Signals for reactive state
  #apiKey = signal<string>('');
  #model = signal<string>(DEFAULT_MODEL);
  #rememberSettings = signal<boolean>(false);
  #serverHasConfig = signal<boolean>(false);

  // Public read-only signals
  apiKey = this.#apiKey.asReadonly();
  model = this.#model.asReadonly();
  rememberSettings = this.#rememberSettings.asReadonly();
  serverHasConfig = this.#serverHasConfig.asReadonly();

  // Computed signal to check if config is complete
  isConfigured = computed(() => {
    const hasApiKey = this.#apiKey().trim().length > 0;
    const hasModel = this.#model().trim().length > 0;
    return hasApiKey && hasModel;
  });

  constructor() {
    this.#loadFromStorage();
  }

  /**
   * Initialize by checking server config and loading from storage
   */
  async initialize(): Promise<void> {
    await this.#checkServerConfig();
    
    // If no local config but server has config, we can rely on server
    if (!this.isConfigured() && this.#serverHasConfig()) {
      // Server has config, so we don't need to force user to configure
      // But we keep local config empty to indicate we're using server config
    }
  }

  /**
   * Check if server has API configuration
   */
  async #checkServerConfig(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.#http.get<ServerConfigResponse>(`${this.#apiUrl}/config/check`)
      );
      this.#serverHasConfig.set(response.hasApiKey);
    } catch (error) {
      console.error('Failed to check server config:', error);
      this.#serverHasConfig.set(false);
    }
  }

  /**
   * Load configuration from localStorage
   */
  #loadFromStorage(): void {
    const stored = this.#localStorage.getItem(LOCAL_STORAGE_KEYS.GEMINI_CONFIG);
    if (stored) {
      try {
        const config: GeminiConfig = JSON.parse(stored);
        this.#apiKey.set(config.apiKey || '');
        this.#model.set(config.model || DEFAULT_MODEL);
        this.#rememberSettings.set(true);
      } catch (error) {
        console.error('Failed to parse config from storage:', error);
      }
    }
  }

  /**
   * Save configuration to localStorage
   */
  #saveToStorage(config: GeminiConfig): void {
    this.#localStorage.setItem(LOCAL_STORAGE_KEYS.GEMINI_CONFIG, JSON.stringify(config));
  }

  /**
   * Clear configuration from localStorage
   */
  #clearStorage(): void {
    this.#localStorage.removeItem(LOCAL_STORAGE_KEYS.GEMINI_CONFIG);
  }

  /**
   * Update configuration
   */
  updateConfig(apiKey: string, model: string, remember: boolean): void {
    this.#apiKey.set(apiKey);
    this.#model.set(model);
    this.#rememberSettings.set(remember);

    if (remember) {
      this.#saveToStorage({ apiKey, model });
    } else {
      this.#clearStorage();
    }
  }

  /**
   * Clear current configuration
   */
  clearConfig(): void {
    this.#apiKey.set('');
    this.#model.set(DEFAULT_MODEL);
    this.#rememberSettings.set(false);
    this.#clearStorage();
  }

  /**
   * Get current configuration as object
   */
  getConfig(): GeminiConfig {
    return {
      apiKey: this.#apiKey(),
      model: this.#model(),
    };
  }

  /**
   * Check if we can proceed (either local config or server config)
   */
  canProceed(): boolean {
    return this.isConfigured() || this.#serverHasConfig();
  }
}
