import { describe, expect, it } from "vitest";
import { errorEnvelope, successEnvelope } from "@/lib/api/respond";
import { apiErrorEnvelopeSchema, apiSuccessEnvelopeSchema } from "@/lib/validation/schemas";

describe("API envelope", () => {
  it("formats success as { success, data, error: null }", () => {
    const envelope = successEnvelope({ status: "ok" });
    expect(apiSuccessEnvelopeSchema.parse(envelope)).toEqual({
      success: true,
      data: { status: "ok" },
      error: null,
    });
  });

  it("formats error as { success: false, data: null, error }", () => {
    const envelope = errorEnvelope("UNAUTHORIZED");
    expect(apiErrorEnvelopeSchema.parse(envelope)).toEqual({
      success: false,
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
        retryable: false,
      },
    });
  });
});
