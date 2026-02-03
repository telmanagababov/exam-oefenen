import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VoiceRecordingUtilityService {
  private isSupportedValue: boolean | null = null;

  /**
   * Check if the browser supports voice recording
   */
  isSupported(): boolean {
    if (this.isSupportedValue !== null) {
      return this.isSupportedValue;
    }

    // Check for SpeechRecognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Check for MediaRecorder API
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

    this.isSupportedValue = !!(SpeechRecognition && hasMediaRecorder);
    return this.isSupportedValue;
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  getSupportedMimeType(): string | null {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null; // Browser will use default
  }

  /**
   * Convert Blob to base64 string
   */
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1]; // Remove data:audio/webm;base64, prefix
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
