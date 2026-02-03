import { createReducer, on } from '@ngrx/store';
import * as ExerciseActions from './exercise.actions';
import { initialExerciseState } from './exercise.state';

export const exerciseReducer = createReducer(
  initialExerciseState,
  on(ExerciseActions.setSelectedExerciseType, (state, { exerciseType }) => ({
    ...state,
    selectedExerciseType: exerciseType,
  })),
  on(ExerciseActions.clearSelectedExerciseType, (state) => ({
    ...state,
    selectedExerciseType: null,
  })),
  on(ExerciseActions.loadExamData, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(ExerciseActions.loadExamDataSuccess, (state, { id, examType, exercises }) => ({
    ...state,
    isLoading: false,
    error: null,
    examData: {
      id,
      examType,
      exercises,
    },
  })),
  on(ExerciseActions.loadExamDataFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
  on(ExerciseActions.clearExamData, (state) => ({
    ...state,
    examData: {
      id: null,
      examType: null,
      exercises: null,
    },
    currentQuestionIndex: 0,
    answers: {},
    timeLeft: 0,
    isLoading: false,
    error: null,
  })),
  on(ExerciseActions.setCurrentQuestionIndex, (state, { index }) => ({
    ...state,
    currentQuestionIndex: index,
  })),
  on(ExerciseActions.setAnswer, (state, { questionIndex, answer }) => ({
    ...state,
    answers: {
      ...state.answers,
      [questionIndex]: answer,
    },
  })),
  on(ExerciseActions.clearAnswers, (state) => ({
    ...state,
    answers: {},
  })),
  on(ExerciseActions.setTimeLeft, (state, { value }) => ({
    ...state,
    timeLeft: value,
  })),
  on(ExerciseActions.validateAnswers, (state) => ({
    ...state,
    validationResult: null,
    error: null,
  })),
  on(ExerciseActions.validateAnswersSuccess, (state, { validationResult }) => ({
    ...state,
    validationResult,
    error: null,
  })),
  on(ExerciseActions.validateAnswersFailure, (state, { error }) => ({
    ...state,
    error,
  })),
);
