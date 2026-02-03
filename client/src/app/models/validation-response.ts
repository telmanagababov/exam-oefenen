/**
 * Answer validation result
 */
export interface AnswerValidation {
  correct: boolean;
  feedback: string;
  score?: number; // For Writing/Speaking tasks (0-10)
}

/**
 * Validation response for multiple choice exams (Reading, Listening, KNM)
 */
export interface MultipleChoiceValidationResponse {
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  answers: AnswerValidation[];
}

/**
 * Validation response for open-ended exams (Writing, Speaking)
 */
export interface OpenEndedValidationResponse {
  passed: boolean;
  totalTasks: number;
  averageScore: number;
  answers: AnswerValidation[];
}

/**
 * Union type for all validation responses
 */
export type ValidationResponse = MultipleChoiceValidationResponse | OpenEndedValidationResponse;

/**
 * Validate exam response from the API
 */
export interface ValidateExamResponse {
  id: string;
  examType: string;
  validation: ValidationResponse;
}
