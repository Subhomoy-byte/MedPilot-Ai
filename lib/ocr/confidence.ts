import {
  HIGH_CONFIDENCE_MIN,
  MEDIUM_CONFIDENCE_MIN,
} from "@/lib/constants";
import type { ConfidenceLevel } from "@/types";

export function classifyConfidence(confidence: number): ConfidenceLevel {
  if (confidence >= HIGH_CONFIDENCE_MIN) {
    return "high";
  }
  if (confidence >= MEDIUM_CONFIDENCE_MIN) {
    return "medium";
  }
  return "low";
}

export function ocrNeedsReview(
  confidenceLevel: ConfidenceLevel,
  hasUncertainFields = false,
): boolean {
  return confidenceLevel === "medium" || confidenceLevel === "low" || hasUncertainFields;
}

export function analysisNeedsReview(input: {
  ocrNeedsReview: boolean;
  medicinesUncertain: boolean;
  testsUncertain: boolean;
}): boolean {
  return input.ocrNeedsReview || input.medicinesUncertain || input.testsUncertain;
}
