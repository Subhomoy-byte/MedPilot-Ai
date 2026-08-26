import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateJsonFromGemini = vi.fn();

vi.mock("@/lib/ai/generate-json", () => ({
  generateJsonFromGemini: (...args: unknown[]) => generateJsonFromGemini(...args),
}));

import { POST as analyzePost } from "@/app/api/analyze/route";
import { GeminiUnavailableError } from "@/lib/ai/errors";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { GUEST_TTL_MS } from "@/lib/constants";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import { jpegBytes, readJson } from "./helpers";
import { resetDocumentStoreForTests, seedDocumentForTests } from "@/lib/storage/memory";
import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  medPilotAnalysisSchema,
} from "@/lib/validation/schemas";
import type { DocumentRecord } from "@/lib/storage/types";

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
    ocrText: overrides.ocrText === undefined ? "Metformin 500 mg as written" : overrides.ocrText,
    ocrConfidence: confidence,
    ...overrides,
  };
  seedDocumentForTests(record);
  return record;
}

function geminiPayload(record: DocumentRecord) {
  const template = getFixtureAnalysis("demo-prescription-001", "en");
  const confidence = record.ocrConfidence ?? 0;
  const confidenceLevel = classifyConfidence(confidence);
  return {
    ...template,
    documentId: record.documentId,
    language: "en",
    source: "live",
    expiresAt: record.expiresAt,
    ocr: {
      confidence,
      confidenceLevel,
      needsReview: ocrNeedsReview(confidenceLevel),
    },
    needsReview: ocrNeedsReview(confidenceLevel) || template.needsReview,
  };
}

describe("POST /api/analyze Gemini integration", () => {
  beforeEach(() => {
    generateJsonFromGemini.mockReset();
    delete process.env.DEMO_MODE;
  });

  afterEach(() => {
    resetDocumentStoreForTests();
    delete process.env.DEMO_MODE;
  });

  it("analyzes an uploaded document from stored OCR via mocked Gemini", async () => {
    const record = seedOcrDocument();
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(geminiPayload(record)),
      model: "gemini-2.5-flash",
    });

    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: record.documentId, language: "en" }),
      }),
    );
    const analysis = medPilotAnalysisSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(response)).data,
    );
    expect(analysis.source).toBe("live");
    expect(analysis.documentId).toBe(record.documentId);
    expect(generateJsonFromGemini).toHaveBeenCalledTimes(1);
  });

  it("returns DOCUMENT_NOT_FOUND for a missing document", async () => {
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "missing-analyze", language: "en" }),
      }),
    );
    expect(apiErrorEnvelopeSchema.parse(await readJson(response)).error.code).toBe(
      "DOCUMENT_NOT_FOUND",
    );
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("returns DOCUMENT_EXPIRED for an expired document", async () => {
    seedOcrDocument({
      documentId: "expired-analyze",
      createdAt: new Date(Date.now() - GUEST_TTL_MS - 2000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "expired-analyze", language: "en" }),
      }),
    );
    expect(apiErrorEnvelopeSchema.parse(await readJson(response)).error.code).toBe(
      "DOCUMENT_EXPIRED",
    );
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("returns OCR_FAILED when stored OCR is unusable", async () => {
    const record = seedOcrDocument({ ocrText: "   " });
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: record.documentId, language: "en" }),
      }),
    );
    expect(apiErrorEnvelopeSchema.parse(await readJson(response)).error.code).toBe("OCR_FAILED");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("returns AI_UNAVAILABLE when Gemini is unavailable", async () => {
    const record = seedOcrDocument();
    generateJsonFromGemini.mockRejectedValue(new GeminiUnavailableError(true));
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: record.documentId, language: "en" }),
      }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("AI_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toMatch(/prompt|ocrText|GEMINI_API_KEY/);
  });

  it("returns AI_INVALID_RESPONSE for invalid Gemini JSON", async () => {
    const record = seedOcrDocument();
    generateJsonFromGemini.mockResolvedValue({ text: "{not-json", model: "gemini-2.5-flash" });
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: record.documentId, language: "en" }),
      }),
    );
    expect(apiErrorEnvelopeSchema.parse(await readJson(response)).error.code).toBe(
      "AI_INVALID_RESPONSE",
    );
  });

  it("still returns analysis with needsReview when OCR confidence is low", async () => {
    const record = seedOcrDocument({ ocrConfidence: 0.32 });
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(geminiPayload(record)),
      model: "gemini-2.5-flash",
    });
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: record.documentId, language: "en" }),
      }),
    );
    const analysis = medPilotAnalysisSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(response)).data,
    );
    expect(analysis.ocr.confidenceLevel).toBe("low");
    expect(analysis.needsReview).toBe(true);
  });

  it("keeps DEMO fixture analysis deterministic and does not call Gemini", async () => {
    process.env.DEMO_MODE = "true";
    const first = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "demo-prescription-001", language: "en" }),
      }),
    );
    const second = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "demo-prescription-001", language: "en" }),
      }),
    );
    const a = medPilotAnalysisSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(first)).data,
    );
    const b = medPilotAnalysisSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(second)).data,
    );
    expect(a).toEqual(b);
    expect(a.source).toBe("demo_fixture");
    expect(generateJsonFromGemini).not.toHaveBeenCalled();
  });

  it("does not return raw Gemini fields to the client", async () => {
    const record = seedOcrDocument();
    const payload = {
      ...geminiPayload(record),
      rawGemini: "SECRET_MODEL_OUTPUT",
    };
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify(payload),
      model: "gemini-2.5-flash",
    });
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: record.documentId, language: "en" }),
      }),
    );
    const raw = await readJson(response);
    expect(JSON.stringify(raw)).not.toContain("SECRET_MODEL_OUTPUT");
    expect(JSON.stringify(raw)).not.toContain("rawGemini");
    medPilotAnalysisSchema.parse(apiSuccessEnvelopeSchema.parse(raw).data);
  });
});
