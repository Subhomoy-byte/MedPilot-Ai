import { describe, expect, it } from "vitest";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import { getFixtureAnalysis, getFixtureOcr } from "@/lib/demo/fixtures";

describe("OCR confidence", () => {
  it("classifies high, medium, and low using frozen thresholds", () => {
    expect(classifyConfidence(0.8)).toBe("high");
    expect(classifyConfidence(1)).toBe("high");
    expect(classifyConfidence(0.79)).toBe("medium");
    expect(classifyConfidence(0.5)).toBe("medium");
    expect(classifyConfidence(0.49)).toBe("low");
    expect(classifyConfidence(0)).toBe("low");
  });

  it("marks medium and low as needsReview", () => {
    expect(ocrNeedsReview("high")).toBe(false);
    expect(ocrNeedsReview("medium")).toBe(true);
    expect(ocrNeedsReview("low")).toBe(true);
    expect(ocrNeedsReview("high", true)).toBe(true);
  });

  it("treats low OCR as a successful payload, not a fatal error", () => {
    const ocr = getFixtureOcr("demo-discharge-001");
    expect(ocr.confidence).toBeLessThan(0.5);
    expect(ocr.confidenceLevel).toBe("low");
    expect(ocr.needsReview).toBe(true);
    expect(ocr.status).toBe("ocr_complete");

    const analysis = getFixtureAnalysis("demo-discharge-001", "en");
    expect(analysis.needsReview).toBe(true);
    expect(analysis.medicines[0]?.medicineNameAsExtracted).toBe("Warfarin");
    expect(analysis.medicines[0]?.strengthAsWritten).toBeNull();
  });
});
