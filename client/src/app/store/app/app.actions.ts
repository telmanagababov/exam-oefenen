import { createAction, props } from '@ngrx/store';
import { AppStep } from '../../models/app-step';

export const setCurrentStep = createAction('[App] Set Current Step', props<{ step: AppStep }>());

export const clearCurrentStep = createAction('[App] Clear Current Step');
