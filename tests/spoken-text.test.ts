import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const generateJsonFromGemini = vi.fn();

vi.mock("@/lib/ai/generate-json", () => ({
  generateJsonFromGemini: (...args: unknown[]) => generateJsonFromGemini(...args),
}));

import { translateAnalysis, translateChatResponse } from "@/lib/ai/translate";
import { finalizeAnalysisSpokenText, sanitizeSpokenText } from "@/lib/ai/spoken-text";
import { collectAnalysisStrings } from "@/lib/ai/translate-fields";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { DISCLAIMER_TEXT_EN } from "@/lib/constants";
import { chatResponseSchema, medPilotAnalysisSchema } from "@/lib/validation/schemas";

function prefixAll(strings: Record<string, string>, prefix: string): Record<string, string> {
  return Object.fromEntries(Object.entries(strings).map(([key, value]) => [key, `${prefix}${value}`]));
}

function chat(overrides: Record<string, unknown> = {}) {
  return chatResponseSchema.parse({
    documentId: "demo-lab-001",
    language: "en",
    answer: "The report lists hemoglobin as 13.2 g/dL.",
    groundingStatus: "SUPPORTED_BY_DOCUMENT",
    sourceContextIndicator: "DOCUMENT_OCR_AND_ANALYSIS",
    safetyStatus: "ok",
    safetyNotes: [
      {
        code: "NOT_A_DIAGNOSIS",
        message: "This explanation is for document understanding only. It is not a diagnosis.",
        severity: "info",
      },
      {
        code: "LOW_OCR",
        message: "Overall reading confidence is medium, so details should be checked against the original report.",
        severity: "warning",
      },
    ],
    disclaimer: { text: DISCLAIMER_TEXT_EN },
    spokenText: "The report lists hemoglobin as 13.2 g/dL.",
    ...overrides,
  });
}

describe("voice-ready spokenText", () => {
  beforeEach(() => {
    generateJsonFromGemini.mockReset();
  });

  afterEach(() => {
    generateJsonFromGemini.mockReset();
  });

  it("provides English analysis spokenText that can be read aloud", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    const result = await translateAnalysis(source, "en");
    expect(result.spokenText.length).toBeGreaterThan(0);
    expect(result.spokenText.toLowerCase()).toContain("metformin");
    expect(result.spokenText).toMatch(/500/);
    expect(result.spokenText.toLowerCase()).toMatch(/not a diagnosis|healthcare professional/);
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("provides Hindi analysis spokenText after translation", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    const prepared = finalizeAnalysisSpokenText(source);
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({ translations: prefixAll(collectAnalysisStrings(prepared), "HI:") }),
      model: "gemini-2.5-flash",
    });
    const result = await translateAnalysis(source, "hi");
    expect(result.language).toBe("hi");
    expect(result.spokenText.startsWith("HI:")).toBe(true);
    expect(result.spokenText).toMatch(/500/);
    expect(result.medicines[0]?.medicineNameAsExtracted).toBe("Metformin");
  });

  it("provides Bengali analysis spokenText after translation", async () => {
    const source = getFixtureAnalysis("demo-lab-001", "en");
    const prepared = finalizeAnalysisSpokenText(source);
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({ translations: prefixAll(collectAnalysisStrings(prepared), "BN:") }),
      model: "gemini-2.5-flash",
    });
    const result = await translateAnalysis(source, "bn");
    expect(result.language).toBe("bn");
    expect(result.spokenText.startsWith("BN:")).toBe(true);
    expect(result.spokenText).toContain("13.2");
  });

  it("provides English chat spokenText aligned with the answer", async () => {
    const result = await translateChatResponse(chat(), "en");
    expect(result.spokenText.length).toBeGreaterThan(0);
    expect(result.spokenText).toContain("13.2");
    expect(result.spokenText).toMatch(/grams per deciliter/i);
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("provides Hindi and Bengali chat spokenText after translation", async () => {
    generateJsonFromGemini.mockImplementation(async (prompt: string) => {
      const raw = String(prompt).split("INPUT_STRINGS_JSON:\n")[1] ?? "{}";
      const strings = JSON.parse(raw) as Record<string, string>;
      const prefix = String(prompt).includes("Hindi") ? "HI:" : "BN:";
      return {
        text: JSON.stringify({ translations: prefixAll(strings, prefix) }),
        model: "gemini-2.5-flash",
      };
    });
    const hindi = await translateChatResponse(chat(), "hi");
    expect(hindi.spokenText.startsWith("HI:")).toBe(true);
    expect(hindi.spokenText).toContain("13.2");
    const bengali = await translateChatResponse(chat(), "bn");
    expect(bengali.spokenText.startsWith("BN:")).toBe(true);
    expect(bengali.disclaimer.text.startsWith("BN:")).toBe(true);
  });

  it("removes Markdown from spokenText", () => {
    const source = medPilotAnalysisSchema.parse({
      ...getFixtureAnalysis("demo-prescription-001", "en"),
      spokenText: "**Metformin** 500 mg. See [the label](https://example.com). `dose` as written.",
    });
    const result = finalizeAnalysisSpokenText(source);
    expect(result.spokenText).not.toMatch(/[*#`\[]/);
    expect(result.spokenText).toContain("Metformin");
    expect(result.spokenText).toContain("500");
    expect(sanitizeSpokenText("## Heading\n**bold**")).not.toMatch(/[#*]/);
  });

  it("does not use raw JSON as spokenText", () => {
    const source = medPilotAnalysisSchema.parse({
      ...getFixtureAnalysis("demo-prescription-001", "en"),
      spokenText: '{"medicineNameAsExtracted":"Inventedil","dose":"999"}',
    });
    const result = finalizeAnalysisSpokenText(source);
    expect(result.spokenText.trim().startsWith("{")).toBe(false);
    expect(result.spokenText).not.toContain("Inventedil");
    expect(result.spokenText.toLowerCase()).toContain("metformin");
  });

  it("preserves safety information already present in spokenText", () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    const result = finalizeAnalysisSpokenText(source);
    expect(result.spokenText.toLowerCase()).toMatch(/not a diagnosis|healthcare professional/);
    expect(result.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(result.safetyNotes.length).toBe(source.safetyNotes.length);
    expect(result.uncertainties.length).toBe(source.uncertainties.length);
  });

  it("falls back to English spokenText when translation fails", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    generateJsonFromGemini.mockRejectedValue(new Error("translator down"));
    const result = await translateAnalysis(source, "hi");
    expect(result.language).toBe("en");
    expect(result.spokenText).not.toMatch(/[*`{}]/);
    expect(result.spokenText.toLowerCase()).toContain("metformin");
    const chatResult = await translateChatResponse(chat(), "hi");
    expect(chatResult.language).toBe("en");
    expect(chatResult.spokenText).toContain("13.2");
  });
});
