import cors from "cors";
import { randomUUID } from "crypto";
import { config } from "dotenv";
import express from "express";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Load .env from project root (one level up from server directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "..", "..", ".env") });

import { EXAM_TYPES, ExamType } from "./models/exam-types.js";
import { generateExamExercises, validateExam } from "./services/ai-service.js";
import { exerciseStore } from "./stores/exercise-store.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Increase body size limit to handle base64-encoded audio files (100MB)
app.use(express.json({ limit: '100mb' }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Generate exam exercises endpoint
app.get("/api/exam/generate/:type", async (req, res) => {
  try {
    const { type } = req.params;

    // Validate exam type
    if (!Object.values(EXAM_TYPES).includes(type as ExamType)) {
      return res.status(400).json({
        error: "Invalid exam type",
        message: `Exam type must be one of: ${Object.values(EXAM_TYPES).join(
          ", "
        )}`,
      });
    }

    // Generate exercises
    const exercises = await generateExamExercises(type as ExamType);

    // Generate unique ID for this exercise set
    const exerciseId = randomUUID();

    // Store exercises by ID
    exerciseStore.storeExercisesById(exerciseId, type as ExamType, exercises);

    // Return exercises with ID
    return res.json({
      id: exerciseId,
      examType: type,
      exercises,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating exam exercises:", errorMessage);
    return res.status(500).json({
      error: "Failed to generate exam exercises",
      message: errorMessage,
    });
  }
});

// Validate exam answers endpoint
app.post("/api/exam/:id/validate", async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body as {
      answers: Array<{
        type: "string" | "number" | "blob";
        value: string | number | null;
        blobData?: string;
        blobType?: string;
      }>;
    };

    // Validate that answers are provided
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Answers must be provided as an array",
      });
    }

    // Fetch the original exercise from store by ID
    const exerciseData = exerciseStore.getExercisesById(id);

    if (!exerciseData) {
      return res.status(404).json({
        error: "Exercise not found",
        message: `No exercise found with ID: ${id}. The exercise may have expired or the ID is invalid.`,
      });
    }

    // Validate the exam using AI
    const validation = await validateExam(
      exerciseData.examType,
      exerciseData.exercises,
      { answers }
    );

    // Return comprehensive validation response
    return res.json({
      id,
      examType: exerciseData.examType,
      validation,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error validating exam:", errorMessage);
    return res.status(500).json({
      error: "Failed to validate exam",
      message: errorMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
