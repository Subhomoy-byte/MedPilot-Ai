import { DISCLAIMER_TEXT_EN, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";
import { getFixtureAnalysis, getFixtureKeywords } from "@/lib/demo/fixtures";
import { isDemoFixtureId } from "@/lib/demo/ids";
import { classifyChatSafety } from "@/lib/safety";
import { chatResponseSchema } from "@/lib/validation/schemas";
import type { ChatResponse, LanguageCode } from "@/types";

const OFF_DOCUMENT_RE =
  /\b(weather|stock market|who is the president|capital of|sports score)\b/i;

function disclaimer() {
  return { text: DISCLAIMER_TEXT_EN };
}

export function validateChatMessage(message: string): { ok: true; trimmed: string } | { ok: false; tooLong: boolean } {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { ok: false, tooLong: false };
  }
  if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
    return { ok: false, tooLong: true };
  }
  return { ok: true, trimmed };
}

export function buildChatResponse(input: {
  documentId: string;
  language: LanguageCode;
  message: string;
}): ChatResponse {
  const safety = classifyChatSafety(input.message);

  if (safety.groundingStatus === "SAFETY_RESTRICTED") {
    const answer =
      safety.safetyStatus === "emergency_redirect"
        ? "If this is an emergency, seek urgent professional or emergency healthcare support immediately. MedPilot cannot diagnose or treat emergencies."
        : "MedPilot cannot diagnose, prescribe, change a dose, or tell you to start or stop medication. Please review questions like this with a healthcare professional.";
    return chatResponseSchema.parse({
      documentId: input.documentId,
      language: input.language,
      answer,
      groundingStatus: "SAFETY_RESTRICTED",
      sourceContextIndicator: "NONE",
      safetyStatus: safety.safetyStatus,
      safetyNotes: safety.safetyNotes,
      disclaimer: disclaimer(),
      spokenText: answer,
    });
  }

  if (OFF_DOCUMENT_RE.test(input.message)) {
    const answer =
      "That question is not answered by the uploaded document. MedPilot only explains information in this document and does not add general medical advice.";
    return chatResponseSchema.parse({
      documentId: input.documentId,
      language: input.language,
      answer,
      groundingStatus: "INSUFFICIENT_INFORMATION",
      sourceContextIndicator: "NONE",
      safetyStatus: "ok",
      safetyNotes: safety.safetyNotes,
      disclaimer: disclaimer(),
      spokenText: answer,
    });
  }

  const lowered = input.message.toLowerCase();
  const fixtureKeywords = isDemoFixtureId(input.documentId)
    ? getFixtureKeywords(input.documentId)
    : ["document", "summary", "written", "report"];
  const grounded =
    /\b(this document|what does (this|it) say|summar|explain)\b/i.test(input.message) ||
    fixtureKeywords.some((keyword) => lowered.includes(keyword.toLowerCase()));

  if (!grounded) {
    const answer =
      "There is not enough information in this document to answer that question. Unreadable or missing details were not guessed.";
    return chatResponseSchema.parse({
      documentId: input.documentId,
      language: input.language,
      answer,
      groundingStatus: "INSUFFICIENT_INFORMATION",
      sourceContextIndicator: "NONE",
      safetyStatus: "ok",
      safetyNotes: safety.safetyNotes,
      disclaimer: disclaimer(),
      spokenText: answer,
    });
  }

  let answer =
    "This answer is based on the document text that could be read. It explains what is written and is not a diagnosis or a new prescription.";
  if (isDemoFixtureId(input.documentId)) {
    const analysis = getFixtureAnalysis(input.documentId, input.language);
    answer = `${analysis.summary} This is based on the sample document only.`;
  }

  return chatResponseSchema.parse({
    documentId: input.documentId,
    language: input.language,
    answer,
    groundingStatus: "SUPPORTED_BY_DOCUMENT",
    sourceContextIndicator: "DOCUMENT_OCR_AND_ANALYSIS",
    safetyStatus: "ok",
    safetyNotes: safety.safetyNotes,
    disclaimer: disclaimer(),
    spokenText: answer,
  });
}
