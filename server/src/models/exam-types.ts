/**
 * Exam types supported by the application
 */
export const EXAM_TYPES = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  KNM: "KNM",
} as const;

export type ExamType = (typeof EXAM_TYPES)[keyof typeof EXAM_TYPES];
