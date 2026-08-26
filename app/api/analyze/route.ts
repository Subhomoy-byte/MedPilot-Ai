import { apiError, apiSuccess } from "@/lib/api/respond";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { mockAnalysisForUpload } from "@/lib/demo/mock-upload-analysis";
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

  const resolved = resolveDocument(parsed.data.documentId);
  if ("error" in resolved) {
    return apiError(resolved.error);
  }

  if (resolved.kind === "fixture") {
    const analysis = getFixtureAnalysis(resolved.documentId, parsed.data.language);
    return apiSuccess(medPilotAnalysisSchema.parse(analysis));
  }

  if (resolved.record.status !== "ocr_complete" && resolved.record.status !== "analysis_complete") {
    return apiError("DOCUMENT_NOT_READY");
  }

  if (resolved.record.ocrText !== null && resolved.record.ocrText.trim().length === 0) {
    return apiError("OCR_FAILED");
  }

  const analysis = mockAnalysisForUpload(resolved.record, parsed.data.language);
  documentStore.update(resolved.record.documentId, { status: "analysis_complete" });
  return apiSuccess(analysis);
}
