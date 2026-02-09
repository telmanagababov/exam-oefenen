import { Request } from "express";

/**
 * Gemini API configuration extracted from request headers
 */
export interface GeminiApiConfig {
  apiKey?: string;
  model?: string;
}

/**
 * Extract Gemini API configuration from request headers
 * @param req - Express request object
 * @returns Object containing optional apiKey and model from headers
 */
export const extractGeminiConfig = (req: Request): GeminiApiConfig => {
  return {
    apiKey: req.headers["x-gemini-api-key"] as string | undefined,
    model: req.headers["x-gemini-model"] as string | undefined,
  };
};
