import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';

import { routes } from './app.routes';
import { appReducer } from './store/app';
import { exerciseReducer } from './store/exercise';
import { loadExamData$, validateAnswers$ } from './store/exercise/exercise.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(routes),
    provideStore({
      exercise: exerciseReducer,
      app: appReducer,
    }),
    provideEffects({
      loadExamData: loadExamData$,
      validateAnswers: validateAnswers$,
    }),
  ],
};
