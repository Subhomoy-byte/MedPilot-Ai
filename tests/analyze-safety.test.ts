import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateJsonFromGemini = vi.fn();

vi.mock("@/lib/ai/generate-json", () => ({
  generateJsonFromGemini: (...args: unknown[]) => generateJsonFromGemini(...args),
}));

import { POST as analyzePost } from "@/app/api/analyze/route";
import { DISCLAIMER_TEXT_EN, GUEST_TTL_MS } from "@/lib/constants";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { jpegBytes, readJson } from "./helpers";
import { resetDocumentStoreForTests, seedDocumentForTests } from "@/lib/storage/memory";
import { apiSuccessEnvelopeSchema, medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type { DocumentRecord } from "@/lib/storage/types";
import type { MedPilotAnalysis } from "@/types";

const OCR_TEXT = "Metformin 500 mg\nTake one tablet twice daily with meals";

function seedOcrDocument(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  const confidence = overrides.ocrConfidence ?? 0.91;
  const record: DocumentRecord = {
    documentId: overrides.documentId ?? crypto.randomUUID(),
    status: overrides.status ?? "ocr_complete",
    source: "upload",
    filename: "scan.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 12,
    pageCount: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + GUEST_TTL_MS).toISOString(),
    bytes: jpegBytes(),
    ocrText: overrides.ocrText === undefined ? OCR_TEXT : overrides.ocrText,
    ocrConfidence: confidence,
    lastAnalysis: null,
    ...overrides,
  };
  seedDocumentForTests(record);
  return record;
}

function safeAnalysis(record: DocumentRecord): MedPilotAnalysis {
  const template = getFixtureAnalysis("demo-prescription-001", "en");
  return medPilotAnalysisSchema.parse({
    ...template,
    documentId: record.documentId,
    language: "en",
    source: "live",
    expiresAt: record.expiresAt,
    summary:
      "This document lists metformin 500 mg with written directions to take one tablet twice daily with meals.",
    spokenText:
      "This document lists metformin 500 milligrams, with written instructions to take one tablet twice daily with meals. This explains what is written.",
    medicines: [template.medicines[0]],
    tests: [],
    interactionAlerts: [],
    uncertainties: [],
    warnings: [],
    ocr: {
      confidence: record.ocrConfidence ?? 0.91,
      confidenceLevel: "high",
      needsReview: false,
    },
    needsReview: false,
  });
}

async function analyze(documentId: string): Promise<MedPilotAnalysis> {
  const response = await analyzePost(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId, language: "en" }),
    }),
  );
  return medPilotAnalysisSchema.parse(apiSuccessEnvelopeSchema.parse(await readJson(response)).data);
}

describe("POST /api/analyze safety enforcement", () => {
  beforeEach(() => {
    generateJsonFromGemini.mockReset();
    delete process.env.DEMO_MODE;
  });

  afterEach(() => {
    resetDocumentStoreForTests();
    delete process.env.DEMO_MODE;
  });

  it("sanitizes unsafe AI output after Zod and before the client response", async () => {
    const record = seedOcrDocument();
    const payload = safeAnalysis(record);
    payload.summary = "You have diabetes. You should start taking metformin.";
    payload.spokenText = "This confirms diabetes. Increase the dose tonight.";
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });

    const analysis = await analyze(record.documentId);
    expect(generateJsonFromGemini).toHaveBeenCalledTimes(1);
    expect(analysis.summary.toLowerCase()).not.toMatch(/\byou have diabetes\b/);
    expect(analysis.summary.toLowerCase()).not.toMatch(/\bstart taking\b/);
    expect(analysis.spokenText.toLowerCase()).not.toMatch(/\bconfirms diabetes\b/);
    expect(analysis.spokenText.toLowerCase()).not.toMatch(/\bincrease the dose\b/);
    expect(analysis.safetyNotes.some((note) => note.code === "NOT_A_DIAGNOSIS")).toBe(true);
    expect(analysis.safetyNotes.length).toBeGreaterThan(0);
  });

  it("removes invented interaction alerts", async () => {
    const record = seedOcrDocument();
    const payload = safeAnalysis(record);
    payload.interactionAlerts = [
      {
        summary: "Stop one of these drugs because they interact.",
        support: "insufficient_information",
        substancesAsWritten: ["metformin", "ibuprofen"],
        professionalReviewRequired: true,
        warnings: [],
      },
    ];
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });

    const analysis = await analyze(record.documentId);
    expect(analysis.interactionAlerts).toEqual([]);
  });

  it("keeps unreadable medicine names null and uncertain", async () => {
    const record = seedOcrDocument();
    const payload = safeAnalysis(record);
    payload.medicines = [
      {
        ...payload.medicines[0]!,
        medicineNameAsExtracted: "Inventedil",
        uncertain: false,
        uncertainReasons: [],
      },
    ];
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });

    const analysis = await analyze(record.documentId);
    expect(analysis.medicines[0]?.medicineNameAsExtracted).toBeNull();
    expect(analysis.medicines[0]?.uncertain).toBe(true);
    expect(analysis.uncertainties.some((item) => item.code === "UNREADABLE_MEDICINE_NAME")).toBe(true);
    expect(analysis.needsReview).toBe(true);
  });

  it("always returns the canonical disclaimer", async () => {
    const record = seedOcrDocument();
    const payload = safeAnalysis(record);
    payload.disclaimer = { text: "This tool replaces a clinician." };
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });

    const analysis = await analyze(record.documentId);
    expect(analysis.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
  });

  it("preserves needsReview for low OCR confidence", async () => {
    const record = seedOcrDocument({ ocrConfidence: 0.32 });
    const payload = safeAnalysis(record);
    payload.ocr = { confidence: 0.32, confidenceLevel: "high", needsReview: false };
    payload.needsReview = false;
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });

    const analysis = await analyze(record.documentId);
    expect(analysis.ocr.confidenceLevel).toBe("low");
    expect(analysis.ocr.needsReview).toBe(true);
    expect(analysis.needsReview).toBe(true);
    expect(analysis.status).toBe("analysis_complete");
    expect(analysis.uncertainties.some((item) => item.code === "LOW_OCR")).toBe(true);
  });

  it("surfaces emergency flags for emergency language in the uploaded document", async () => {
    const record = seedOcrDocument({ ocrText: "Discharge note: chest pain reported as written." });
    const payload = safeAnalysis(record);
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });

    const analysis = await analyze(record.documentId);
    expect(analysis.emergencyFlags.flagged).toBe(true);
    expect(analysis.emergencyFlags.triggerPhrases.join(" ")).toMatch(/chest pain/i);
    expect(analysis.safetyNotes.some((note) => note.code === "EMERGENCY_REDIRECT")).toBe(true);
  });

  it("leaves a safe analysis unchanged", async () => {
    const record = seedOcrDocument();
    const payload = safeAnalysis(record);
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });

    const analysis = await analyze(record.documentId);
    expect(analysis.summary).toBe(payload.summary);
    expect(analysis.spokenText).toBe(payload.spokenText);
    expect(analysis.medicines[0]?.medicineNameAsExtracted).toBe("Metformin");
    expect(analysis.medicines[0]?.strengthAsWritten).toBe("500 mg");
    expect(analysis.medicines[0]?.instructionsAsWritten).toBe("Take one tablet twice daily with meals");
    expect(analysis.interactionAlerts).toEqual([]);
    expect(analysis.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(analysis.emergencyFlags.flagged).toBe(false);
    expect(analysis.ocr.needsReview).toBe(false);
    expect(analysis.needsReview).toBe(false);
    expect(analysis.safetyNotes.some((note) => note.code === "NOT_A_DIAGNOSIS")).toBe(true);
  });

  it("runs fixture analysis through Zod then safety", async () => {
    const analysis = await analyze("demo-prescription-001");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
    expect(analysis.source).toBe("demo_fixture");
    expect(analysis.disclaimer.text).toBe(DISCLAIMER_TEXT_EN);
    expect(analysis.safetyNotes.length).toBeGreaterThan(0);
    expect(analysis.uncertainties.length).toBeGreaterThan(0);
    expect(analysis.medicines.some((item) => item.medicineNameAsExtracted === null && item.uncertain)).toBe(
      true,
    );
    expect(analysis.emergencyFlags.flagged).toBe(false);
  });

  it("returns a persistent emergency signal for the emergency demo fixture", async () => {
    const analysis = await analyze("demo-discharge-emergency-001");
    expect(analysis.source).toBe("demo_fixture");
    expect(analysis.emergencyFlags.flagged).toBe(true);
    expect(analysis.emergencyFlags.triggerPhrases.join(" ")).toMatch(/chest pain/i);
  });
});
