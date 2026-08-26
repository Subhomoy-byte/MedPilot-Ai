import { afterEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/genai", () => {
  class GoogleGenAI {
    options: { apiKey?: string };
    models = { generateContent };
    constructor(options: { apiKey?: string }) {
      this.options = options;
    }
  }
  return { GoogleGenAI };
});

describe("Gemini server client", () => {
  afterEach(() => {
    vi.resetModules();
    generateContent.mockReset();
    delete process.env.GEMINI_API_KEY;
  });

  it("initializes GoogleGenAI with GEMINI_API_KEY and never puts the key in a URL", async () => {
    process.env.GEMINI_API_KEY = "test-key-not-for-urls";
    const { getGeminiClient } = await import("@/lib/ai/client");
    const client = getGeminiClient() as unknown as { options: { apiKey?: string } };
    expect(client.options.apiKey).toBe("test-key-not-for-urls");
    expect(JSON.stringify(client)).not.toMatch(/[?&]key=/);
  });

  it("calls generateContent through the SDK, not a query-string REST URL", async () => {
    process.env.GEMINI_API_KEY = "test-key-not-for-urls";
    generateContent.mockResolvedValue({ text: '{"ok":true}' });
    const { generateJsonFromGemini } = await import("@/lib/ai/generate-json");
    const result = await generateJsonFromGemini("return json");
    expect(result.text).toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledTimes(1);
    const arg = generateContent.mock.calls[0]?.[0] as {
      model: string;
      contents: string;
      config: { responseMimeType: string };
    };
    expect(arg.contents).toBe("return json");
    expect(arg.config.responseMimeType).toBe("application/json");
    expect(JSON.stringify(arg)).not.toContain("test-key-not-for-urls");
    expect(JSON.stringify(arg)).not.toMatch(/generativelanguage\.googleapis\.com.*key=/);
  });
});
