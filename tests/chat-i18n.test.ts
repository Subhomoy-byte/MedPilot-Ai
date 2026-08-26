import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateJsonFromGemini = vi.fn();

vi.mock("@/lib/ai/generate-json", () => ({
  generateJsonFromGemini: (...args: unknown[]) => generateJsonFromGemini(...args),
}));

import { POST as chatPost } from "@/app/api/chat/route";
import { translateChatResponse } from "@/lib/ai/translate";
import { TRANSLATION_TASK } from "@/lib/ai/translate-prompt";
import { DISCLAIMER_TEXT_EN } from "@/lib/constants";
import { resetChatTurnsForTests } from "@/lib/chat/turns";
import { readJson } from "./helpers";
import { resetDocumentStoreForTests } from "@/lib/storage/memory";
import {
  apiSuccessEnvelopeSchema,
  chatResponseSchema,
} from "@/lib/validation/schemas";

function chatRequest(message: string, language: string, documentId = "demo-lab-001") {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ documentId, message, language }),
  });
}

async function chatSuccess(message: string, language: string) {
  const response = await chatPost(chatRequest(message, language));
  return chatResponseSchema.parse(apiSuccessEnvelopeSchema.parse(await readJson(response)).data);
}

function groundedHemoglobinJson() {
  return {
    answer:
      "The report lists hemoglobin as 13.2 g/dL with a printed reference range of 12.0-15.0. This restates what is written.",
    groundingStatus: "SUPPORTED_BY_DOCUMENT",
    sourceContextIndicator: "DOCUMENT_OCR_AND_ANALYSIS",
    spokenText:
      "The report lists hemoglobin as 13.2 grams per deciliter with a printed reference range of 12.0 to 15.0.",
  };
}

function prefixTranslations(prompt: string, prefix: string): Record<string, string> {
  const raw = String(prompt).split("INPUT_STRINGS_JSON:\n")[1] ?? "{}";
  const strings = JSON.parse(raw) as Record<string, string>;
  return Object.fromEntries(Object.entries(strings).map(([key, value]) => [key, `${prefix}${value}`]));
}

function mockChatThenTranslate(prefix: "HI:" | "BN:") {
  generateJsonFromGemini.mockImplementation(async (prompt: string) => {
    if (String(prompt).includes(TRANSLATION_TASK)) {
      return {
        text: JSON.stringify({ translations: prefixTranslations(String(prompt), prefix) }),
        model: "gemini-2.5-flash",
      };
    }
    return {
      text: JSON.stringify(groundedHemoglobinJson()),
      model: "gemini-2.5-flash",
    };
  });
}

describe("POST /api/chat multilingual output", () => {
  beforeEach(() => {
    generateJsonFromGemini.mockReset();
    delete process.env.DEMO_MODE;
    mockChatThenTranslate("HI:");
  });

  afterEach(() => {
    resetDocumentStoreForTests();
    resetChatTurnsForTests();
    delete process.env.DEMO_MODE;
  });

  it("keeps English chat in English and does not call the translator", async () => {
    generateJsonFromGemini.mockImplementation(async (prompt: string) => {
      expect(String(prompt)).not.toContain(TRANSLATION_TASK);
      return {
        text: JSON.stringify(groundedHemoglobinJson()),
        model: "gemini-2.5-flash",
      };
    });
    const data = await chatSuccess("Explain this hemoglobin result", "en");
    expect(data.language).toBe("en");
    expect(data.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");
    expect(data.answer).toContain("13.2");
    expect(data.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(generateJsonFromGemini.mock.calls.every((call) => !String(call[0]).includes(TRANSLATION_TASK))).toBe(
      true,
    );
  });

  it("translates Hindi chat after English safety and grounding", async () => {
    const data = await chatSuccess("Explain this hemoglobin result", "hi");
    expect(data.language).toBe("hi");
    expect(data.answer.startsWith("HI:")).toBe(true);
    expect(data.spokenText.startsWith("HI:")).toBe(true);
    expect(data.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");
    expect(data.safetyStatus).toBe("ok");
    expect(generateJsonFromGemini.mock.calls.length).toBe(2);
    expect(String(generateJsonFromGemini.mock.calls[0]?.[0])).not.toContain(TRANSLATION_TASK);
    expect(String(generateJsonFromGemini.mock.calls[1]?.[0])).toContain(TRANSLATION_TASK);
  });

  it("translates Bengali chat after English safety and grounding", async () => {
    mockChatThenTranslate("BN:");
    const data = await chatSuccess("Explain this hemoglobin result", "bn");
    expect(data.language).toBe("bn");
    expect(data.answer.startsWith("BN:")).toBe(true);
    expect(data.spokenText.startsWith("BN:")).toBe(true);
    expect(data.disclaimer.text.startsWith("BN:")).toBe(true);
  });

  it("falls back to English when chat translation fails", async () => {
    generateJsonFromGemini.mockImplementation(async (prompt: string) => {
      if (String(prompt).includes(TRANSLATION_TASK)) {
        throw new Error("translator down");
      }
      return {
        text: JSON.stringify(groundedHemoglobinJson()),
        model: "gemini-2.5-flash",
      };
    });
    const data = await chatSuccess("Explain this hemoglobin result", "hi");
    expect(data.language).toBe("en");
    expect(data.answer).toContain("13.2");
    expect(data.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
  });

  it("falls back to English for an unsupported language", async () => {
    const english = chatResponseSchema.parse({
      documentId: "demo-lab-001",
      language: "en",
      answer: "The report lists hemoglobin as 13.2 g/dL.",
      groundingStatus: "SUPPORTED_BY_DOCUMENT",
      sourceContextIndicator: "DOCUMENT_OCR_AND_ANALYSIS",
      safetyStatus: "ok",
      safetyNotes: [
        {
          code: "NOT_A_DIAGNOSIS",
          message: "This is not a diagnosis.",
          severity: "info",
        },
      ],
      disclaimer: { text: DISCLAIMER_TEXT_EN },
      spokenText: "The report lists hemoglobin as 13.2 g/dL.",
    });
    const translated = await translateChatResponse(english, "fr");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
    expect(translated.language).toBe("en");
    expect(translated.answer).toBe(english.answer);
  });

  it("translates a safety-restricted response without calling chat Gemini", async () => {
    const data = await chatSuccess("What do I have? Is this cancer?", "hi");
    expect(data.groundingStatus).toBe("SAFETY_RESTRICTED");
    expect(data.safetyStatus).toBe("restricted");
    expect(data.language).toBe("hi");
    expect(data.answer.startsWith("HI:")).toBe(true);
    expect(data.safetyNotes.map((note) => note.code)).toContain("NOT_A_DIAGNOSIS");
    expect(data.safetyNotes.length).toBeGreaterThan(0);
    expect(generateJsonFromGemini.mock.calls.every((call) => String(call[0]).includes(TRANSLATION_TASK))).toBe(
      true,
    );
  });

  it("translates an insufficient-information response", async () => {
    mockChatThenTranslate("BN:");
    const data = await chatSuccess("What is the weather in Paris today?", "bn");
    expect(data.groundingStatus).toBe("INSUFFICIENT_INFORMATION");
    expect(data.language).toBe("bn");
    expect(data.answer.startsWith("BN:")).toBe(true);
    expect(data.spokenText).toBe(data.answer);
    expect(generateJsonFromGemini.mock.calls.every((call) => String(call[0]).includes(TRANSLATION_TASK))).toBe(
      true,
    );
  });

  it("never drops the disclaimer", async () => {
    const data = await chatSuccess("Explain this hemoglobin result", "hi");
    expect(data.disclaimer.text.length).toBeGreaterThan(0);
    expect(data.disclaimer.text.startsWith("HI:")).toBe(true);
    expect(data.disclaimer.text).toContain("MedPilot");
  });

  it("preserves uncertainty codes after translation", async () => {
    const data = await chatSuccess("Explain this hemoglobin result", "hi");
    expect(data.safetyNotes.some((note) => note.code === "LOW_OCR" || note.code === "NOT_A_DIAGNOSIS")).toBe(
      true,
    );
    expect(data.safetyNotes.every((note) => note.code.length > 0)).toBe(true);
    expect(data.safetyNotes.every((note) => note.message.startsWith("HI:"))).toBe(true);
  });

  it("preserves numeric document values in translated chat", async () => {
    const data = await chatSuccess("Explain this hemoglobin result", "hi");
    expect(data.answer).toContain("13.2");
    expect(data.spokenText).toContain("13.2");
    expect(data.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");
  });
});
