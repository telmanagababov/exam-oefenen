import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VoicesService {
  /**
   * Get available Dutch (nl-NL) voices, sorted by name ascending
   */
  getAvailableDutchVoices(): SpeechSynthesisVoice[] {
    const voices = speechSynthesis.getVoices();
    return voices
      .filter((voice) => voice.lang.toUpperCase().includes('NL-NL'))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get the default Dutch voice (first one alphabetically)
   */
  getDefaultDutchVoice(): SpeechSynthesisVoice | null {
    const voices = this.getAvailableDutchVoices();
    return voices.length > 0 ? voices[0] : null;
  }
}
