import { chatResponseSchema, medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type { ChatResponse, MedPilotAnalysis } from "@/types";

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2");
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  const isWrapped =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));
  if (!isWrapped) {
    return /[{[]/.test(trimmed) && /"[a-zA-Z]+"\s*:/.test(trimmed);
  }
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return /"[a-zA-Z]+"\s*:/.test(trimmed);
  }
}

/**
 * Language-agnostic cleanup for Web Speech. Does not invent medical content.
 */
export function sanitizeSpokenText(text: string): string {
  let spoken = stripMarkdown(text);
  spoken = spoken.replace(/\{[^{}]*"[^"]+"\s*:[^{}]*\}/g, " ");
  spoken = spoken.replace(/\s+/g, " ").trim();
  spoken = spoken.replace(/\bg\/dL\b/gi, "grams per deciliter");
  if (looksLikeJson(spoken)) {
    return "";
  }
  return spoken;
}

function mentionsReview(text: string): boolean {
  return /\b(review|unclear|guessed|could not be read|low reading|need a closer look|checked with a healthcare)\b/i.test(
    text,
  );
}

/**
 * Build speech-ready analysis spokenText from the validated object only.
 */
export function finalizeAnalysisSpokenText(analysis: MedPilotAnalysis): MedPilotAnalysis {
  let spoken = sanitizeSpokenText(analysis.spokenText);
  if (!spoken) {
    spoken = sanitizeSpokenText(analysis.summary);
  }
  if (analysis.needsReview && !mentionsReview(spoken)) {
    const review = analysis.uncertainties[0]?.message ?? analysis.warnings[0];
    if (review) {
      spoken = `${spoken} ${sanitizeSpokenText(review)}`.trim();
    }
  }
  return medPilotAnalysisSchema.parse({
    ...analysis,
    spokenText: spoken,
  });
}

/**
 * Chat spokenText stays aligned with the validated answer and is readable aloud.
 */
export function finalizeChatSpokenText(response: ChatResponse): ChatResponse {
  const fromSpoken = sanitizeSpokenText(response.spokenText);
  const fromAnswer = sanitizeSpokenText(response.answer);
  const spoken = fromSpoken || fromAnswer;
  return chatResponseSchema.parse({
    ...response,
    spokenText: spoken,
  });
}
