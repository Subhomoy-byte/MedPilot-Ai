import type { z } from "zod";
import type {
  analysisOriginSchema,
  analyzeRequestSchema,
  apiErrorBodySchema,
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  chatRequestSchema,
  chatResponseSchema,
  confidenceLevelSchema,
  disclaimerSchema,
  documentMetadataSchema,
  documentSourceSchema,
  documentStatusSchema,
  documentTypeSchema,
  errorCodeSchema,
  groundingStatusSchema,
  healthDataSchema,
  interactionAlertSchema,
  interactionSupportSchema,
  languageCodeSchema,
  medPilotAnalysisSchema,
  medicineAnalysisSchema,
  ocrConfidenceSchema,
  ocrRequestSchema,
  ocrResultSchema,
  safetyNoteSchema,
  safetyStatusSchema,
  sourceContextIndicatorSchema,
  testAnalysisSchema,
  uncertaintySchema,
  uploadResultSchema,
} from "@/lib/validation/schemas";

export type LanguageCode = z.infer<typeof languageCodeSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentSource = z.infer<typeof documentSourceSchema>;
export type GroundingStatus = z.infer<typeof groundingStatusSchema>;
export type SafetyStatus = z.infer<typeof safetyStatusSchema>;
export type InteractionSupport = z.infer<typeof interactionSupportSchema>;
export type AnalysisOrigin = z.infer<typeof analysisOriginSchema>;
export type SourceContextIndicator = z.infer<typeof sourceContextIndicatorSchema>;
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export type Disclaimer = z.infer<typeof disclaimerSchema>;
export type Uncertainty = z.infer<typeof uncertaintySchema>;
export type SafetyNote = z.infer<typeof safetyNoteSchema>;
export type MedicineAnalysis = z.infer<typeof medicineAnalysisSchema>;
export type TestAnalysis = z.infer<typeof testAnalysisSchema>;
export type InteractionAlert = z.infer<typeof interactionAlertSchema>;
export type OcrConfidence = z.infer<typeof ocrConfidenceSchema>;
export type MedPilotAnalysis = z.infer<typeof medPilotAnalysisSchema>;
export type OcrResult = z.infer<typeof ocrResultSchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type HealthData = z.infer<typeof healthDataSchema>;
export type OcrRequest = z.infer<typeof ocrRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  error: null;
};
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
export type ApiSuccessEnvelopeUnknown = z.infer<typeof apiSuccessEnvelopeSchema>;
