import { createReducer, on } from '@ngrx/store';
import { AppState, initialAppState } from './app.state';
import * as AppActions from './app.actions';

export const appReducer = createReducer(
  initialAppState,
  on(AppActions.setCurrentStep, (state, { step }) => ({
    ...state,
    currentStep: step,
  })),
  on(AppActions.clearCurrentStep, (state) => ({
    ...state,
    currentStep: null,
  })),
);
