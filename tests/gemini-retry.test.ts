import { afterEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/genai", () => {
  class GoogleGenAI {
    models = { generateContent };
    constructor(_options: { apiKey?: string }) {}
  }
  return { GoogleGenAI };
});

function httpError(status: number): Error & { status: number } {
  const error = new Error("upstream") as Error & { status: number };
  error.status = status;
  return error;
}

function timeoutError(): Error {
  const error = new Error("The operation was aborted due to timeout");
  error.name = "TimeoutError";
  return error;
}

describe("Gemini reliability", () => {
  afterEach(() => {
    vi.resetModules();
    generateContent.mockReset();
    delete process.env.GEMINI_API_KEY;
  });

  it("succeeds on the first attempt", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    generateContent.mockResolvedValue({ text: '{"ok":true}' });
    const { generateJsonFromGemini } = await import("@/lib/ai/generate-json");
    const result = await generateJsonFromGemini("prompt-must-not-appear-in-errors");
    expect(result.text).toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("retries HTTP 429 then succeeds", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    generateContent
      .mockRejectedValueOnce(httpError(429))
      .mockResolvedValueOnce({ text: '{"ok":true}' });
    const { generateJsonFromGemini } = await import("@/lib/ai/generate-json");
    await expect(generateJsonFromGemini("p")).resolves.toMatchObject({ text: '{"ok":true}' });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("retries HTTP 5xx then succeeds", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    generateContent
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce({ text: '{"ok":true}' });
    const { generateJsonFromGemini } = await import("@/lib/ai/generate-json");
    await expect(generateJsonFromGemini("p")).resolves.toMatchObject({ text: '{"ok":true}' });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("retries timeout then succeeds", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    generateContent
      .mockRejectedValueOnce(timeoutError())
      .mockResolvedValueOnce({ text: '{"ok":true}' });
    const { generateJsonFromGemini } = await import("@/lib/ai/generate-json");
    await expect(generateJsonFromGemini("p")).resolves.toMatchObject({ text: '{"ok":true}' });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("maps retry exhaustion to AI_UNAVAILABLE without leaking prompt or key", async () => {
    process.env.GEMINI_API_KEY = "secret-key-value";
    generateContent.mockRejectedValue(httpError(429));
    const { generateJsonFromGemini, GEMINI_MAX_ATTEMPTS } = await import("@/lib/ai/generate-json");
    const { GeminiUnavailableError } = await import("@/lib/ai/errors");
    try {
      await generateJsonFromGemini("OCR TEXT MUST NOT LEAK");
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiUnavailableError);
      expect((error as InstanceType<typeof GeminiUnavailableError>).code).toBe("AI_UNAVAILABLE");
      expect((error as InstanceType<typeof GeminiUnavailableError>).message).not.toContain("secret-key-value");
      expect((error as InstanceType<typeof GeminiUnavailableError>).message).not.toContain("OCR TEXT");
      expect(String(error)).not.toContain("OCR TEXT MUST NOT LEAK");
    }
    expect(generateContent).toHaveBeenCalledTimes(GEMINI_MAX_ATTEMPTS);
  });

  it("does not retry non-retryable HTTP 400", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    generateContent.mockRejectedValue(httpError(400));
    const { generateJsonFromGemini } = await import("@/lib/ai/generate-json");
    const { GeminiUnavailableError } = await import("@/lib/ai/errors");
    await expect(generateJsonFromGemini("p")).rejects.toBeInstanceOf(GeminiUnavailableError);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("does not retry missing API key", async () => {
    delete process.env.GEMINI_API_KEY;
    const { generateJsonFromGemini } = await import("@/lib/ai/generate-json");
    const { GeminiUnavailableError } = await import("@/lib/ai/errors");
    await expect(generateJsonFromGemini("p")).rejects.toMatchObject({
      code: "AI_UNAVAILABLE",
      retryable: false,
    });
    expect(generateContent).toHaveBeenCalledTimes(0);
    await expect(generateJsonFromGemini("p")).rejects.toBeInstanceOf(GeminiUnavailableError);
  });

  it("does not retry Zod/schema validation errors", async () => {
    const { isRetryableGeminiError } = await import("@/lib/ai/errors");
    const { GeminiInvalidResponseError } = await import("@/lib/ai/validate-analysis");
    expect(isRetryableGeminiError(new GeminiInvalidResponseError("malformed_json"))).toBe(false);
  });
});
