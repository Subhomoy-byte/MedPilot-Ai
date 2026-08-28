import { apiError, apiSuccess, corsPreflight } from "@/lib/api/respond";
import { getFixtureOcr } from "@/lib/demo/fixtures";
import { resolveDocument } from "@/lib/documents/resolve";
import { extractText } from "@/lib/ocr/extract";
import { documentStore } from "@/lib/storage";
import { ocrRequestSchema, ocrResultSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Expected a JSON body with documentId.");
  }

  const parsed = ocrRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_FAILED", "documentId is required.");
  }

  const resolved = resolveDocument(parsed.data.documentId);
  if ("error" in resolved) {
    return apiError(resolved.error);
  }

  if (resolved.kind === "fixture") {
    return apiSuccess(getFixtureOcr(resolved.documentId));
  }

  documentStore.update(resolved.record.documentId, { status: "ocr_processing" });

  const extraction = await extractText({
    bytes: resolved.record.bytes,
    mimeType: resolved.record.mimeType,
  });

  if (!extraction.ok) {
    documentStore.update(resolved.record.documentId, { status: "failed" });
    return apiError("OCR_FAILED");
  }

  const updated = documentStore.update(resolved.record.documentId, {
    status: "ocr_complete",
    ocrText: extraction.extractedText,
    ocrConfidence: extraction.confidence,
  });

  if (!updated) {
    return apiError("DOCUMENT_NOT_FOUND");
  }

  const data = ocrResultSchema.parse({
    documentId: updated.documentId,
    status: "ocr_complete",
    source: "upload",
    text: extraction.extractedText,
    confidence: extraction.confidence,
    confidenceLevel: extraction.confidenceLevel,
    needsReview: extraction.needsReview,
    expiresAt: updated.expiresAt,
  });

  return apiSuccess(data);
}


export async function OPTIONS() {
  return corsPreflight();
}
