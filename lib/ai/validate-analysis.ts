import type { ErrorCode, MedPilotAnalysis } from "@/types";
import { medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type { ZodError } from "zod";

export type GeminiInvalidReason =
  | "malformed_json"
  | "missing_field"
  | "incorrect_type"
  | "invalid_enum"
  | "invalid_confidence"
  | "incomplete_analysis";

export class GeminiInvalidResponseError extends Error {
  readonly code: Extract<ErrorCode, "AI_INVALID_RESPONSE"> = "AI_INVALID_RESPONSE";
  readonly retryable = true;
  readonly reason: GeminiInvalidReason;

  constructor(reason: GeminiInvalidReason, message = "The analysis result could not be validated.") {
    super(message);
    this.name = "GeminiInvalidResponseError";
    this.reason = reason;
  }
}

function reasonFromZod(error: ZodError): GeminiInvalidReason {
  for (const issue of error.issues) {
    const code = issue.code;
    const path = issue.path.map(String);
    const received = "received" in issue ? issue.received : undefined;
    const expected = "expected" in issue ? issue.expected : undefined;

    if (code === "invalid_enum_value" || code === "invalid_literal") {
      return "invalid_enum";
    }
    if (
      path.some((part) => part === "confidence") &&
      (code === "too_big" || code === "too_small" || (code === "invalid_type" && expected === "number"))
    ) {
      if (code === "too_big" || code === "too_small") {
        return "invalid_confidence";
      }
    }
    if (received === "undefined") {
      return "missing_field";
    }
    if (code === "invalid_type") {
      return "incorrect_type";
    }
  }
  return "incomplete_analysis";
}

/**
 * Parse Gemini JSON text and validate against the existing MedPilotAnalysis schema.
 * Does not invent medical fields. Does not strip markdown fences (invalid if not JSON).
 * Does not log the raw payload.
 */
export function parseAndValidateMedPilotAnalysis(rawText: string): MedPilotAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new GeminiInvalidResponseError("malformed_json");
  }

  const result = medPilotAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    // Metadata only (field paths/types) - never the actual field values,
    // since this payload is derived from the user's uploaded medical document.
    console.error(
      "[analyze] schema validation failed:",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        expected: "expected" in issue ? issue.expected : undefined,
        received: "received" in issue ? issue.received : undefined,
      })),
    );
    throw new GeminiInvalidResponseError(reasonFromZod(result.error));
  }

  return result.data;
}
