import { DISCLAIMER_TEXT_EN, INTERACTION_AWARENESS_TEXT_EN } from "@/lib/constants";
import type { SafetyNote, Uncertainty } from "@/types";

export const CANONICAL_DISCLAIMER_TEXT = DISCLAIMER_TEXT_EN;
export const INTERACTION_AWARENESS_TEXT = INTERACTION_AWARENESS_TEXT_EN;

export const SAFE_DOCUMENT_NARRATIVE =
  "This explanation describes information written in the document. It is not a diagnosis or a treatment decision. Please review the document with a healthcare professional.";

export const SAFE_MEDICATION_BOUNDARY =
  "MedPilot cannot diagnose, prescribe, change a dose, or tell you to start or stop medication. Please review this with a healthcare professional.";

export const EMERGENCY_REDIRECT_MESSAGE =
  "If this is an emergency, seek urgent professional or emergency healthcare support immediately. MedPilot cannot diagnose or treat emergencies.";

export const UNSUPPORTED_MEDICAL_MESSAGE =
  "MedPilot only explains information in the uploaded document and does not provide general medical advice from outside that document.";

export const UNREADABLE_MEDICINE_MESSAGE =
  "A medicine name could not be read clearly and was not guessed. Please check the original document with a healthcare professional.";

export const MISSING_STRENGTH_MESSAGE =
  "Strength or dose as written was not found on the document and was not filled in from general knowledge.";

export const MISSING_INSTRUCTIONS_MESSAGE =
  "Directions as written were not found on the document and were not guessed.";

export const MISSING_TEST_VALUE_MESSAGE =
  "A test name or value could not be read clearly and was not guessed.";

export const LOW_OCR_MESSAGE =
  "Some text was hard to read. Unclear details were not guessed. Please review the original document with a healthcare professional.";

export function noteNotDiagnosis(): SafetyNote {
  return {
    code: "NOT_A_DIAGNOSIS",
    message: "This explanation is for document understanding only. It is not a diagnosis.",
    severity: "info",
  };
}

export function noteProfessionalReview(): SafetyNote {
  return {
    code: "PROFESSIONAL_REVIEW",
    message: "Clinical decisions should be reviewed with a qualified healthcare professional.",
    severity: "info",
  };
}

export function noteDosageBoundary(): SafetyNote {
  return {
    code: "DOSAGE_BOUNDARY",
    message: SAFE_MEDICATION_BOUNDARY,
    severity: "warning",
  };
}

export function noteEmergencyRedirect(): SafetyNote {
  return {
    code: "EMERGENCY_REDIRECT",
    message: EMERGENCY_REDIRECT_MESSAGE,
    severity: "warning",
  };
}

export function uncertainty(code: string, message: string, relatedField: string | null): Uncertainty {
  return { code, message, relatedField };
}
