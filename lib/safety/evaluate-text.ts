import {
  DIAGNOSIS_RE,
  DOSAGE_MODIFICATION_RE,
  EMERGENCY_RE,
  isBoundarySentence,
  MEDICATION_START_RE,
  MEDICATION_STOP_RE,
  PROMPT_INJECTION_RE,
  UNSUPPORTED_MEDICAL_RE,
} from "@/lib/safety/patterns";
import {
  EMERGENCY_REDIRECT_MESSAGE,
  noteDosageBoundary,
  noteEmergencyRedirect,
  noteNotDiagnosis,
  SAFE_MEDICATION_BOUNDARY,
  UNSUPPORTED_MEDICAL_MESSAGE,
} from "@/lib/safety/messages";
import type { SafetyCategory, SafetyDecision, SafetyFinding } from "@/lib/safety/types";
import type { SafetyNote } from "@/types";

function finding(
  category: SafetyCategory,
  code: string,
  message: string,
  severity: SafetyFinding["severity"],
): SafetyFinding {
  return { category, code, message, severity };
}

function uniqueNotes(notes: SafetyNote[]): SafetyNote[] {
  const seen = new Set<string>();
  const result: SafetyNote[] = [];
  for (const note of notes) {
    if (seen.has(note.code)) {
      continue;
    }
    seen.add(note.code);
    result.push(note);
  }
  return result;
}

/**
 * Classify user or model text. Independent of Gemini.
 * Collects every matching category; status uses documented priority.
 */
function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((part) => part.trim()).filter(Boolean);
}

export function evaluateTextSafety(text: string): SafetyDecision {
  const source = text.trim();
  const findings: SafetyFinding[] = [];
  const notes: SafetyNote[] = [];

  for (const sentence of sentences(source)) {
    if (EMERGENCY_RE.test(sentence)) {
      findings.push(
        finding("emergency_language", "EMERGENCY_REDIRECT", EMERGENCY_REDIRECT_MESSAGE, "warning"),
      );
      notes.push(noteEmergencyRedirect());
      continue;
    }

    if (isBoundarySentence(sentence)) {
      continue;
    }

    if (DIAGNOSIS_RE.test(sentence)) {
      findings.push(
        finding(
          "diagnosis_request",
          "NOT_A_DIAGNOSIS",
          "MedPilot cannot diagnose conditions from a document or a question.",
          "warning",
        ),
      );
      notes.push(noteNotDiagnosis());
    }

    if (MEDICATION_START_RE.test(sentence)) {
      findings.push(
        finding("medication_start", "DOSAGE_BOUNDARY", SAFE_MEDICATION_BOUNDARY, "warning"),
      );
      notes.push(noteDosageBoundary());
    }

    if (MEDICATION_STOP_RE.test(sentence)) {
      findings.push(
        finding("medication_stop", "DOSAGE_BOUNDARY", SAFE_MEDICATION_BOUNDARY, "warning"),
      );
      notes.push(noteDosageBoundary());
    }

    if (DOSAGE_MODIFICATION_RE.test(sentence)) {
      findings.push(
        finding("dosage_modification", "DOSAGE_BOUNDARY", SAFE_MEDICATION_BOUNDARY, "warning"),
      );
      notes.push(noteDosageBoundary());
    }

    if (UNSUPPORTED_MEDICAL_RE.test(sentence)) {
      findings.push(
        finding(
          "unsupported_medical_request",
          "INSUFFICIENT_INFORMATION",
          UNSUPPORTED_MEDICAL_MESSAGE,
          "info",
        ),
      );
    }
  }

  if (PROMPT_INJECTION_RE.test(source)) {
    findings.push(
      finding(
        "unsupported_medical_request",
        "SAFETY_RESTRICTED",
        "Requests to override safety rules or act as a clinician are not allowed.",
        "warning",
      ),
    );
    notes.push(noteDosageBoundary());
  }

  const uniqueFindings: SafetyFinding[] = [];
  const seenCategories = new Set<SafetyCategory>();
  for (const item of findings) {
    if (seenCategories.has(item.category)) {
      continue;
    }
    seenCategories.add(item.category);
    uniqueFindings.push(item);
  }
  const categories = uniqueFindings.map((item) => item.category);
  const hasEmergency = categories.includes("emergency_language");
  const hasRestrictedContent =
    categories.includes("diagnosis_request") ||
    categories.includes("medication_start") ||
    categories.includes("medication_stop") ||
    categories.includes("dosage_modification") ||
    PROMPT_INJECTION_RE.test(source);
  const hasUnsupported = categories.includes("unsupported_medical_request") && !hasRestrictedContent;

  if (hasEmergency) {
    return {
      findings: uniqueFindings,
      categories,
      safetyStatus: "emergency_redirect",
      groundingStatus: "SAFETY_RESTRICTED",
      safetyNotes: uniqueNotes(notes),
    };
  }

  if (hasRestrictedContent) {
    return {
      findings: uniqueFindings,
      categories,
      safetyStatus: "restricted",
      groundingStatus: "SAFETY_RESTRICTED",
      safetyNotes: uniqueNotes(notes.length > 0 ? notes : [noteDosageBoundary()]),
    };
  }

  if (hasUnsupported) {
    return {
      findings: uniqueFindings,
      categories,
      safetyStatus: "ok",
      groundingStatus: "INSUFFICIENT_INFORMATION",
      safetyNotes: uniqueNotes([noteNotDiagnosis(), ...notes]),
    };
  }

  return {
    findings: uniqueFindings,
    categories,
    safetyStatus: "ok",
    groundingStatus: null,
    safetyNotes: uniqueNotes([noteNotDiagnosis()]),
  };
}
