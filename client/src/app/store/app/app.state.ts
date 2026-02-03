import { AppStep } from '../../models/app-step';

export interface AppState {
  currentStep: AppStep | null;
}

export const initialAppState: AppState = {
  currentStep: null,
};
