import type { ChatResponse, MedPilotAnalysis } from "@/types";

export function collectAnalysisStrings(analysis: MedPilotAnalysis): Record<string, string> {
  const strings: Record<string, string> = {
    summary: analysis.summary,
    spokenText: analysis.spokenText,
    "disclaimer.text": analysis.disclaimer.text,
    "emergencyFlags.note": analysis.emergencyFlags.note,
  };

  analysis.emergencyFlags.triggerPhrases.forEach((value, index) => {
    strings[`emergencyFlags.triggerPhrases[${index}]`] = value;
  });

  analysis.warnings.forEach((value, index) => {
    strings[`warnings[${index}]`] = value;
  });
  analysis.uncertainties.forEach((item, index) => {
    strings[`uncertainties[${index}].message`] = item.message;
  });
  analysis.safetyNotes.forEach((item, index) => {
    strings[`safetyNotes[${index}].message`] = item.message;
  });
  analysis.medicines.forEach((item, index) => {
    strings[`medicines[${index}].patientFriendlyExplanation`] = item.patientFriendlyExplanation;
    item.warnings.forEach((value, warningIndex) => {
      strings[`medicines[${index}].warnings[${warningIndex}]`] = value;
    });
  });
  analysis.tests.forEach((item, index) => {
    strings[`tests[${index}].patientFriendlyExplanation`] = item.patientFriendlyExplanation;
    item.warnings.forEach((value, warningIndex) => {
      strings[`tests[${index}].warnings[${warningIndex}]`] = value;
    });
  });
  analysis.interactionAlerts.forEach((item, index) => {
    strings[`interactionAlerts[${index}].summary`] = item.summary;
    item.warnings.forEach((value, warningIndex) => {
      strings[`interactionAlerts[${index}].warnings[${warningIndex}]`] = value;
    });
  });

  return strings;
}

export function collectChatStrings(response: ChatResponse): Record<string, string> {
  const strings: Record<string, string> = {
    answer: response.answer,
    spokenText: response.spokenText,
    "disclaimer.text": response.disclaimer.text,
  };
  response.safetyNotes.forEach((item, index) => {
    strings[`safetyNotes[${index}].message`] = item.message;
  });
  return strings;
}

function translatedValue(translations: Record<string, string>, key: string): string | null {
  const value = translations[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value;
}

export function applyAnalysisTranslations(
  analysis: MedPilotAnalysis,
  translations: Record<string, string>,
  language: "hi" | "bn",
): MedPilotAnalysis | null {
  const keys = Object.keys(collectAnalysisStrings(analysis));
  for (const key of keys) {
    if (translatedValue(translations, key) === null) {
      return null;
    }
  }

  return {
    ...analysis,
    language,
    summary: translations.summary,
    spokenText: translations.spokenText,
    disclaimer: { text: translations["disclaimer.text"] },
    emergencyFlags: {
      ...analysis.emergencyFlags,
      note: translations["emergencyFlags.note"],
      triggerPhrases: analysis.emergencyFlags.triggerPhrases.map(
        (_, index) => translations[`emergencyFlags.triggerPhrases[${index}]`],
      ),
    },
    warnings: analysis.warnings.map((_, index) => translations[`warnings[${index}]`]),
    uncertainties: analysis.uncertainties.map((item, index) => ({
      ...item,
      message: translations[`uncertainties[${index}].message`],
    })),
    safetyNotes: analysis.safetyNotes.map((item, index) => ({
      ...item,
      message: translations[`safetyNotes[${index}].message`],
    })),
    medicines: analysis.medicines.map((item, index) => ({
      ...item,
      patientFriendlyExplanation: translations[`medicines[${index}].patientFriendlyExplanation`],
      warnings: item.warnings.map((_, warningIndex) => translations[`medicines[${index}].warnings[${warningIndex}]`]),
    })),
    tests: analysis.tests.map((item, index) => ({
      ...item,
      patientFriendlyExplanation: translations[`tests[${index}].patientFriendlyExplanation`],
      warnings: item.warnings.map((_, warningIndex) => translations[`tests[${index}].warnings[${warningIndex}]`]),
    })),
    interactionAlerts: analysis.interactionAlerts.map((item, index) => ({
      ...item,
      summary: translations[`interactionAlerts[${index}].summary`],
      warnings: item.warnings.map(
        (_, warningIndex) => translations[`interactionAlerts[${index}].warnings[${warningIndex}]`],
      ),
    })),
  };
}

export function applyChatTranslations(
  response: ChatResponse,
  translations: Record<string, string>,
  language: "hi" | "bn",
): ChatResponse | null {
  const keys = Object.keys(collectChatStrings(response));
  for (const key of keys) {
    if (translatedValue(translations, key) === null) {
      return null;
    }
  }

  return {
    ...response,
    language,
    answer: translations.answer,
    spokenText: translations.spokenText,
    disclaimer: { text: translations["disclaimer.text"] },
    safetyNotes: response.safetyNotes.map((item, index) => ({
      ...item,
      message: translations[`safetyNotes[${index}].message`],
    })),
  };
}
