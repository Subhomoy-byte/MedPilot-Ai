import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateJsonFromGemini = vi.fn();

vi.mock("@/lib/ai/generate-json", () => ({
  generateJsonFromGemini: (...args: unknown[]) => generateJsonFromGemini(...args),
}));

import { translateAnalysis, translateChatResponse } from "@/lib/ai/translate";
import { collectAnalysisStrings } from "@/lib/ai/translate-fields";
import { TRANSLATION_TASK } from "@/lib/ai/translate-prompt";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { DISCLAIMER_TEXT_EN } from "@/lib/constants";
import { chatResponseSchema } from "@/lib/validation/schemas";

function hindiMap(strings: Record<string, string>): Record<string, string> {
  const translations: Record<string, string> = {};
  for (const [key, value] of Object.entries(strings)) {
    translations[key] = `HI:${value}`;
  }
  return translations;
}

describe("multilingual translation", () => {
  beforeEach(() => {
    generateJsonFromGemini.mockReset();
  });

  afterEach(() => {
    generateJsonFromGemini.mockReset();
  });

  it("keeps English as the canonical response without calling Gemini", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    const translated = await translateAnalysis(source, "en");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
    expect(translated.language).toBe("en");
    expect(translated.summary).toBe(source.summary);
    expect(translated.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(translated.medicines[0]?.medicineNameAsExtracted).toBe("Metformin");
    expect(translated.medicines[0]?.strengthAsWritten).toBe("500 mg");
  });

  it("translates Hindi user-facing text only", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    generateJsonFromGemini.mockImplementation(async (prompt: string) => {
      expect(String(prompt)).toContain(TRANSLATION_TASK);
      expect(String(prompt)).not.toContain("OCR_TEXT:");
      return {
        text: JSON.stringify({ translations: hindiMap(collectAnalysisStrings(source)) }),
        model: "gemini-2.5-flash",
      };
    });
    const translated = await translateAnalysis(source, "hi");
    expect(translated.language).toBe("hi");
    expect(translated.summary.startsWith("HI:")).toBe(true);
    expect(translated.spokenText.startsWith("HI:")).toBe(true);
    expect(translated.disclaimer.text.startsWith("HI:")).toBe(true);
    expect(translated.disclaimer.text.length).toBeGreaterThan(0);
    expect(translated.medicines[0]?.medicineNameAsExtracted).toBe("Metformin");
    expect(translated.medicines[0]?.strengthAsWritten).toBe("500 mg");
    expect(translated.medicines[0]?.instructionsAsWritten).toBe(source.medicines[0]?.instructionsAsWritten);
    expect(translated.medicines[0]?.patientFriendlyExplanation.startsWith("HI:")).toBe(true);
  });

  it("translates Bengali user-facing text only", async () => {
    const source = getFixtureAnalysis("demo-lab-001", "en");
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({
        translations: Object.fromEntries(
          Object.entries(collectAnalysisStrings(source)).map(([key, value]) => [key, `BN:${value}`]),
        ),
      }),
      model: "gemini-2.5-flash",
    });
    const translated = await translateAnalysis(source, "bn");
    expect(translated.language).toBe("bn");
    expect(translated.summary.startsWith("BN:")).toBe(true);
    expect(translated.tests[0]?.testNameAsExtracted).toBe("Hemoglobin");
    expect(translated.tests[0]?.valueAsWritten).toBe("13.2");
    expect(translated.tests[0]?.unitAsWritten).toBe("g/dL");
  });

  it("falls back to English when translation fails", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    generateJsonFromGemini.mockRejectedValue(new Error("translator down"));
    const translated = await translateAnalysis(source, "hi");
    expect(translated.language).toBe("en");
    expect(translated.summary).toBe(source.summary);
    expect(translated.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
  });

  it("falls back to English for an unsupported language", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    const translated = await translateAnalysis(source, "fr");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
    expect(translated.language).toBe("en");
    expect(translated.summary).toBe(source.summary);
  });

  it("preserves safety note codes while translating messages", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({ translations: hindiMap(collectAnalysisStrings(source)) }),
      model: "gemini-2.5-flash",
    });
    const translated = await translateAnalysis(source, "hi");
    expect(translated.safetyNotes.map((item) => item.code)).toEqual(source.safetyNotes.map((item) => item.code));
    expect(translated.safetyNotes.length).toBe(source.safetyNotes.length);
    expect(translated.safetyNotes[0]?.message.startsWith("HI:")).toBe(true);
  });

  it("preserves uncertainty codes, related fields, and array length", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({ translations: hindiMap(collectAnalysisStrings(source)) }),
      model: "gemini-2.5-flash",
    });
    const translated = await translateAnalysis(source, "hi");
    expect(translated.uncertainties.length).toBe(source.uncertainties.length);
    expect(translated.uncertainties.map((item) => item.code)).toEqual(source.uncertainties.map((item) => item.code));
    expect(translated.uncertainties.map((item) => item.relatedField)).toEqual(
      source.uncertainties.map((item) => item.relatedField),
    );
    expect(translated.uncertainties[0]?.message.startsWith("HI:")).toBe(true);
    expect(translated.medicines[1]?.medicineNameAsExtracted).toBeNull();
    expect(translated.needsReview).toBe(source.needsReview);
  });

  it("preserves the disclaimer object", async () => {
    const source = getFixtureAnalysis("demo-discharge-001", "en");
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({ translations: hindiMap(collectAnalysisStrings(source)) }),
      model: "gemini-2.5-flash",
    });
    const translated = await translateAnalysis(source, "hi");
    expect(translated.disclaimer.text.length).toBeGreaterThan(0);
    expect(translated.disclaimer.text.startsWith("HI:")).toBe(true);
    expect(translated.warnings.length).toBe(source.warnings.length);
  });

  it("preserves numeric confidence and extracted numeric values", async () => {
    const source = getFixtureAnalysis("demo-lab-001", "en");
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({
        translations: Object.fromEntries(
          Object.entries(collectAnalysisStrings(source)).map(([key, value]) => [key, `BN:${value}`]),
        ),
      }),
      model: "gemini-2.5-flash",
    });
    const translated = await translateAnalysis(source, "bn");
    expect(translated.ocr.confidence).toBe(source.ocr.confidence);
    expect(translated.ocr.confidenceLevel).toBe(source.ocr.confidenceLevel);
    expect(translated.tests[0]?.confidence).toBe(source.tests[0]?.confidence);
    expect(translated.tests[0]?.valueAsWritten).toBe("13.2");
    expect(translated.tests[0]?.referenceRangeAsWritten).toBe("12.0-15.0");
  });

  it("preserves medicine names and other as-written fields", async () => {
    const source = getFixtureAnalysis("demo-prescription-001", "en");
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({ translations: hindiMap(collectAnalysisStrings(source)) }),
      model: "gemini-2.5-flash",
    });
    const translated = await translateAnalysis(source, "hi");
    expect(translated.medicines[0]?.medicineNameAsExtracted).toBe("Metformin");
    expect(translated.medicines[0]?.strengthAsWritten).toBe("500 mg");
    expect(translated.medicines[0]?.uncertain).toBe(source.medicines[0]?.uncertain);
  });

  it("translates chat user-facing strings after safety", async () => {
    const chat = chatResponseSchema.parse({
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
      ],
      disclaimer: { text: DISCLAIMER_TEXT_EN },
      spokenText: "The report lists hemoglobin as 13.2 grams per deciliter.",
    });
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({
        translations: {
          answer: "HI:The report lists hemoglobin as 13.2 g/dL.",
          spokenText: "HI:The report lists hemoglobin as 13.2 grams per deciliter.",
          "disclaimer.text": `HI:${DISCLAIMER_TEXT_EN}`,
          "safetyNotes[0].message": "HI:This explanation is for document understanding only. It is not a diagnosis.",
        },
      }),
      model: "gemini-2.5-flash",
    });
    const translated = await translateChatResponse(chat, "hi");
    expect(translated.language).toBe("hi");
    expect(translated.answer.startsWith("HI:")).toBe(true);
    expect(translated.spokenText.startsWith("HI:")).toBe(true);
    expect(translated.safetyNotes[0]?.code).toBe("NOT_A_DIAGNOSIS");
    expect(translated.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");
    expect(translated.disclaimer.text.startsWith("HI:")).toBe(true);
  });
});
