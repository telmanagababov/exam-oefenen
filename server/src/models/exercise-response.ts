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
 * Exercise response with unique ID for API responses
 */
export interface ExerciseResponseWithId {
  id: string;
  examType: string;
  exercises: ExerciseResponse;
}
