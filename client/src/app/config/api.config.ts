import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Injection token for the API base URL
 * 
 * Development (ng serve): Uses http://localhost:3000/api
 * Production (ng build):  Uses /api (relative URL, same origin)
 * 
 * Configuration is managed via Angular environment files:
 * - src/environments/environment.ts (development)
 * - src/environments/environment.prod.ts (production)
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
