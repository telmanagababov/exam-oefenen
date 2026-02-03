import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, withLatestFrom } from 'rxjs';
import { ExamService } from '../../services/exam.service';
import { AnswerValue } from './exercise.state';
import {
  loadExamData,
  loadExamDataFailure,
  loadExamDataSuccess,
  validateAnswers,
  validateAnswersFailure,
  validateAnswersSuccess,
} from './exercise.actions';
import { selectAnswers, selectExamData } from './exercise.selectors';

export const loadExamData$ = createEffect(
  (actions$ = inject(Actions), examService = inject(ExamService)) => {
    return actions$.pipe(
      ofType(loadExamData),
      switchMap(({ examType }) =>
        examService.generateExam(examType).pipe(
          map((response) =>
            loadExamDataSuccess({
              id: response.id,
              examType: response.examType,
              exercises: response.exercises,
            }),
          ),
          catchError((error) => {
            const errorMessage = error?.error?.message || error?.message || 'Failed to load exam';
            return of(loadExamDataFailure({ error: errorMessage }));
          }),
        ),
      ),
    );
  },
  { functional: true },
);

export const validateAnswers$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), examService = inject(ExamService)) => {
    return actions$.pipe(
      ofType(validateAnswers),
      withLatestFrom(store.select(selectExamData), store.select(selectAnswers)),
      switchMap(([, examData, answers]) => {
        if (!examData.id) {
          return of(
            validateAnswersFailure({
              error: 'No exam ID available',
            }),
          );
        }

        // Convert Record<number, AnswerValue> to AnswerValue[]
        const answersArray: AnswerValue[] = [];
        const totalQuestions = examData.exercises?.questions?.length ?? 0;
        for (let i = 0; i < totalQuestions; i++) {
          answersArray.push(answers[i] ?? null);
        }

        return examService.validateExam(examData.id, answersArray).pipe(
          map((response) => validateAnswersSuccess({ validationResult: response.validation })),
          catchError((error) => {
            const errorMessage = error?.message || 'Failed to validate answers';
            return of(validateAnswersFailure({ error: errorMessage }));
          }),
        );
      }),
    );
  },
  { functional: true },
);
