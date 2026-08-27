import { z } from "zod";

export const languageCodeSchema = z.enum(["en", "hi", "bn"]);
export const documentTypeSchema = z.enum([
  "prescription",
  "lab_report",
  "discharge_summary",
  "unknown",
]);
export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);
export const documentStatusSchema = z.enum([
  "uploaded",
  "ocr_processing",
  "ocr_complete",
  "analysis_processing",
  "analysis_complete",
  "failed",
]);
export const documentSourceSchema = z.enum(["upload", "demo_fixture"]);
export const groundingStatusSchema = z.enum([
  "SUPPORTED_BY_DOCUMENT",
  "INSUFFICIENT_INFORMATION",
  "SAFETY_RESTRICTED",
]);
export const safetyStatusSchema = z.enum(["ok", "restricted", "emergency_redirect"]);
export const interactionSupportSchema = z.enum([
  "document_supported",
  "insufficient_information",
]);
export const analysisOriginSchema = z.enum(["live", "demo_fixture"]);
export const safetyNoteSeveritySchema = z.enum(["info", "warning"]);
export const sourceContextIndicatorSchema = z.enum([
  "DOCUMENT_OCR_AND_ANALYSIS",
  "DOCUMENT_ANALYSIS",
  "NONE",
]);

export const errorCodeSchema = z.enum([
  "INVALID_FILE",
  "UNSUPPORTED_FILE",
  "FILE_TOO_LARGE",
  "TOO_MANY_PAGES",
  "OCR_FAILED",
  "OCR_LOW_CONFIDENCE",
  "DOCUMENT_NOT_READY",
  "DOCUMENT_NOT_FOUND",
  "DOCUMENT_EXPIRED",
  "AI_UNAVAILABLE",
  "AI_INVALID_RESPONSE",
  "VALIDATION_FAILED",
  "SAFETY_BLOCK",
  "MESSAGE_TOO_LONG",
  "UNAUTHORIZED",
  "INTERNAL_ERROR",
]);

export const apiErrorBodySchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  retryable: z.boolean(),
});

export const apiSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  error: z.null(),
});

export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  error: apiErrorBodySchema,
});

export const disclaimerSchema = z.object({
  text: z.string().min(1),
});

export const uncertaintySchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  relatedField: z.string().nullable(),
});

export const safetyNoteSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: safetyNoteSeveritySchema,
});

const unitInterval = z.number().min(0).max(1);

export const medicineAnalysisSchema = z.object({
  medicineNameAsExtracted: z.string().min(1).nullable(),
  strengthAsWritten: z.string().min(1).nullable(),
  instructionsAsWritten: z.string().min(1).nullable(),
  patientFriendlyExplanation: z.string().min(1),
  confidence: unitInterval,
  confidenceLevel: confidenceLevelSchema,
  uncertain: z.boolean(),
  uncertainReasons: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const testAnalysisSchema = z.object({
  testNameAsExtracted: z.string().min(1).nullable(),
  valueAsWritten: z.string().min(1).nullable(),
  unitAsWritten: z.string().min(1).nullable(),
  referenceRangeAsWritten: z.string().min(1).nullable(),
  flagAsWritten: z.string().min(1).nullable(),
  patientFriendlyExplanation: z.string().min(1),
  confidence: unitInterval,
  confidenceLevel: confidenceLevelSchema,
  uncertain: z.boolean(),
  uncertainReasons: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const interactionAlertSchema = z.object({
  summary: z.string().min(1),
  support: interactionSupportSchema,
  substancesAsWritten: z.array(z.string()),
  professionalReviewRequired: z.literal(true),
  warnings: z.array(z.string()),
});

export const ocrConfidenceSchema = z.object({
  confidence: unitInterval,
  confidenceLevel: confidenceLevelSchema,
  needsReview: z.boolean(),
});

export const medPilotAnalysisSchema = z.object({
  documentId: z.string().min(1),
  status: z.literal("analysis_complete"),
  documentType: documentTypeSchema,
  language: languageCodeSchema,
  source: analysisOriginSchema,
  expiresAt: z.string().nullable(),
  summary: z.string().min(1),
  spokenText: z.string().min(1),
  medicines: z.array(medicineAnalysisSchema),
  tests: z.array(testAnalysisSchema),
  interactionAlerts: z.array(interactionAlertSchema),
  uncertainties: z.array(uncertaintySchema),
  safetyNotes: z.array(safetyNoteSchema),
  emergencyFlags: z.object({
    flagged: z.boolean(),
    triggerPhrases: z.array(z.string()),
    note: z.string().min(1),
  }),
  warnings: z.array(z.string()),
  disclaimer: disclaimerSchema,
  ocr: ocrConfidenceSchema,
  needsReview: z.boolean(),
});

export const ocrResultSchema = z.object({
  documentId: z.string().min(1),
  status: z.literal("ocr_complete"),
  source: documentSourceSchema,
  text: z.string(),
  confidence: unitInterval,
  confidenceLevel: confidenceLevelSchema,
  needsReview: z.boolean(),
  expiresAt: z.string().nullable(),
});

export const uploadResultSchema = z.object({
  documentId: z.string().min(1),
  status: z.literal("uploaded"),
  source: z.literal("upload"),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  pageCount: z.number().int().positive().nullable(),
  expiresAt: z.string().min(1),
});

export const documentMetadataSchema = uploadResultSchema;

export const chatRequestSchema = z.object({
  documentId: z.string().min(1),
  message: z.string(),
  language: languageCodeSchema,
});

export const chatResponseSchema = z.object({
  documentId: z.string().min(1),
  language: languageCodeSchema,
  answer: z.string().min(1),
  groundingStatus: groundingStatusSchema,
  sourceContextIndicator: sourceContextIndicatorSchema,
  safetyStatus: safetyStatusSchema,
  safetyNotes: z.array(safetyNoteSchema),
  disclaimer: disclaimerSchema,
  spokenText: z.string().min(1),
});

export const healthDataSchema = z.object({
  status: z.literal("ok"),
  demoMode: z.boolean(),
  geminiConfigured: z.boolean(),
});

export const ocrRequestSchema = z.object({
  documentId: z.string().min(1),
});

export const analyzeRequestSchema = z.object({
  documentId: z.string().min(1),
  language: languageCodeSchema,
});
