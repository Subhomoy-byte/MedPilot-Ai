import { describe, expect, it } from "vitest";
import { buildDocumentAnalysisPrompt } from "@/lib/ai/analysis-prompt";

const SAMPLE_INPUT = {
  documentId: "doc-test-001",
  expiresAt: null,
  normalizedOcrText: "SAMPLE LINE FOR PROMPT TESTS ONLY",
  documentTypeHint: "unknown" as const,
  ocr: {
    confidence: 0.7,
    confidenceLevel: "medium" as const,
    needsReview: true,
  },
};

describe("Gemini document-analysis prompt", () => {
  const prompt = buildDocumentAnalysisPrompt(SAMPLE_INPUT);

  it("asks for the existing MedPilotAnalysis JSON structure, not a new schema", () => {
    expect(prompt).toMatch(/canonical MedPilotAnalysis/);
    expect(prompt).toMatch(/Do not create a new schema/);
    expect(prompt).toMatch(/language to "en"/);
  });

  it("contains no-diagnosis and no disease inference from labs", () => {
    expect(prompt.toLowerCase()).toMatch(/no diagnosis/);
    expect(prompt.toLowerCase()).toMatch(/do not diagnose/);
    expect(prompt.toLowerCase()).toMatch(/do not infer a disease from a lab value/);
  });

  it("contains no prescribing", () => {
    expect(prompt.toLowerCase()).toMatch(/no prescribing/);
    expect(prompt.toLowerCase()).toMatch(/do not generate a prescription/);
  });

  it("contains no dosage changes", () => {
    expect(prompt.toLowerCase()).toMatch(/no dosage changes/);
    expect(prompt.toLowerCase()).toMatch(/do not recommend changing a dose/);
  });

  it("forbids start/stop medication instructions", () => {
    expect(prompt.toLowerCase()).toMatch(/do not tell users to start or stop medication/);
  });

  it("forbids invented values and guessing unreadable fields", () => {
    expect(prompt.toLowerCase()).toMatch(/no invented values/);
    expect(prompt.toLowerCase()).toMatch(/never guess unreadable medicine names/);
    expect(prompt.toLowerCase()).toMatch(/never guess dosage/);
    expect(prompt.toLowerCase()).toMatch(/never guess laboratory values/);
    expect(prompt.toLowerCase()).toMatch(/never invent missing information/);
  });

  it("requires preserving uncertainty and treating OCR uncertainty as lower confidence, not a license to guess", () => {
    expect(prompt.toLowerCase()).toMatch(/preserve uncertainty/);
    expect(prompt.toLowerCase()).toMatch(
      /treat ocr uncertainty as a reason to lower field confidence/,
    );
    expect(prompt.toLowerCase()).toMatch(/not as permission to guess/);
  });

  it("requires document grounding", () => {
    expect(prompt.toLowerCase()).toMatch(/document grounding/);
    expect(prompt.toLowerCase()).toMatch(/strictly grounded in the supplied ocr text/);
    expect(prompt.toLowerCase()).toMatch(/interactionalerts only when the ocr text itself mentions/);
  });

  it("mentions OCR artifacts without allowing clinical correction", () => {
    expect(prompt.toLowerCase()).toMatch(/spelling errors/);
    expect(prompt.toLowerCase()).toMatch(/broken words/);
    expect(prompt.toLowerCase()).toMatch(/layout artifacts/);
    expect(prompt.toLowerCase()).toMatch(/must not perform unsupported clinical corrections/);
  });

  it("embeds the supplied OCR block without adding a logging statement", () => {
    expect(prompt).toContain("SAMPLE LINE FOR PROMPT TESTS ONLY");
    expect(buildDocumentAnalysisPrompt.toString()).not.toMatch(/console\.(log|info|debug|error)/);
  });
});
