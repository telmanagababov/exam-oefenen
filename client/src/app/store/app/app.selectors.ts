import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from './app.state';
import { AppStep } from '../../models/app-step';

export const selectAppState = createFeatureSelector<AppState>('app');

export const selectCurrentStep = createSelector(
  selectAppState,
  (state: AppState) => state.currentStep,
);

export const selectIsSelectionStep = createSelector(
  selectCurrentStep,
  (step) => step === AppStep.SELECTION,
);

export const selectIsExamStep = createSelector(selectCurrentStep, (step) => step === AppStep.EXAM);

export const selectIsReviewStep = createSelector(
  selectCurrentStep,
  (step) => step === AppStep.REVIEW,
);
