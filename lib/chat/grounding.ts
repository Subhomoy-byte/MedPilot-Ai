import type { MedPilotAnalysis } from "@/types";

const STOP_WORDS = new Set([
  "this",
  "that",
  "what",
  "does",
  "have",
  "with",
  "from",
  "your",
  "about",
  "please",
  "explain",
  "document",
  "written",
  "result",
  "report",
  "summar",
  "summary",
  "listed",
  "medicine",
  "today",
]);

const ANSWER_ALLOW = new Set([
  ...STOP_WORDS,
  "lists",
  "listed",
  "printed",
  "restates",
  "appears",
  "mentions",
  "unclear",
  "guessed",
  "review",
  "healthcare",
  "professional",
  "explanation",
  "confidence",
  "original",
  "details",
  "information",
  "tablet",
  "daily",
  "meals",
  "twice",
  "range",
  "reference",
  "strength",
  "directions",
  "instructions",
  "analysis",
  "laboratory",
  "grams",
  "gram",
  "milligrams",
  "milligram",
  "milliliter",
  "millilitre",
  "deciliter",
  "decilitre",
  "value",
  "values",
  "cannot",
  "could",
  "clearly",
  "another",
  "present",
]);

function haystack(ocrText: string, analysis: MedPilotAnalysis): string {
  const parts = [
    ocrText,
    analysis.summary,
    analysis.spokenText,
    ...analysis.medicines.flatMap((item) => [
      item.medicineNameAsExtracted ?? "",
      item.strengthAsWritten ?? "",
      item.instructionsAsWritten ?? "",
    ]),
    ...analysis.tests.flatMap((item) => [
      item.testNameAsExtracted ?? "",
      item.valueAsWritten ?? "",
      item.unitAsWritten ?? "",
      item.referenceRangeAsWritten ?? "",
    ]),
    ...analysis.uncertainties.map((item) => item.message),
  ];
  return parts.join(" ").toLowerCase();
}

/**
 * Document grounding only. Not a second safety engine.
 */
export function questionIsSupportedByDocument(
  message: string,
  ocrText: string,
  analysis: MedPilotAnalysis,
): boolean {
  const hay = haystack(ocrText, analysis);
  const tokens = message.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const content = tokens.filter((token) => !STOP_WORDS.has(token) && !token.startsWith("summar"));
  if (content.length === 0) {
    return /\b(this document|what does (this|it) say|summar|explain)\b/i.test(message);
  }
  return content.some((token) => hay.includes(token));
}

/**
 * True when the answer only uses numbers/names present in OCR or validated analysis.
 */
export function answerIsSupportedByDocument(
  answer: string,
  ocrText: string,
  analysis: MedPilotAnalysis,
): boolean {
  const hay = haystack(ocrText, analysis);
  const numbers = answer.match(/\d+(?:\.\d+)?/g) ?? [];
  if (numbers.some((value) => !hay.includes(value))) {
    return false;
  }

  const tokens = answer.toLowerCase().match(/[a-z][a-z-]{5,}/g) ?? [];
  for (const token of tokens) {
    if (ANSWER_ALLOW.has(token) || token.startsWith("summar")) {
      continue;
    }
    if (!hay.includes(token)) {
      return false;
    }
  }
  return true;
}
