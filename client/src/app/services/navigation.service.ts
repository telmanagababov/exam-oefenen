import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, Subscription } from 'rxjs';
import { setCurrentStep } from '../store/app';
import { AppStep, ROUTE_TO_STEP_MAP } from '../models/app-step';
import { RouteName } from '../models/route-name';

@Injectable({
  providedIn: 'root',
})
export class NavigationService implements OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private routerSubscription?: Subscription;

  constructor() {
    // Initialize with current route
    this.updateStepFromRoute(this.router.url);

    // Subscribe to route changes
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.updateStepFromRoute(event.url);
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private updateStepFromRoute(url: string): void {
    // Remove leading slash and extract base route
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const baseRoute = cleanUrl.split('/')[0] as RouteName;

    // Check if it matches exercise-exam pattern (with parameter)
    if (cleanUrl.startsWith(RouteName.EXERCISE_EXAM)) {
      const step = ROUTE_TO_STEP_MAP[RouteName.EXERCISE_EXAM];
      this.store.dispatch(setCurrentStep({ step }));
      return;
    }

    // Check other routes
    const step = ROUTE_TO_STEP_MAP[baseRoute];
    if (step) {
      this.store.dispatch(setCurrentStep({ step }));
    } else {
      // Default to selection
      this.store.dispatch(setCurrentStep({ step: AppStep.SELECTION }));
    }
  }

  navigateToSelection(): void {
    this.router.navigate([`/${RouteName.EXERCISE_SELECTION}`]);
  }

  navigateToExam(exerciseType: string): void {
    this.router.navigate([`/${RouteName.EXERCISE_EXAM}`, exerciseType]);
  }

  navigateToResults(): void {
    this.router.navigate([`/${RouteName.EXERCISE_RESULTS}`]);
  }
}
