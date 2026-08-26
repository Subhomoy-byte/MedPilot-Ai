export function isDemoMode(value: string | undefined = process.env.DEMO_MODE): boolean {
  return String(value ?? "").trim().toLowerCase() === "true";
}

export function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim();
  return model && model.length > 0 ? model : "gemini-2.5-flash";
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getServerEnvSummary(): {
  demoMode: boolean;
  geminiConfigured: boolean;
  geminiModel: string;
} {
  return {
    demoMode: isDemoMode(),
    geminiConfigured: isGeminiConfigured(),
    geminiModel: getGeminiModel(),
  };
}
