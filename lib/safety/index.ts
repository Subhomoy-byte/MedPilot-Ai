export { evaluateTextSafety } from "@/lib/safety/evaluate-text";
export { applyAnalysisSafety, enforceAnalysisSafety } from "@/lib/safety/apply-analysis";
export { applyChatAnswerSafety, buildSafetyBlockedChatResponse } from "@/lib/safety/chat-response";
export type { AnalysisSafetyContext } from "@/lib/safety/apply-analysis";
export type {
  AnalysisSafetyResult,
  ChatSafetyDecision,
  SafetyCategory,
  SafetyDecision,
  SafetyFinding,
} from "@/lib/safety/types";
export { SAFETY_CATEGORIES } from "@/lib/safety/types";

import { evaluateTextSafety } from "@/lib/safety/evaluate-text";
import type { ChatSafetyDecision } from "@/lib/safety/types";

/**
 * Chat-facing adapter over evaluateTextSafety.
 */
export function classifyChatSafety(message: string): ChatSafetyDecision {
  const decision = evaluateTextSafety(message);
  return {
    groundingStatus: decision.groundingStatus,
    safetyStatus: decision.safetyStatus,
    safetyNotes: decision.safetyNotes,
  };
}
