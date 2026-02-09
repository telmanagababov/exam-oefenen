import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/**
 * Creates a reactive signal from the current router URL.
 * Updates automatically on navigation events.
 * 
 * @returns Signal containing the current URL string
 * 
 * @example
 * ```typescript
 * export class MyComponent {
 *   currentUrl = getCurrentUrlSignal();
 *   
 *   isHomePage = computed(() => this.currentUrl() === '/home');
 * }
 * ```
 */
export function getCurrentUrlSignal() {
  const router = inject(Router);
  
  return toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => router.url)
    ),
    { initialValue: router.url }
  );
}
