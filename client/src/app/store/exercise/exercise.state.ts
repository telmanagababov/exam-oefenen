import { ExerciseResponse } from '../../models/exam-response';
import { ExerciseType } from '../../models/exercise-type';
import { ValidationResponse } from '../../models/validation-response';

export type AnswerValue = number | string | Blob | null;

/**
 * Exam duration in seconds by type:
 * - Lezen (Reading): 65 min, computer-based, 25 questions
 * - Luisteren (Listening): 45 min, computer-based, ~25 questions
 * - Schrijven (Writing): 40 min, pen & paper, 4 assignments
 * - Spreken (Speaking): 35 min, computer-based, two parts
 * - KNM (Knowledge of Society): 45 min, computer-based, ~40 questions
 */
export const EXAM_DURATION_SECONDS_BY_TYPE: Record<string, number> = {
  [ExerciseType.READING]: 65 * 60,
  [ExerciseType.LISTENING]: 45 * 60,
  [ExerciseType.WRITING]: 40 * 60,
  [ExerciseType.SPEAKING]: 35 * 60,
  [ExerciseType.KNM]: 45 * 60,
};

export const FALLBACK_EXAM_DURATION_SECONDS = 45 * 60;

export interface ExerciseState {
  selectedExerciseType: ExerciseType | null;
  examData: {
    id: string | null;
    examType: string | null;
    exercises: ExerciseResponse | null;
  };
  currentQuestionIndex: number;
  answers: Record<number, AnswerValue>;
  timeLeft: number;
  examDurationSecondsByType: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  validationResult: ValidationResponse | null;
}

export const initialExerciseState: ExerciseState = {
  selectedExerciseType: null,
  examData: {
    id: null,
    examType: null,
    exercises: null,
  },
  currentQuestionIndex: 0,
  answers: {},
  timeLeft: 0,
  examDurationSecondsByType: EXAM_DURATION_SECONDS_BY_TYPE,
  isLoading: false,
  error: null,
  validationResult: null,
};
