import { InjectionToken } from '@angular/core';

/**
 * Injection token for the API base URL
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000/api',
});
