import "server-only";
import { getGeminiModel } from "@/lib/env";
import { getGeminiClient } from "@/lib/ai/client";
import { GeminiUnavailableError, isRetryableGeminiError } from "@/lib/ai/errors";
import { GeminiInvalidResponseError } from "@/lib/ai/validate-analysis";

export const GEMINI_TIMEOUT_MS = 30_000;
export const GEMINI_MAX_ATTEMPTS = 3;

export type GeminiJsonResult = {
  text: string;
  model: string;
};

function toUnavailable(error: unknown): GeminiUnavailableError {
  if (error instanceof GeminiUnavailableError) {
    return error;
  }
  return new GeminiUnavailableError(isRetryableGeminiError(error));
}

export async function generateJsonFromGemini(prompt: string): Promise<GeminiJsonResult> {
  const model = getGeminiModel();
  let ai;
  try {
    ai = getGeminiClient();
  } catch {
    throw new GeminiUnavailableError(false);
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      });
      const text = response.text?.trim() ?? "";
      if (!text) {
        throw new GeminiInvalidResponseError("incomplete_analysis");
      }
      return { text, model };
    } catch (error) {
      if (error instanceof GeminiInvalidResponseError) {
        throw error;
      }
      lastError = error;
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: unknown }).status
          : undefined;
      console.error(
        `[gemini] attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} failed, model=${model}, status=${status}:`,
        error,
      );
      const retry = isRetryableGeminiError(error) && attempt < GEMINI_MAX_ATTEMPTS;
      if (!retry) {
        if (isRetryableGeminiError(error)) {
          throw new GeminiUnavailableError(true);
        }
        throw toUnavailable(error);
      }
    }
  }

  throw toUnavailable(lastError);
}
