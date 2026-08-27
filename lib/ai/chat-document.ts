import { translateChatResponse } from "@/lib/ai/translate";
import { generateJsonFromGemini } from "@/lib/ai/generate-json";
import { buildDocumentChatPrompt } from "@/lib/ai/chat-prompt";
import { parseAndValidateChatModelOutput } from "@/lib/ai/validate-chat";
import { GeminiInvalidResponseError } from "@/lib/ai/validate-analysis";
import { GeminiUnavailableError } from "@/lib/ai/errors";
import { appendChatTurns, getChatTurns } from "@/lib/chat/turns";
import { questionIsSupportedByDocument, answerIsSupportedByDocument } from "@/lib/chat/grounding";
import { getFixtureAnalysis, getFixtureOcr } from "@/lib/demo/fixtures";
import { buildChatResponse } from "@/lib/demo/chat";
import { isDemoMode } from "@/lib/env";
import { normalizeOcrText } from "@/lib/ocr/normalize";
import {
  applyChatAnswerSafety,
  buildSafetyBlockedChatResponse,
  chatDisclaimer,
} from "@/lib/safety/chat-response";
import { evaluateTextSafety } from "@/lib/safety/evaluate-text";
import { chatResponseSchema, medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type { ResolvedDocument } from "@/lib/documents/resolve";
import {
  CANONICAL_DISCLAIMER_TEXT,
  EMERGENCY_REDIRECT_MESSAGE,
  noteNotDiagnosis,
  noteProfessionalReview,
} from "@/lib/safety/messages";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import type { DocumentRecord } from "@/lib/storage/types";
import type { ChatResponse, ErrorCode, LanguageCode, MedPilotAnalysis } from "@/types";

export class ChatDocumentError extends Error {
  readonly code: Extract<ErrorCode, "DOCUMENT_NOT_READY" | "OCR_FAILED">;

  constructor(code: Extract<ErrorCode, "DOCUMENT_NOT_READY" | "OCR_FAILED">) {
    super(code);
    this.name = "ChatDocumentError";
    this.code = code;
  }
}

function insufficientResponse(input: {
  documentId: string;
  language: LanguageCode;
  message: string;
}): ChatResponse {
  const decision = evaluateTextSafety(input.message);
  const answer =
    "There is not enough information in this document to answer that question. Unreadable or missing details were not guessed.";
  return chatResponseSchema.parse({
    documentId: input.documentId,
    language: input.language,
    answer,
    groundingStatus: "INSUFFICIENT_INFORMATION",
    sourceContextIndicator: "NONE",
    safetyStatus: "ok",
    safetyNotes: decision.safetyNotes,
    disclaimer: chatDisclaimer(),
    spokenText: answer,
  });
}

function withPreservedUncertainty(response: ChatResponse, analysis: MedPilotAnalysis): ChatResponse {
  if (!analysis.needsReview && analysis.uncertainties.length === 0) {
    return chatResponseSchema.parse({
      ...response,
      disclaimer: chatDisclaimer(),
      spokenText: response.spokenText.trim().length > 0 ? response.spokenText : response.answer,
    });
  }
  const notes = [...response.safetyNotes];
  for (const item of analysis.uncertainties) {
    if (!notes.some((note) => note.code === item.code && note.message === item.message)) {
      notes.push({
        code: item.code,
        message: item.message,
        severity: "warning",
      });
    }
  }
  return chatResponseSchema.parse({
    ...response,
    safetyNotes: notes,
    disclaimer: chatDisclaimer(),
    spokenText: response.spokenText.trim().length > 0 ? response.spokenText : response.answer,
  });
}
function analysisFromStoredRecord(record: DocumentRecord, language: LanguageCode): MedPilotAnalysis {
  const confidence = record.ocrConfidence ?? 0;
  const confidenceLevel = classifyConfidence(confidence);
  const needsReview = ocrNeedsReview(confidenceLevel);
  const narrative =
    "Chat answers must use only the uploaded document text that could be read. Unreadable details were not guessed.";
  return medPilotAnalysisSchema.parse({
    documentId: record.documentId,
    status: "analysis_complete",
    documentType: "unknown",
    language,
    source: "live",
    expiresAt: record.expiresAt,
    summary: narrative,
    spokenText: narrative,
    medicines: [],
    tests: [],
    interactionAlerts: [],
    uncertainties: [],
    safetyNotes: [noteNotDiagnosis(), noteProfessionalReview()],
    emergencyFlags: {
      flagged: false,
      triggerPhrases: [],
      note: EMERGENCY_REDIRECT_MESSAGE,
    },
    warnings: [],
    disclaimer: { text: CANONICAL_DISCLAIMER_TEXT },
    ocr: { confidence, confidenceLevel, needsReview },
    needsReview,
  });
}

function loadContext(resolved: ResolvedDocument, language: LanguageCode): {
  ocrText: string;
  analysis: MedPilotAnalysis;
} {
  if (resolved.kind === "fixture") {
    return {
      ocrText: getFixtureOcr(resolved.documentId).text,
      analysis: getFixtureAnalysis(resolved.documentId, language),
    };
  }

  if (resolved.record.status !== "ocr_complete" && resolved.record.status !== "analysis_complete") {
    throw new ChatDocumentError("DOCUMENT_NOT_READY");
  }
  if (!resolved.record.ocrText) {
    throw new ChatDocumentError("OCR_FAILED");
  }

  return {
    ocrText: resolved.record.ocrText,
    analysis: analysisFromStoredRecord(resolved.record, language),
  };
}

/**
 * Document-grounded chat. Safety runs before Gemini and again on the validated answer.
 */
export async function handleDocumentChat(input: {
  resolved: ResolvedDocument;
  language: LanguageCode;
  message: string;
}): Promise<ChatResponse> {
  const blocked = buildSafetyBlockedChatResponse({
    documentId:
      input.resolved.kind === "fixture" ? input.resolved.documentId : input.resolved.record.documentId,
    language: input.language,
    message: input.message,
  });
  if (blocked) {
    appendChatTurns(blocked.documentId, [
      { role: "user", text: input.message },
      { role: "assistant", text: blocked.answer },
    ]);
    return translateChatResponse(blocked, input.language);
  }

  const documentId =
    input.resolved.kind === "fixture" ? input.resolved.documentId : input.resolved.record.documentId;
  const { ocrText, analysis } = loadContext(input.resolved, input.language);
  const normalizedOcr = normalizeOcrText(ocrText);

  if (!questionIsSupportedByDocument(input.message, normalizedOcr, analysis)) {
    const response = insufficientResponse({
      documentId,
      language: input.language,
      message: input.message,
    });
    appendChatTurns(documentId, [
      { role: "user", text: input.message },
      { role: "assistant", text: response.answer },
    ]);
    return translateChatResponse(response, input.language);
  }

  try {
    const generated = await generateJsonFromGemini(
      buildDocumentChatPrompt({
        documentId,
        message: input.message,
        ocrText: normalizedOcr,
        analysis,
        turns: getChatTurns(documentId),
      }),
    );
    const model = parseAndValidateChatModelOutput(generated.text);
    const drafted = chatResponseSchema.parse({
      documentId,
      language: input.language,
      answer: model.answer,
      groundingStatus:
        model.groundingStatus === "SAFETY_RESTRICTED"
          ? "SAFETY_RESTRICTED"
          : model.groundingStatus,
      sourceContextIndicator:
        model.groundingStatus === "INSUFFICIENT_INFORMATION" ? "NONE" : model.sourceContextIndicator,
      safetyStatus: "ok",
      safetyNotes: evaluateTextSafety(input.message).safetyNotes,
      disclaimer: chatDisclaimer(),
      spokenText: model.spokenText ?? model.answer,
    });
    let safe = applyChatAnswerSafety(drafted);
    if (
      safe.groundingStatus === "SUPPORTED_BY_DOCUMENT" &&
      !answerIsSupportedByDocument(`${safe.answer} ${safe.spokenText}`, normalizedOcr, analysis)
    ) {
      safe = insufficientResponse({
        documentId,
        language: input.language,
        message: input.message,
      });
    }
    safe = withPreservedUncertainty(safe, analysis);
    appendChatTurns(documentId, [
      { role: "user", text: input.message },
      { role: "assistant", text: safe.answer },
    ]);
    return translateChatResponse(safe, input.language);
  } catch (error) {
    if (isDemoMode()) {
      return translateChatResponse(
        buildChatResponse({
          documentId,
          language: input.language,
          message: input.message,
        }),
        input.language,
      );
    }
    if (error instanceof GeminiUnavailableError || error instanceof GeminiInvalidResponseError) {
      throw error;
    }
    throw new GeminiUnavailableError(true);
  }
}
