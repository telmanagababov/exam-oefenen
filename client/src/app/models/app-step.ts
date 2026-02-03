import { RouteName } from './route-name';

export enum AppStep {
  SELECTION = 'selection',
  EXAM = 'exam',
  REVIEW = 'review',
}

/**
 * Maps route names to app steps
 */
export const ROUTE_TO_STEP_MAP: Record<RouteName, AppStep> = {
  [RouteName.EXERCISE_SELECTION]: AppStep.SELECTION,
  [RouteName.EXERCISE_EXAM]: AppStep.EXAM,
  [RouteName.EXERCISE_RESULTS]: AppStep.REVIEW,
};

/**
 * Maps app steps to route names
 */
export const STEP_TO_ROUTE_MAP: Record<AppStep, RouteName> = {
  [AppStep.SELECTION]: RouteName.EXERCISE_SELECTION,
  [AppStep.EXAM]: RouteName.EXERCISE_EXAM,
  [AppStep.REVIEW]: RouteName.EXERCISE_RESULTS,
};
