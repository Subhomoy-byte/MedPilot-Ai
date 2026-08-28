import { apiError, apiSuccess, corsPreflight } from "@/lib/api/respond";
import { handleDocumentChat, ChatDocumentError } from "@/lib/ai/chat-document";
import { GeminiUnavailableError } from "@/lib/ai/errors";
import { GeminiInvalidResponseError } from "@/lib/ai/validate-analysis";
import { validateChatMessage } from "@/lib/demo/chat";
import { resolveDocument } from "@/lib/documents/resolve";
import { chatRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Expected a JSON body with documentId, message, and language.");
  }

  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_FAILED", "documentId, message, and language (en, hi, or bn) are required.");
  }

  const messageCheck = validateChatMessage(parsed.data.message);
  if (!messageCheck.ok) {
    if (messageCheck.tooLong) {
      return apiError("MESSAGE_TOO_LONG");
    }
    return apiError("VALIDATION_FAILED", "message must not be empty.");
  }

  const resolved = await resolveDocument(parsed.data.documentId);
  if ("error" in resolved) {
    return apiError(resolved.error);
  }

  if (resolved.kind === "stored") {
    if (resolved.record.status !== "ocr_complete" && resolved.record.status !== "analysis_complete") {
      return apiError("DOCUMENT_NOT_READY");
    }
  }

  try {
    const data = await handleDocumentChat({
      resolved,
      language: parsed.data.language,
      message: messageCheck.trimmed,
    });
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ChatDocumentError) {
      return apiError(error.code);
    }
    if (error instanceof GeminiInvalidResponseError) {
      return apiError("AI_INVALID_RESPONSE");
    }
    if (error instanceof GeminiUnavailableError) {
      return apiError("AI_UNAVAILABLE", undefined, error.retryable);
    }
    return apiError("AI_UNAVAILABLE");
  }
}


export async function OPTIONS() {
  return corsPreflight();
}
