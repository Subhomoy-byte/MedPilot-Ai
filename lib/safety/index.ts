import type { GroundingStatus, SafetyNote, SafetyStatus } from "@/types";

const DIAGNOSIS_RE =
  /\b(diagnos(?:e|is|ing)|what do i have|is this (cancer|diabetes|infection))\b/i;
const PRESCRIBE_RE = /\b(prescrib(?:e|ing)|write me a prescription)\b/i;
const START_STOP_RE =
  /\b((start|stop|quit) (taking|using)|increase (the )?dose|decrease (the )?dose|change (my|the) (dose|dosage))\b/i;
const INJECTION_RE =
  /\b(ignore (all |previous )?instructions|you are (now )?(a )?doctor|override safety)\b/i;
const EMERGENCY_RE =
  /\b(chest pain|can't breathe|cannot breathe|suicid|anaphylaxis|severe bleeding)\b/i;

export type ChatSafetyDecision = {
  groundingStatus: GroundingStatus | null;
  safetyStatus: SafetyStatus;
  safetyNotes: SafetyNote[];
};

/**
 * Application-level chat boundary for the mock API.
 * Full safety engine (analysis rewrite) is a later milestone.
 */
export function classifyChatSafety(message: string): ChatSafetyDecision {
  if (EMERGENCY_RE.test(message)) {
    return {
      groundingStatus: "SAFETY_RESTRICTED",
      safetyStatus: "emergency_redirect",
      safetyNotes: [
        {
          code: "EMERGENCY_REDIRECT",
          message:
            "If this is an emergency, seek urgent professional or emergency healthcare support immediately. MedPilot cannot diagnose or treat emergencies.",
          severity: "warning",
        },
      ],
    };
  }

  if (
    DIAGNOSIS_RE.test(message) ||
    PRESCRIBE_RE.test(message) ||
    START_STOP_RE.test(message) ||
    INJECTION_RE.test(message)
  ) {
    return {
      groundingStatus: "SAFETY_RESTRICTED",
      safetyStatus: "restricted",
      safetyNotes: [
        {
          code: "DOSAGE_BOUNDARY",
          message:
            "MedPilot cannot diagnose, prescribe, change a dose, or tell you to start or stop medication. Please review this with a healthcare professional.",
          severity: "warning",
        },
      ],
    };
  }

  return {
    groundingStatus: null,
    safetyStatus: "ok",
    safetyNotes: [
      {
        code: "NOT_A_DIAGNOSIS",
        message: "This answer explains the uploaded document. It is not a diagnosis.",
        severity: "info",
      },
    ],
  };
}
