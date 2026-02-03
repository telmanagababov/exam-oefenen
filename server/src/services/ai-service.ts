import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import { EXAM_TYPES, ExamType } from "../models/exam-types.js";
import { ExerciseResponse } from "../models/exercise-response.js";
import { ValidationResponse } from "../models/validation-response.js";
import { readRuleFile, readValidationRuleFile } from "./rules-service.js";

/**
 * System instruction that defines the AI's persona as an official examiner
 * for the Dutch Inburgeringsexamen (A2 level).
 */
export const SYSTEM_INSTRUCTION =
  "You are an official examiner for the Dutch Inburgeringsexamen (A2 level). " +
  "You generate tasks that are simple, use common vocabulary (Basis-NT2), " +
  "and follow the exact structure of DUO exams.";

// Re-export types and constants for backward compatibility
export { EXAM_TYPES } from "../models/exam-types.js";
export type { ExamType } from "../models/exam-types.js";
export type {
  ExerciseResponse,
  Question,
} from "../models/exercise-response.js";

/**
 * Configuration for the AI service
 */
const getApiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return apiKey;
};

/**
 * Get the model name from environment variable, defaulting to gemini-2.5-flash
 */
const getModelName = (): string => {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
};

/**
 * Initialize the Gemini AI client
 */
let genAI: GoogleGenerativeAI | null = null;

const initializeAI = (): GoogleGenerativeAI => {
  if (!genAI) {
    const apiKey = getApiKey();
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Get the generative model instance with a custom system instruction
 */
const getModel = (systemInstruction?: string) => {
  const ai = initializeAI();
  const modelName = getModelName();
  return ai.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction || SYSTEM_INSTRUCTION,
  });
};

/**
 * Interface for question property schema
 */
interface QuestionPropertySchema {
  type: SchemaType;
  description: string;
  items?: { type: SchemaType };
}

/**
 * Type for question properties schema (supports index signature for ResponseSchema compatibility)
 */
type QuestionPropertiesSchema = Record<string, QuestionPropertySchema> & {
  title: QuestionPropertySchema;
  question: QuestionPropertySchema;
  answers: QuestionPropertySchema;
  correctAnswerIndex: QuestionPropertySchema;
  context?: QuestionPropertySchema;
  transcription?: QuestionPropertySchema;
};

/**
 * JSON Schema for exercise response
 */
const getExerciseResponseSchema = (examType?: ExamType): ResponseSchema => {
  const baseProperties: QuestionPropertiesSchema = {
    title: {
      type: SchemaType.STRING,
      description:
        "The actual question in a short sentence (e.g., 'Wat is de kost van tomaten?' for Reading, 'Hoeveel kost een brood?' for Listening). This should be a concise question that summarizes what the user needs to answer.",
    },
    question: {
      type: SchemaType.STRING,
      description:
        examType === EXAM_TYPES.SPEAKING
          ? "The detailed task description with specific instructions for the speaking exercise. Include clear requirements such as: number of sentences to speak, what to cover (e.g., 'write 3 whole sentences. tell what happened, mention the reason, propose a solution'), and any other relevant details. Use \\n for line breaks to format the text with proper paragraphs and line spacing."
          : "The question description or text (the actual question body). Use \\n for line breaks to format the text with proper paragraphs and line spacing. For reading exercises, format longer texts with line breaks between paragraphs.",
    },
    answers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description:
        "Array of possible answers (optional, may be empty for open-ended questions)",
    },
    correctAnswerIndex: {
      type: SchemaType.INTEGER,
      description:
        "Index of the correct answer in the answers array (0-based). Required for questions with answers array. For open-ended questions (writing/speaking), this should be omitted.",
    },
  };

  // Add context and transcription fields for Listening questions
  if (examType === EXAM_TYPES.LISTENING) {
    baseProperties.context = {
      type: SchemaType.STRING,
      description:
        "Context description of the audio scenario (e.g., 'At the doctor', 'At the supermarket', 'Calling a school'). This describes the situation where the dialogue takes place.",
    };
    baseProperties.transcription = {
      type: SchemaType.STRING,
      description:
        "Full transcription of the dialogue or audio content. This is the exact text that will be spoken by the text-to-speech system. Do not include the words 'Transcription' or 'Context' in this field.",
    };
  }

  return {
    type: SchemaType.OBJECT,
    properties: {
      questions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: baseProperties,
          required:
            examType === EXAM_TYPES.LISTENING
              ? ["title", "question", "context", "transcription"]
              : ["title", "question"],
        },
      },
    },
    required: ["questions"],
  } as ResponseSchema;
};

/**
 * Generate exam exercises for a specific exam type
 * @param examType - The type of exam (Reading, Listening, Writing, Speaking, KNM)
 * @returns Promise containing an object with an array of questions with optional answers and correct answer index
 */
export const generateExamExercises = async (
  examType: ExamType
): Promise<ExerciseResponse> => {
  if (!Object.values(EXAM_TYPES).includes(examType)) {
    throw new Error(
      `Invalid exam type: ${examType}. Must be one of: ${Object.values(
        EXAM_TYPES
      ).join(", ")}`
    );
  }

  // Read the rule file for this exam type
  const ruleContent = await readRuleFile(examType);

  // Combine base system instruction with exam-specific rules
  const enhancedSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n${ruleContent}`;

  const model = getModel(enhancedSystemInstruction);

  const prompt = `Generate exam exercises for the ${examType} section of the Dutch Inburgeringsexamen (A2 level). 
Follow the rules and structure specified in the system instructions exactly.

IMPORTANT: Each question must include:
- A "title" field: The actual question in a short sentence (e.g., "Wat is de kost van tomaten?" for Reading, "Hoeveel kost een brood?" for Listening). This should be a concise question that summarizes what the user needs to answer.
- A "question" field: The full question text, context, or task description (may include reading text, listening instructions, or detailed task requirements). Use \\n for line breaks to format longer texts with proper paragraphs and spacing. For reading exercises, format the reading passage with line breaks between paragraphs.${
  examType === EXAM_TYPES.SPEAKING
    ? " For Speaking exercises, the question field must be detailed and descriptive, providing clear instructions such as: number of sentences to speak (e.g., 'write 3 whole sentences'), what to cover (e.g., 'tell what happened, mention the reason, propose a solution'), and any other relevant details that guide the user's response."
    : ""
}

${
  examType === EXAM_TYPES.LISTENING
    ? "For Listening exercises, you MUST always include:\n- A \"context\" field: Context description of the audio scenario (e.g., 'At the doctor', 'At the supermarket', 'Calling a school'). This describes the situation where the dialogue takes place.\n- A \"transcription\" field: Full transcription of the dialogue or audio content. This is the exact text that will be spoken by the text-to-speech system. Do NOT include the words 'Transcription' or 'Context' in this field - just provide the dialogue text directly."
    : ""
}

${
  examType === EXAM_TYPES.SPEAKING
    ? "For Speaking exercises:\n- The \"question\" field must be detailed and descriptive, providing clear instructions for what the user should say. Include specific requirements such as: number of sentences to speak (e.g., 'write 3 whole sentences'), what to cover (e.g., 'tell what happened, mention the reason, propose a solution'), and any other relevant details that guide the user's response.\n- The answers array should be empty and correctAnswerIndex should be omitted as these are open-ended questions."
    : examType === EXAM_TYPES.WRITING
    ? "For writing exercises, the answers array should be empty and correctAnswerIndex should be omitted as these are open-ended questions."
    : "Include multiple choice answers with exactly one correct answer. Set correctAnswerIndex to the index (0-based) of the correct answer in the answers array."
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: getExerciseResponseSchema(examType),
      },
    });

    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const exercises: ExerciseResponse = JSON.parse(text);

    return exercises;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate exam exercises: ${errorMessage}`);
  }
};

/**
 * JSON Schema for multiple choice validation response
 */
const getMultipleChoiceValidationSchema = (): ResponseSchema =>
  ({
    type: SchemaType.OBJECT,
    properties: {
      passed: {
        type: SchemaType.BOOLEAN,
        description: "Whether the exam was passed",
      },
      totalQuestions: {
        type: SchemaType.INTEGER,
        description: "Total number of questions",
      },
      correctAnswers: {
        type: SchemaType.INTEGER,
        description: "Number of correct answers",
      },
      answers: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            correct: {
              type: SchemaType.BOOLEAN,
              description: "Whether the answer is correct",
            },
            feedback: {
              type: SchemaType.STRING,
              description:
                "Feedback explaining why the answer is correct or incorrect",
            },
          },
          required: ["correct", "feedback"],
        },
      },
    },
    required: ["passed", "totalQuestions", "correctAnswers", "answers"],
  } as ResponseSchema);

/**
 * JSON Schema for open-ended validation response (Writing/Speaking)
 */
const getOpenEndedValidationSchema = (): ResponseSchema =>
  ({
    type: SchemaType.OBJECT,
    properties: {
      passed: {
        type: SchemaType.BOOLEAN,
        description: "Whether the exam was passed",
      },
      totalTasks: {
        type: SchemaType.INTEGER,
        description: "Total number of tasks",
      },
      averageScore: {
        type: SchemaType.NUMBER,
        description: "Average score across all tasks (0-10)",
      },
      answers: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            correct: {
              type: SchemaType.BOOLEAN,
              description: "Whether the task passed (score >= 6.0)",
            },
            score: {
              type: SchemaType.NUMBER,
              description: "Score for this task (0-10)",
            },
            feedback: {
              type: SchemaType.STRING,
              description: "Detailed feedback on the task",
            },
          },
          required: ["correct", "score", "feedback"],
        },
      },
    },
    required: ["passed", "totalTasks", "averageScore", "answers"],
  } as ResponseSchema);

/**
 * Answer payload type for different answer formats
 */
export interface AnswerPayload {
  type: "string" | "number" | "blob";
  value: string | number | null;
  blobData?: string; // base64 encoded blob
  blobType?: string; // MIME type of the blob
}

/**
 * User answers input type
 */
export interface UserAnswers {
  answers: AnswerPayload[];
}

/**
 * Validate exam answers using AI
 * @param examType - The type of exam (Reading, Listening, Writing, Speaking, KNM)
 * @param exercises - The original exercise questions
 * @param userAnswers - The user's answers
 * @returns Promise containing validation results with feedback
 */
export const validateExam = async (
  examType: ExamType,
  exercises: ExerciseResponse,
  userAnswers: UserAnswers
): Promise<ValidationResponse> => {
  if (!Object.values(EXAM_TYPES).includes(examType)) {
    throw new Error(
      `Invalid exam type: ${examType}. Must be one of: ${Object.values(
        EXAM_TYPES
      ).join(", ")}`
    );
  }

  // Read the validation rule file for this exam type
  const validationRuleContent = await readValidationRuleFile(examType);

  // Combine base system instruction with validation rules
  const validationSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n${validationRuleContent}`;

  const model = getModel(validationSystemInstruction);

  // Determine if this is an open-ended exam (Writing/Speaking)
  const isOpenEnded =
    examType === EXAM_TYPES.WRITING || examType === EXAM_TYPES.SPEAKING;

  // Process answers and build content parts (text + audio)
  const textAnswers: Array<{
    questionIndex: number;
    type: string;
    value: string | number | null;
  }> = [];
  const audioParts: Array<{
    inlineData: {
      mimeType: string;
      data: string;
    };
  }> = [];
  const audioQuestionIndices: number[] = [];

  userAnswers.answers.forEach((answer, index) => {
    if (answer.type === "blob" && answer.blobData) {
      // For blob answers, add audio data to parts
      audioParts.push({
        inlineData: {
          mimeType: answer.blobType || "audio/webm",
          data: answer.blobData,
        },
      });
      audioQuestionIndices.push(index);
    } else {
      // For string and number answers, add to text answers
      textAnswers.push({
        questionIndex: index,
        type: answer.type,
        value: answer.value,
      });
    }
  });

  // Build the prompt with exercises and text answers
  const exercisesJson = JSON.stringify(exercises, null, 2);
  const answersJson = JSON.stringify(textAnswers, null, 2);

  const prompt = `You are validating answers for a ${examType} exam.

Original Exercises:
${exercisesJson}

User Answers (text/number):
${answersJson}

${
  audioQuestionIndices.length > 0
    ? `\nAudio Recordings:\nThe following question indices have audio recordings attached: ${audioQuestionIndices.join(
        ", "
      )}. Each audio recording will be provided as a separate part in this message. Please listen to each audio recording and evaluate the user's spoken response based on pronunciation, fluency, grammatical correctness, and content accuracy.`
    : ""
}

${
  examType === EXAM_TYPES.SPEAKING
    ? "NOTE: For speaking exercises, audio recordings are provided as inline audio data. Please listen to each audio recording and evaluate based on pronunciation quality, fluency, grammatical correctness, and content accuracy."
    : ""
}

Please validate each answer according to the validation rules provided in the system instructions.`;

  // Build content parts: text prompt + audio blobs
  const contentParts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: prompt }, ...audioParts];

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: contentParts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: isOpenEnded
          ? getOpenEndedValidationSchema()
          : getMultipleChoiceValidationSchema(),
      },
    });

    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const validation: ValidationResponse = JSON.parse(text);

    return validation;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to validate exam: ${errorMessage}`);
  }
};
