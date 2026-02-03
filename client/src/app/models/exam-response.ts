/**
 * Question structure in the exercise response
 */
export interface Question {
  title: string;
  question: string;
  answers?: string[];
  correctAnswerIndex?: number;
  context?: string;
  transcription?: string;
}

/**
 * Exercise response structure
 */
export interface ExerciseResponse {
  questions: Question[];
}

/**
 * Generate exam response from the API
 */
export interface GenerateExamResponse {
  id: string;
  examType: string;
  exercises: ExerciseResponse;
}
