import { Injectable } from '@angular/core';

/**
 * LocalStorage keys used by the application
 */
export const LOCAL_STORAGE_KEYS = {
  SELECTED_VOICE_NAME: 'selected-voice-name',
  GEMINI_CONFIG: 'gemini-config',
} as const;

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly APP_PREFIX = 'exam-oefenen:';

  /**
   * Get the full key with app prefix
   */
  private getPrefixedKey(key: string): string {
    return `${this.APP_PREFIX}${key}`;
  }

  /**
   * Get a value from localStorage
   */
  getItem(key: string): string | null {
    if (typeof Storage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(this.getPrefixedKey(key));
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Set a value in localStorage
   */
  setItem(key: string, value: string): void {
    if (typeof Storage === 'undefined') {
      console.warn('localStorage is not available');
      return;
    }
    try {
      localStorage.setItem(this.getPrefixedKey(key), value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  /**
   * Remove a value from localStorage
   */
  removeItem(key: string): void {
    if (typeof Storage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(this.getPrefixedKey(key));
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Get the selected voice name from localStorage
   */
  getSelectedVoiceName(): string | null {
    return this.getItem(LOCAL_STORAGE_KEYS.SELECTED_VOICE_NAME);
  }

  /**
   * Save the selected voice name to localStorage
   */
  setSelectedVoiceName(voiceName: string): void {
    this.setItem(LOCAL_STORAGE_KEYS.SELECTED_VOICE_NAME, voiceName);
  }

  /**
   * Clear the selected voice name from localStorage
   */
  clearSelectedVoiceName(): void {
    this.removeItem(LOCAL_STORAGE_KEYS.SELECTED_VOICE_NAME);
  }
}
