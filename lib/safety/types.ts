import type { GroundingStatus, MedPilotAnalysis, SafetyNote, SafetyStatus } from "@/types";

export const SAFETY_CATEGORIES = [
  "diagnosis_request",
  "medication_start",
  "medication_stop",
  "dosage_modification",
  "unreadable_medicine",
  "missing_dosage",
  "missing_medical_information",
  "emergency_language",
  "low_ocr_confidence",
  "unsupported_medical_request",
] as const;

export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number];

export type SafetyFinding = {
  category: SafetyCategory;
  code: string;
  message: string;
  severity: "info" | "warning";
};

export type SafetyDecision = {
  findings: SafetyFinding[];
  categories: SafetyCategory[];
  safetyStatus: SafetyStatus;
  groundingStatus: GroundingStatus | null;
  safetyNotes: SafetyNote[];
};

export type AnalysisSafetyResult = {
  analysis: MedPilotAnalysis;
  decision: SafetyDecision;
};

export type ChatSafetyDecision = {
  groundingStatus: GroundingStatus | null;
  safetyStatus: SafetyStatus;
  safetyNotes: SafetyNote[];
};
