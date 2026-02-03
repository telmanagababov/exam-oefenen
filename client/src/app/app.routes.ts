import { Routes } from '@angular/router';
import { exerciseExamGuard } from './guards/exercise-exam.guard';
import { exerciseResultsGuard } from './guards/exercise-results.guard';
import { RouteName } from './models/route-name';

export const routes: Routes = [
  {
    path: '',
    redirectTo: `/${RouteName.EXERCISE_SELECTION}`,
    pathMatch: 'full',
  },
  {
    path: RouteName.EXERCISE_SELECTION,
    loadComponent: () =>
      import('./pages/exercise-selection/exercise-selection.component').then(
        (m) => m.ExerciseSelectionComponent,
      ),
  },
  {
    path: `${RouteName.EXERCISE_EXAM}/:type`,
    canActivate: [exerciseExamGuard],
    loadComponent: () =>
      import('./pages/exercise-exam/exercise-exam.component').then((m) => m.ExerciseExamComponent),
  },
  {
    path: RouteName.EXERCISE_RESULTS,
    canActivate: [exerciseResultsGuard],
    loadComponent: () =>
      import('./pages/exercise-results/exercise-results.component').then(
        (m) => m.ExerciseResultsComponent,
      ),
  },
];
