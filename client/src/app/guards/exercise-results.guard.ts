import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectExamData } from '../store/exercise';
import { RouteName } from '../models/route-name';

export const exerciseResultsGuard: CanActivateFn = () => {
  const router = inject(Router);
  const store = inject(Store);

  // Check if store has exam data
  return store.select(selectExamData).pipe(
    take(1),
    map((examData) => {
      // If no exam data exists, redirect to selection
      if (!examData || !examData.exercises) {
        return router.createUrlTree([`/${RouteName.EXERCISE_SELECTION}`]);
      }

      // Allow navigation if exam data exists
      return true;
    }),
  );
};
