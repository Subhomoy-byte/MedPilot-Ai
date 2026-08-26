import { describe, expect, it } from "vitest";
import { getGeminiModel, getServerEnvSummary, isGeminiConfigured } from "@/lib/env";

describe("environment configuration", () => {
  it("defaults GEMINI_MODEL to gemini-2.5-flash", () => {
    const previous = process.env.GEMINI_MODEL;
    delete process.env.GEMINI_MODEL;
    expect(getGeminiModel()).toBe("gemini-2.5-flash");
    process.env.GEMINI_MODEL = previous;
  });

  it("never returns the API key from the public summary", () => {
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "secret-must-not-appear";
    const summary = getServerEnvSummary();
    expect(summary.geminiConfigured).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("secret-must-not-appear");
    process.env.GEMINI_API_KEY = previousKey;
  });

  it("reports geminiConfigured false when the key is empty", () => {
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "";
    expect(isGeminiConfigured()).toBe(false);
    process.env.GEMINI_API_KEY = previousKey;
  });
});
