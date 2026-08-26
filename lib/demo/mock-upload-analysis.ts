import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import { medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type { DocumentRecord } from "@/lib/storage/types";
import type { LanguageCode, MedPilotAnalysis } from "@/types";

/** STEP 1 mock analysis for guest uploads. Not live Gemini. */
export function mockAnalysisForUpload(
  record: DocumentRecord,
  language: LanguageCode,
): MedPilotAnalysis {
  const template = getFixtureAnalysis("demo-prescription-001", language);
  const confidence = record.ocrConfidence ?? 0.7;
  const confidenceLevel = classifyConfidence(confidence);
  const payload: MedPilotAnalysis = {
    ...template,
    documentId: record.documentId,
    language,
    source: "demo_fixture",
    expiresAt: record.expiresAt,
    ocr: {
      confidence,
      confidenceLevel,
      needsReview: ocrNeedsReview(confidenceLevel, true),
    },
    needsReview: true,
    warnings: [
      ...template.warnings,
      "Live analysis is not enabled in this milestone. This is a deterministic mock explanation.",
    ],
  };
  return medPilotAnalysisSchema.parse(payload);
}
