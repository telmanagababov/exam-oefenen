import { ExamType } from "../models/exam-types.js";
import { ExerciseResponse } from "../models/exercise-response.js";

/**
 * Session data structure
 */
export interface SessionData {
  sessionId: string;
  exercises: Map<ExamType, ExerciseResponse>;
  createdAt: number;
  lastAccessed: number;
}

/**
 * Exercise data stored by unique ID
 */
export interface ExerciseData {
  id: string;
  examType: ExamType;
  exercises: ExerciseResponse;
  createdAt: number;
}

/**
 * In-memory store for exercise sessions
 * For production with multiple server instances, consider using Redis
 */
class ExerciseStore {
  private sessions: Map<string, SessionData> = new Map();
  private exercises: Map<string, ExerciseData> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly EXERCISE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Create a new session
   */
  createSession(sessionId: string): SessionData {
    const now = Date.now();
    const session: SessionData = {
      sessionId,
      exercises: new Map(),
      createdAt: now,
      lastAccessed: now,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get a session by ID, creating it if it doesn't exist
   */
  getSession(sessionId: string): SessionData {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Check if session has expired
      if (Date.now() - session.lastAccessed > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        return this.createSession(sessionId);
      }
      session.lastAccessed = Date.now();
      return session;
    }
    return this.createSession(sessionId);
  }

  /**
   * Store exercises for a specific exam type in a session
   */
  storeExercises(
    sessionId: string,
    examType: ExamType,
    exercises: ExerciseResponse
  ): void {
    const session = this.getSession(sessionId);
    session.exercises.set(examType, exercises);
  }

  /**
   * Get exercises for a specific exam type from a session
   */
  getExercises(
    sessionId: string,
    examType: ExamType
  ): ExerciseResponse | undefined {
    const session = this.getSession(sessionId);
    return session.exercises.get(examType);
  }

  /**
   * Get all exercises for a session
   */
  getAllExercises(sessionId: string): Map<ExamType, ExerciseResponse> {
    const session = this.getSession(sessionId);
    return session.exercises;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions (should be called periodically)
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessed > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * Get session count (useful for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Store exercises by unique ID
   */
  storeExercisesById(
    id: string,
    examType: ExamType,
    exercises: ExerciseResponse
  ): void {
    const exerciseData: ExerciseData = {
      id,
      examType,
      exercises,
      createdAt: Date.now(),
    };
    this.exercises.set(id, exerciseData);
  }

  /**
   * Get exercises by unique ID
   */
  getExercisesById(id: string): ExerciseData | undefined {
    const exerciseData = this.exercises.get(id);
    if (exerciseData) {
      // Check if exercise has expired
      if (Date.now() - exerciseData.createdAt > this.EXERCISE_TIMEOUT) {
        this.exercises.delete(id);
        return undefined;
      }
      return exerciseData;
    }
    return undefined;
  }

  /**
   * Delete exercises by ID
   */
  deleteExercisesById(id: string): boolean {
    return this.exercises.delete(id);
  }

  /**
   * Clean up expired exercises (should be called periodically)
   */
  cleanupExpiredExercises(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, exerciseData] of this.exercises.entries()) {
      if (now - exerciseData.createdAt > this.EXERCISE_TIMEOUT) {
        this.exercises.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * Get exercise count (useful for monitoring)
   */
  getExerciseCount(): number {
    return this.exercises.size;
  }
}

// Singleton instance
export const exerciseStore = new ExerciseStore();

// Cleanup expired sessions and exercises every hour
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cleanedSessions = exerciseStore.cleanupExpiredSessions();
    const cleanedExercises = exerciseStore.cleanupExpiredExercises();
    if (cleanedSessions > 0 || cleanedExercises > 0) {
      console.log(
        `Cleaned up ${cleanedSessions} expired session(s) and ${cleanedExercises} expired exercise(s)`
      );
    }
  }, 60 * 60 * 1000); // 1 hour
}
