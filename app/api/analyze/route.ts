import { apiError, apiSuccess, corsPreflight } from "@/lib/api/respond";
import { analyzeUploadedDocument, AnalyzeDocumentError } from "@/lib/ai/analyze-uploaded";
import { GeminiUnavailableError } from "@/lib/ai/errors";
import { GeminiInvalidResponseError } from "@/lib/ai/validate-analysis";
import { getFixtureAnalysis, getFixtureOcr } from "@/lib/demo/fixtures";
import { enforceAnalysisSafety } from "@/lib/safety";
import { translateAnalysis } from "@/lib/ai/translate";
import { resolveDocument } from "@/lib/documents/resolve";
import { documentStore } from "@/lib/storage";
import { analyzeRequestSchema, medPilotAnalysisSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Expected a JSON body with documentId and language.");
  }

  const parsed = analyzeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_FAILED", "documentId and language (en, hi, or bn) are required.");
  }

  const resolved = await resolveDocument(parsed.data.documentId);
  if ("error" in resolved) {
    return apiError(resolved.error);
  }

  if (resolved.kind === "fixture") {
    const validated = medPilotAnalysisSchema.parse(
      getFixtureAnalysis(resolved.documentId, parsed.data.language),
    );
    const analysis = await translateAnalysis(
      enforceAnalysisSafety(validated, {
        ocrText: getFixtureOcr(resolved.documentId).text,
      }),
      parsed.data.language,
    );
    return apiSuccess(analysis);
  }

  if (resolved.record.status !== "ocr_complete" && resolved.record.status !== "analysis_complete") {
    return apiError("DOCUMENT_NOT_READY");
  }

  await documentStore.update(resolved.record.documentId, { status: "analysis_processing" });

  try {
    const analysis = await analyzeUploadedDocument(resolved.record, parsed.data.language);
    await documentStore.update(resolved.record.documentId, { status: "analysis_complete", lastAnalysis: analysis });
    return apiSuccess(analysis);
  } catch (error) {
    if (error instanceof AnalyzeDocumentError && error.code === "DOCUMENT_NOT_READY") {
      await documentStore.update(resolved.record.documentId, { status: resolved.record.status });
      return apiError("DOCUMENT_NOT_READY");
    }
    await documentStore.update(resolved.record.documentId, { status: "failed" });
    if (error instanceof AnalyzeDocumentError) {
      console.error(`[analyze] AnalyzeDocumentError code=${error.code}:`, error);
      return apiError(error.code);
    }
    if (error instanceof GeminiInvalidResponseError) {
      console.error("[analyze] GeminiInvalidResponseError:", error);
      return apiError("AI_INVALID_RESPONSE");
    }
    if (error instanceof GeminiUnavailableError) {
      console.error("[analyze] GeminiUnavailableError:", error);
      return apiError("AI_UNAVAILABLE", undefined, error.retryable);
    }
    console.error("[analyze] unexpected error (not a recognized error type):", error);
    return apiError("AI_UNAVAILABLE");
  }
}


export async function OPTIONS() {
  return corsPreflight();
}
