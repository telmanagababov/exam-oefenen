import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ExamType, EXAM_TYPES } from '../models/exam-types.js';

/**
 * Get the directory path of the current module (for ESM)
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Map exam types to their corresponding rule file names
 */
const getRuleFileName = (examType: ExamType): string => {
  const ruleFileMap: Record<ExamType, string> = {
    [EXAM_TYPES.READING]: "reading-a2.md",
    [EXAM_TYPES.LISTENING]: "listening-a2.md",
    [EXAM_TYPES.KNM]: "knm.md",
    [EXAM_TYPES.WRITING]: "writing-a2.md",
    [EXAM_TYPES.SPEAKING]: "speaking-a2.md",
  };
  return ruleFileMap[examType];
};

/**
 * Read the rule file for a specific exam type
 * @param examType - The type of exam (Reading, Listening, Writing, Speaking, KNM)
 * @returns Promise containing the rule file content as a string
 */
export const readRuleFile = async (examType: ExamType): Promise<string> => {
  try {
    const ruleFileName = getRuleFileName(examType);
    // Generation rules are in src/rules/generation, and this service is in src/services
    const ruleFilePath = join(__dirname, "..", "rules", "generation", ruleFileName);
    const ruleContent = await readFile(ruleFilePath, "utf-8");
    return ruleContent;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to read rule file for ${examType}: ${errorMessage}`
    );
  }
};

/**
 * Read the validation rule file for a specific exam type
 * @param examType - The type of exam (Reading, Listening, Writing, Speaking, KNM)
 * @returns Promise containing the validation rule file content as a string
 */
export const readValidationRuleFile = async (
  examType: ExamType
): Promise<string> => {
  try {
    const ruleFileName = getRuleFileName(examType);
    // Validation rules are in src/rules/validation, and this service is in src/services
    const ruleFilePath = join(
      __dirname,
      "..",
      "rules",
      "validation",
      ruleFileName
    );
    const ruleContent = await readFile(ruleFilePath, "utf-8");
    return ruleContent;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to read validation rule file for ${examType}: ${errorMessage}`
    );
  }
};
