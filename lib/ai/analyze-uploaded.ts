import { buildDocumentAnalysisPrompt } from "@/lib/ai/analysis-prompt";
import { generateJsonFromGemini } from "@/lib/ai/generate-json";
import { parseAndValidateMedPilotAnalysis } from "@/lib/ai/validate-analysis";
import { mockAnalysisForUpload } from "@/lib/demo/mock-upload-analysis";
import { isDemoMode } from "@/lib/env";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import { hasUsableOcrText, normalizeOcrText } from "@/lib/ocr/normalize";
import type { DocumentRecord } from "@/lib/storage/types";
import { medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type { LanguageCode, MedPilotAnalysis } from "@/types";
import { GeminiInvalidResponseError } from "@/lib/ai/validate-analysis";
import { GeminiUnavailableError } from "@/lib/ai/errors";

export class AnalyzeDocumentError extends Error {
  readonly code: "DOCUMENT_NOT_READY" | "OCR_FAILED";

  constructor(code: "DOCUMENT_NOT_READY" | "OCR_FAILED") {
    super(code);
    this.name = "AnalyzeDocumentError";
    this.code = code;
  }
}

function storedOcr(record: DocumentRecord) {
  const confidence = record.ocrConfidence ?? 0;
  const confidenceLevel = classifyConfidence(confidence);
  return {
    confidence,
    confidenceLevel,
    needsReview: ocrNeedsReview(confidenceLevel),
  };
}

/**
 * Live Gemini analysis for an uploaded document that already has OCR.
 * Does not re-run Tesseract. Does not log OCR or prompts.
 */
export async function analyzeUploadedDocument(
  record: DocumentRecord,
  language: LanguageCode,
): Promise<MedPilotAnalysis> {
  if (record.status !== "ocr_complete" && record.status !== "analysis_complete" && record.status !== "analysis_processing") {
    throw new AnalyzeDocumentError("DOCUMENT_NOT_READY");
  }

  const rawText = record.ocrText;
  if (rawText === null || !hasUsableOcrText(rawText)) {
    throw new AnalyzeDocumentError("OCR_FAILED");
  }

  const normalizedOcrText = normalizeOcrText(rawText);
  const ocr = storedOcr(record);

  try {
    const prompt = buildDocumentAnalysisPrompt({
      documentId: record.documentId,
      expiresAt: record.expiresAt,
      normalizedOcrText,
      documentTypeHint: "unknown",
      ocr,
    });
    const generated = await generateJsonFromGemini(prompt);
    const validated = parseAndValidateMedPilotAnalysis(generated.text);
    const medicinesUncertain = validated.medicines.some((item) => item.uncertain);
    const testsUncertain = validated.tests.some((item) => item.uncertain);

    return medPilotAnalysisSchema.parse({
      ...validated,
      documentId: record.documentId,
      expiresAt: record.expiresAt,
      language,
      source: "live",
      ocr,
      needsReview: validated.needsReview || ocr.needsReview || medicinesUncertain || testsUncertain,
    });
  } catch (error) {
    if (isDemoMode()) {
      return mockAnalysisForUpload(record, language);
    }
    if (error instanceof GeminiUnavailableError || error instanceof GeminiInvalidResponseError) {
      throw error;
    }
    throw new GeminiUnavailableError(true);
  }
}
