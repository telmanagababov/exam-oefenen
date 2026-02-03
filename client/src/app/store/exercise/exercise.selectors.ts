import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExerciseState, FALLBACK_EXAM_DURATION_SECONDS } from './exercise.state';
import { ValidationResponse } from '../../models/validation-response';

export const selectExerciseState = createFeatureSelector<ExerciseState>('exercise');

export const selectSelectedExerciseType = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.selectedExerciseType,
);

export const selectExamData = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.examData,
);

export const selectIsLoading = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.isLoading,
);

export const selectExamError = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.error,
);

export const selectCurrentQuestionIndex = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.currentQuestionIndex,
);

export const selectCurrentQuestion = createSelector(selectExerciseState, (state: ExerciseState) => {
  if (!state.examData.exercises?.questions) {
    return null;
  }
  const index = state.currentQuestionIndex;
  const questions = state.examData.exercises.questions;
  return index >= 0 && index < questions.length ? questions[index] : null;
});

export const selectCurrentAnswer = createSelector(selectExerciseState, (state: ExerciseState) => {
  const index = state.currentQuestionIndex;
  return state.answers[index] ?? null;
});

export const selectAnsweredCount = createSelector(selectExerciseState, (state: ExerciseState) => {
  const total = state.examData?.exercises?.questions?.length ?? 0;
  const answers = state.answers;
  let count = 0;
  for (let i = 0; i < total; i++) {
    if (answers[i] != null) count++;
  }
  return count;
});

export const selectTimeLeft = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.timeLeft,
);

export const selectExamDurationSeconds = createSelector(
  selectExerciseState,
  (state: ExerciseState) => {
    const type = state.selectedExerciseType;
    return state.examDurationSecondsByType[type ?? ''] ?? FALLBACK_EXAM_DURATION_SECONDS;
  },
);

export const selectValidationResult = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.validationResult,
);

export const selectAnswers = createSelector(
  selectExerciseState,
  (state: ExerciseState) => state.answers,
);
