import { generateJsonFromGemini } from "@/lib/ai/generate-json";
import {
  applyAnalysisTranslations,
  applyChatTranslations,
  collectAnalysisStrings,
  collectChatStrings,
} from "@/lib/ai/translate-fields";
import { buildTranslationPrompt, isTranslatableLanguage } from "@/lib/ai/translate-prompt";
import {
  finalizeAnalysisSpokenText,
  finalizeChatSpokenText,
  sanitizeSpokenText,
} from "@/lib/ai/spoken-text";
import { chatResponseSchema, medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type { ChatResponse, MedPilotAnalysis } from "@/types";

function parseTranslations(rawText: string, expectedKeys: string[]): Record<string, string> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const translations = record.translations;
  if (!translations || typeof translations !== "object") {
    return null;
  }
  const map = translations as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of expectedKeys) {
    const value = map[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      return null;
    }
    result[key] = value;
  }
  return result;
}

async function translateStringMap(
  strings: Record<string, string>,
  targetLanguage: "hi" | "bn",
): Promise<Record<string, string> | null> {
  try {
    const generated = await generateJsonFromGemini(
      buildTranslationPrompt({ targetLanguage, strings }),
    );
    return parseTranslations(generated.text, Object.keys(strings));
  } catch {
    return null;
  }
}

function englishAnalysis(analysis: MedPilotAnalysis): MedPilotAnalysis {
  return medPilotAnalysisSchema.parse({ ...analysis, language: "en" });
}

function englishChat(response: ChatResponse): ChatResponse {
  return chatResponseSchema.parse({ ...response, language: "en" });
}

/**
 * Translate user-facing analysis strings after safety. Canonical content is English.
 * As-written medical tokens, codes, confidence, nulls, and needsReview are not rewritten.
 */
export async function translateAnalysis(
  analysis: MedPilotAnalysis,
  language: string,
): Promise<MedPilotAnalysis> {
  const canonical = finalizeAnalysisSpokenText(englishAnalysis(analysis));
  if (!isTranslatableLanguage(language)) {
    return canonical;
  }

  const strings = collectAnalysisStrings(canonical);
  const translations = await translateStringMap(strings, language);
  if (!translations) {
    return canonical;
  }
  const translated = applyAnalysisTranslations(canonical, translations, language);
  if (!translated) {
    return canonical;
  }
  return medPilotAnalysisSchema.parse({
    ...translated,
    spokenText: sanitizeSpokenText(translated.spokenText) || canonical.spokenText,
  });
}

function safetyShapeIntact(original: ChatResponse, translated: ChatResponse): boolean {
  if (original.safetyNotes.length !== translated.safetyNotes.length) {
    return false;
  }
  if (translated.disclaimer.text.trim().length === 0) {
    return false;
  }
  return original.safetyNotes.every(
    (note, index) =>
      note.code === translated.safetyNotes[index]?.code &&
      note.severity === translated.safetyNotes[index]?.severity,
  );
}

/**
 * Translate user-facing chat strings after safety. Canonical content is English.
 */
export async function translateChatResponse(
  response: ChatResponse,
  language: string,
): Promise<ChatResponse> {
  const canonical = finalizeChatSpokenText(englishChat(response));
  if (!isTranslatableLanguage(language)) {
    return canonical;
  }

  const strings = collectChatStrings(canonical);
  const translations = await translateStringMap(strings, language);
  if (!translations) {
    return canonical;
  }
  const translated = applyChatTranslations(canonical, translations, language);
  if (!translated || !safetyShapeIntact(canonical, translated)) {
    return canonical;
  }
  return chatResponseSchema.parse({
    ...translated,
    groundingStatus: canonical.groundingStatus,
    safetyStatus: canonical.safetyStatus,
    sourceContextIndicator: canonical.sourceContextIndicator,
    spokenText: sanitizeSpokenText(translated.spokenText) || canonical.spokenText,
  });
}
