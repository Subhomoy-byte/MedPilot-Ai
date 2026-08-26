export const AI_ENGINE = "@google/genai" as const;

export { getGeminiClient, getGeminiApiKey } from "@/lib/ai/client";
export { generateJsonFromGemini, GEMINI_TIMEOUT_MS, GEMINI_MAX_ATTEMPTS } from "@/lib/ai/generate-json";
export { analyzeUploadedDocument } from "@/lib/ai/analyze-uploaded";
export { handleDocumentChat } from "@/lib/ai/chat-document";
export { translateAnalysis, translateChatResponse } from "@/lib/ai/translate";
export { sanitizeSpokenText, finalizeAnalysisSpokenText, finalizeChatSpokenText } from "@/lib/ai/spoken-text";
export { GeminiUnavailableError, isRetryableGeminiError } from "@/lib/ai/errors";
export { buildDocumentAnalysisPrompt } from "@/lib/ai/analysis-prompt";
export type { DocumentAnalysisPromptInput } from "@/lib/ai/analysis-prompt";
export {
  GeminiInvalidResponseError,
  parseAndValidateMedPilotAnalysis,
} from "@/lib/ai/validate-analysis";
export type { GeminiInvalidReason } from "@/lib/ai/validate-analysis";
