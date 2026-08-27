import { describe, expect, it } from "vitest";
import { checkPanicLabValues } from "@/lib/safety/panic-values";
import type { TestAnalysis } from "@/types";

function testResult(overrides: Partial<TestAnalysis>): TestAnalysis {
  return {
    testNameAsExtracted: "Potassium",
    valueAsWritten: "4.2",
    unitAsWritten: "mmol/L",
    referenceRangeAsWritten: null,
    flagAsWritten: null,
    patientFriendlyExplanation: "This restates the value written in the document.",
    confidence: 0.95,
    confidenceLevel: "high",
    uncertain: false,
    uncertainReasons: [],
    warnings: [],
    ...overrides,
  };
}

describe("checkPanicLabValues", () => {
  it("flags a clearly written critical value with a recognized unit", () => {
    const findings = checkPanicLabValues([testResult({ valueAsWritten: "6.8" })]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      category: "emergency_language",
      code: "PANIC_LAB_VALUE",
    });
  });

  it("does not flag a clearly normal value", () => {
    expect(checkPanicLabValues([testResult({ valueAsWritten: "4.2" })])).toEqual([]);
  });

  it("does not flag values with missing or ambiguous units", () => {
    expect(checkPanicLabValues([testResult({ valueAsWritten: "6.8", unitAsWritten: null })])).toEqual([]);
    expect(checkPanicLabValues([testResult({ valueAsWritten: "6.8", unitAsWritten: "mEq/L" })])).toEqual([]);
  });
});
