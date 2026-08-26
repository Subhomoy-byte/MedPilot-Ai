import type { ErrorCode } from "@/types";
import { GeminiInvalidResponseError } from "@/lib/ai/validate-analysis";

export class GeminiUnavailableError extends Error {
  readonly code: Extract<ErrorCode, "AI_UNAVAILABLE"> = "AI_UNAVAILABLE";
  readonly retryable: boolean;

  constructor(retryable = true) {
    super("The analysis service is temporarily unavailable.");
    this.name = "GeminiUnavailableError";
    this.retryable = retryable;
  }
}

function httpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
    return (error as { status: number }).status;
  }
  if (
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return undefined;
}

function errorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }
  return "";
}

export function isRetryableGeminiError(error: unknown): boolean {
  if (error instanceof GeminiInvalidResponseError) {
    return false;
  }
  if (error instanceof GeminiUnavailableError) {
    return error.retryable;
  }

  const status = httpStatus(error);
  if (status === 400 || status === 401 || status === 403) {
    return false;
  }
  if (status === 429 || (status !== undefined && status >= 500 && status < 600)) {
    return true;
  }

  const name = errorName(error);
  if (name === "TimeoutError" || name === "AbortError") {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|fetch failed|network/i.test(message);
}
