import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectSelectedExerciseType } from '../store/exercise';
import { ExerciseType } from '../models/exercise-type';
import { RouteName } from '../models/route-name';

export const exerciseExamGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const store = inject(Store);

  const routeType = route.params['type'] as string;

  // Check if route parameter is a valid exercise type
  const isValidType = Object.values(ExerciseType).includes(routeType as ExerciseType);

  if (!isValidType) {
    return router.createUrlTree([`/${RouteName.EXERCISE_SELECTION}`]);
  }

  // Check if store has the selected exercise type matching the route
  return store.select(selectSelectedExerciseType).pipe(
    take(1),
    map((selectedType) => {
      // If no exercise type is selected, or it doesn't match the route, redirect to selection
      if (selectedType === null || selectedType !== routeType) {
        return router.createUrlTree([`/${RouteName.EXERCISE_SELECTION}`]);
      }

      // Allow navigation if the store state matches the route
      return true;
    }),
  );
};
