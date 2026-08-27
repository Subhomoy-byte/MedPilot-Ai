import { describe, expect, it } from "vitest";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import {
  chatResponseSchema,
  medPilotAnalysisSchema,
} from "@/lib/validation/schemas";

describe("runtime schemas", () => {
  it("strips unexpected fields from analysis", () => {
    const valid = getFixtureAnalysis("demo-prescription-001", "en");
    const parsed = medPilotAnalysisSchema.parse({
      ...valid,
      rawGemini: "must not leak",
      diagnosis: "must not exist",
    });
    expect(parsed).not.toHaveProperty("rawGemini");
    expect(parsed).not.toHaveProperty("diagnosis");
  });

  it("rejects analysis missing required disclaimer", () => {
    const valid = getFixtureAnalysis("demo-lab-001", "en");
    const { disclaimer: _dropped, ...rest } = valid;
    void _dropped;
    const result = medPilotAnalysisSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("requires emergency flags on analysis", () => {
    const valid = getFixtureAnalysis("demo-prescription-001", "en");
    const { emergencyFlags: _dropped, ...rest } = valid;
    void _dropped;
    expect(medPilotAnalysisSchema.safeParse(rest).success).toBe(false);
  });

  it("validates ChatResponse required fields", () => {
    const parsed = chatResponseSchema.parse({
      documentId: "demo-prescription-001",
      language: "en",
      answer: "Based on the document.",
      groundingStatus: "SUPPORTED_BY_DOCUMENT",
      sourceContextIndicator: "DOCUMENT_OCR_AND_ANALYSIS",
      safetyStatus: "ok",
      safetyNotes: [],
      disclaimer: { text: "disclaimer" },
      spokenText: "Based on the document.",
    });
    expect(parsed.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");
  });
});
