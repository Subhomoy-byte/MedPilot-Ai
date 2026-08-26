import { describe, expect, it } from "vitest";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import {
  GeminiInvalidResponseError,
  parseAndValidateMedPilotAnalysis,
} from "@/lib/ai/validate-analysis";
import { DISCLAIMER_TEXT_EN } from "@/lib/constants";

function validPayload() {
  return getFixtureAnalysis("demo-prescription-001", "en");
}

describe("Gemini structured output validation", () => {
  it("returns validated MedPilotAnalysis for valid Gemini JSON", () => {
    const original = validPayload();
    const validated = parseAndValidateMedPilotAnalysis(JSON.stringify(original));
    expect(validated.documentId).toBe(original.documentId);
    expect(validated.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(validated.uncertainties.length).toBeGreaterThan(0);
    expect(validated.safetyNotes.length).toBeGreaterThan(0);
    expect(validated.ocr.confidence).toBe(original.ocr.confidence);
    expect(validated).not.toHaveProperty("rawGemini");
  });

  it("rejects malformed JSON with AI_INVALID_RESPONSE", () => {
    try {
      parseAndValidateMedPilotAnalysis("{ not json");
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiInvalidResponseError);
      expect((error as GeminiInvalidResponseError).code).toBe("AI_INVALID_RESPONSE");
      expect((error as GeminiInvalidResponseError).reason).toBe("malformed_json");
      expect((error as GeminiInvalidResponseError).retryable).toBe(true);
    }
  });

  it("rejects a missing required field and does not invent it", () => {
    const payload = validPayload() as unknown as Record<string, unknown>;
    delete payload.disclaimer;
    try {
      parseAndValidateMedPilotAnalysis(JSON.stringify(payload));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiInvalidResponseError);
      expect((error as GeminiInvalidResponseError).reason).toBe("missing_field");
    }
  });

  it("rejects an incorrect field type", () => {
    const payload = { ...validPayload(), summary: 12 };
    try {
      parseAndValidateMedPilotAnalysis(JSON.stringify(payload));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiInvalidResponseError);
      expect((error as GeminiInvalidResponseError).reason).toBe("incorrect_type");
    }
  });

  it("rejects an invalid enum value", () => {
    const payload = { ...validPayload(), documentType: "radiology" };
    try {
      parseAndValidateMedPilotAnalysis(JSON.stringify(payload));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiInvalidResponseError);
      expect((error as GeminiInvalidResponseError).reason).toBe("invalid_enum");
    }
  });

  it("rejects invalid confidence values", () => {
    const payload = validPayload();
    payload.ocr = { ...payload.ocr, confidence: 1.4 };
    try {
      parseAndValidateMedPilotAnalysis(JSON.stringify(payload));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiInvalidResponseError);
      expect((error as GeminiInvalidResponseError).reason).toBe("invalid_confidence");
    }
  });

  it("preserves valid nullable medical fields", () => {
    const payload = validPayload();
    expect(payload.medicines[1]?.medicineNameAsExtracted).toBeNull();
    expect(payload.medicines[1]?.strengthAsWritten).toBeNull();
    const validated = parseAndValidateMedPilotAnalysis(JSON.stringify(payload));
    expect(validated.medicines[1]?.medicineNameAsExtracted).toBeNull();
    expect(validated.medicines[1]?.strengthAsWritten).toBeNull();
    expect(validated.medicines[1]?.uncertain).toBe(true);
    expect(validated.warnings.length).toBeGreaterThan(0);
  });

  it("rejects incomplete analysis missing medicines", () => {
    const payload = validPayload() as unknown as Record<string, unknown>;
    delete payload.medicines;
    try {
      parseAndValidateMedPilotAnalysis(JSON.stringify(payload));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiInvalidResponseError);
      expect((error as GeminiInvalidResponseError).code).toBe("AI_INVALID_RESPONSE");
    }
  });

  it("does not accept markdown-wrapped output", () => {
    const wrapped = "```json\n" + JSON.stringify(validPayload()) + "\n```";
    try {
      parseAndValidateMedPilotAnalysis(wrapped);
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GeminiInvalidResponseError);
      expect((error as GeminiInvalidResponseError).reason).toBe("malformed_json");
    }
  });
});
