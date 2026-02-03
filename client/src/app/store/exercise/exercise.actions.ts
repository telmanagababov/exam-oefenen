import { createAction, props } from '@ngrx/store';
import { ExerciseType } from '../../models/exercise-type';
import { ExerciseResponse } from '../../models/exam-response';
import { ValidationResponse } from '../../models/validation-response';

export const setSelectedExerciseType = createAction(
  '[Exercise] Set Selected Exercise Type',
  props<{ exerciseType: ExerciseType }>(),
);

export const clearSelectedExerciseType = createAction('[Exercise] Clear Selected Exercise Type');

export const loadExamData = createAction(
  '[Exercise] Load Exam Data',
  props<{ examType: string }>(),
);

export const loadExamDataSuccess = createAction(
  '[Exercise] Load Exam Data Success',
  props<{ id: string; examType: string; exercises: ExerciseResponse }>(),
);

export const loadExamDataFailure = createAction(
  '[Exercise] Load Exam Data Failure',
  props<{ error: string }>(),
);

export const clearExamData = createAction('[Exercise] Clear Exam Data');

export const setCurrentQuestionIndex = createAction(
  '[Exercise] Set Current Question Index',
  props<{ index: number }>(),
);

export const setAnswer = createAction(
  '[Exercise] Set Answer',
  props<{ questionIndex: number; answer: number | string | Blob | null }>(),
);

export const clearAnswers = createAction('[Exercise] Clear Answers');

export const setTimeLeft = createAction('[Exercise] Set Time Left', props<{ value: number }>());

export const validateAnswers = createAction('[Exercise] Validate Answers');

export const validateAnswersSuccess = createAction(
  '[Exercise] Validate Answers Success',
  props<{ validationResult: ValidationResponse }>(),
);

export const validateAnswersFailure = createAction(
  '[Exercise] Validate Answers Failure',
  props<{ error: string }>(),
);
