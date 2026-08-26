import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateJsonFromGemini = vi.fn();

vi.mock("@/lib/ai/generate-json", () => ({
  generateJsonFromGemini: (...args: unknown[]) => generateJsonFromGemini(...args),
}));

import { POST as chatPost } from "@/app/api/chat/route";
import { GeminiUnavailableError } from "@/lib/ai/errors";
import { DISCLAIMER_TEXT_EN } from "@/lib/constants";
import { resetChatTurnsForTests } from "@/lib/chat/turns";
import { readJson } from "./helpers";
import { resetDocumentStoreForTests } from "@/lib/storage/memory";
import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  chatResponseSchema,
} from "@/lib/validation/schemas";

function chatRequest(message: string, documentId = "demo-lab-001") {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ documentId, message, language: "en" }),
  });
}

async function chatSuccess(message: string, documentId?: string) {
  const response = await chatPost(chatRequest(message, documentId));
  return chatResponseSchema.parse(apiSuccessEnvelopeSchema.parse(await readJson(response)).data);
}

describe("POST /api/chat document-grounded safety", () => {
  beforeEach(() => {
    generateJsonFromGemini.mockReset();
    delete process.env.DEMO_MODE;
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({
        answer:
          "The report lists hemoglobin as 13.2 g/dL with a printed reference range of 12.0-15.0. This restates what is written.",
        groundingStatus: "SUPPORTED_BY_DOCUMENT",
        sourceContextIndicator: "DOCUMENT_OCR_AND_ANALYSIS",
        spokenText:
          "The report lists hemoglobin as 13.2 grams per deciliter with a printed reference range of 12.0 to 15.0.",
      }),
      model: "gemini-2.5-flash",
    });
  });

  afterEach(() => {
    resetDocumentStoreForTests();
    resetChatTurnsForTests();
    delete process.env.DEMO_MODE;
  });

  it("answers a safe document question from OCR and analysis", async () => {
    const data = await chatSuccess("Explain this hemoglobin result");
    expect(data.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");
    expect(data.sourceContextIndicator).toBe("DOCUMENT_OCR_AND_ANALYSIS");
    expect(data.answer.toLowerCase()).toContain("hemoglobin");
    expect(data.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(data.spokenText.length).toBeGreaterThan(0);
    expect(data.safetyNotes.length).toBeGreaterThan(0);
    expect(generateJsonFromGemini).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(data)).not.toMatch(/GEMINI_API_KEY|AIza|prompt|ocrText/);
  });

  it("blocks diagnosis requests before Gemini", async () => {
    const data = await chatSuccess("What do I have? Is this cancer?");
    expect(data.groundingStatus).toBe("SAFETY_RESTRICTED");
    expect(data.safetyStatus).toBe("restricted");
    expect(data.safetyNotes.some((note) => note.code === "NOT_A_DIAGNOSIS")).toBe(true);
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("blocks dosage modification requests before Gemini", async () => {
    const data = await chatSuccess("Please increase the dose and prescribe a new dose.");
    expect(data.groundingStatus).toBe("SAFETY_RESTRICTED");
    expect(data.safetyNotes.some((note) => note.code === "DOSAGE_BOUNDARY")).toBe(true);
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("blocks start medication requests before Gemini", async () => {
    const data = await chatSuccess("Should I start taking this and write me a prescription?");
    expect(data.groundingStatus).toBe("SAFETY_RESTRICTED");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("blocks stop medication requests before Gemini", async () => {
    const data = await chatSuccess("Tell me to stop taking this medicine.");
    expect(data.groundingStatus).toBe("SAFETY_RESTRICTED");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("redirects emergency requests before Gemini", async () => {
    const data = await chatSuccess("I have severe chest pain and cannot breathe.");
    expect(data.groundingStatus).toBe("SAFETY_RESTRICTED");
    expect(data.safetyStatus).toBe("emergency_redirect");
    expect(data.safetyNotes.some((note) => note.code === "EMERGENCY_REDIRECT")).toBe(true);
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("does not answer unsupported medical questions from general knowledge", async () => {
    const data = await chatSuccess("What is the best antibiotic for this? Recommend a treatment.");
    expect(data.groundingStatus).toBe("INSUFFICIENT_INFORMATION");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("returns DOCUMENT_NOT_FOUND for a missing document", async () => {
    const response = await chatPost(chatRequest("Explain this hemoglobin result", "missing-chat-id"));
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("DOCUMENT_NOT_FOUND");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
    expect(JSON.stringify(body)).not.toMatch(/stack|GEMINI_API_KEY/);
  });

  it("returns AI_UNAVAILABLE when Gemini fails", async () => {
    generateJsonFromGemini.mockRejectedValue(new GeminiUnavailableError(true));
    const response = await chatPost(chatRequest("Explain this hemoglobin result"));
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("AI_UNAVAILABLE");
    expect(body.error.retryable).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/prompt|ocrText|GEMINI_API_KEY/);
  });

  it("returns a schema-valid ChatResponse", async () => {
    const data = await chatSuccess("Explain this hemoglobin result");
    const parsed = chatResponseSchema.parse(data);
    expect(parsed.documentId).toBe("demo-lab-001");
    expect(parsed.language).toBe("en");
    expect(parsed.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(parsed.spokenText.length).toBeGreaterThan(0);
  });
});
