import {
  CANONICAL_DISCLAIMER_TEXT,
  EMERGENCY_REDIRECT_MESSAGE,
  SAFE_MEDICATION_BOUNDARY,
  UNSUPPORTED_MEDICAL_MESSAGE,
} from "@/lib/safety/messages";
import { evaluateTextSafety } from "@/lib/safety/evaluate-text";
import { chatResponseSchema } from "@/lib/validation/schemas";
import type { ChatResponse, LanguageCode } from "@/types";

export function chatDisclaimer() {
  return { text: CANONICAL_DISCLAIMER_TEXT };
}

export function buildSafetyBlockedChatResponse(input: {
  documentId: string;
  language: LanguageCode;
  message: string;
}): ChatResponse | null {
  const decision = evaluateTextSafety(input.message);

  if (decision.groundingStatus === "SAFETY_RESTRICTED") {
    const answer =
      decision.safetyStatus === "emergency_redirect"
        ? EMERGENCY_REDIRECT_MESSAGE
        : SAFE_MEDICATION_BOUNDARY;
    return chatResponseSchema.parse({
      documentId: input.documentId,
      language: input.language,
      answer,
      groundingStatus: "SAFETY_RESTRICTED",
      sourceContextIndicator: "NONE",
      safetyStatus: decision.safetyStatus,
      safetyNotes: decision.safetyNotes,
      disclaimer: chatDisclaimer(),
      spokenText: answer,
    });
  }

  if (decision.groundingStatus === "INSUFFICIENT_INFORMATION") {
    return chatResponseSchema.parse({
      documentId: input.documentId,
      language: input.language,
      answer: UNSUPPORTED_MEDICAL_MESSAGE,
      groundingStatus: "INSUFFICIENT_INFORMATION",
      sourceContextIndicator: "NONE",
      safetyStatus: decision.safetyStatus,
      safetyNotes: decision.safetyNotes,
      disclaimer: chatDisclaimer(),
      spokenText: UNSUPPORTED_MEDICAL_MESSAGE,
    });
  }

  return null;
}

/**
 * Run the same text safety engine on a schema-validated model answer.
 */
export function applyChatAnswerSafety(response: ChatResponse): ChatResponse {
  const decision = evaluateTextSafety(`${response.answer}\n${response.spokenText}`);

  if (decision.groundingStatus === "SAFETY_RESTRICTED") {
    const answer =
      decision.safetyStatus === "emergency_redirect"
        ? EMERGENCY_REDIRECT_MESSAGE
        : SAFE_MEDICATION_BOUNDARY;
    return chatResponseSchema.parse({
      ...response,
      answer,
      spokenText: answer,
      groundingStatus: "SAFETY_RESTRICTED",
      sourceContextIndicator: "NONE",
      safetyStatus: decision.safetyStatus,
      safetyNotes: decision.safetyNotes,
      disclaimer: chatDisclaimer(),
    });
  }

  if (decision.groundingStatus === "INSUFFICIENT_INFORMATION") {
    return chatResponseSchema.parse({
      ...response,
      answer: UNSUPPORTED_MEDICAL_MESSAGE,
      spokenText: UNSUPPORTED_MEDICAL_MESSAGE,
      groundingStatus: "INSUFFICIENT_INFORMATION",
      sourceContextIndicator: "NONE",
      safetyStatus: decision.safetyStatus,
      safetyNotes: decision.safetyNotes,
      disclaimer: chatDisclaimer(),
    });
  }

  return chatResponseSchema.parse({
    ...response,
    disclaimer: chatDisclaimer(),
    safetyNotes: decision.safetyNotes,
    spokenText: response.spokenText.trim().length > 0 ? response.spokenText : response.answer,
  });
}
