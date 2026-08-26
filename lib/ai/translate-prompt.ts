export const TRANSLATION_TASK = "MEDPILOT_TRANSLATE_V1";

export function isTranslatableLanguage(language: string): language is "hi" | "bn" {
  return language === "hi" || language === "bn";
}

export function buildTranslationPrompt(input: {
  targetLanguage: "hi" | "bn";
  strings: Record<string, string>;
}): string {
  const languageName = input.targetLanguage === "hi" ? "Hindi" : "Bengali";
  return [
    TRANSLATION_TASK,
    "You are a translator for MedPilot, a medical-document understanding prototype.",
    "Translate the JSON string values into " + languageName + ".",
    "Do NOT re-analyze any medical document. Do NOT add, remove, or reinterpret medical facts.",
    "Do NOT invent missing information. Do NOT diagnose, prescribe, or change meaning.",
    "Keep every number, unit, medicine name, and Latin/extracted document token exactly as given.",
    "Keep hedges such as unreadable, not guessed, not a diagnosis, and professional review.",
    "Do not weaken the disclaimer.",
    "Return one JSON object: {\"translations\": {\"<same keys>\": \"<translated value>\"}}.",
    "Every input key must be present. Do not add keys. Values must be non-empty strings.",
    "",
    "INPUT_STRINGS_JSON:",
    JSON.stringify(input.strings),
  ].join("\n");
}
