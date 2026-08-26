import { afterEach, describe, expect, it, vi } from "vitest";

const generateJsonFromGemini = vi.fn();

vi.mock("@/lib/ai/generate-json", () => ({
  generateJsonFromGemini: (...args: unknown[]) => generateJsonFromGemini(...args),
}));

import { GET as healthGet } from "@/app/api/health/route";
import { POST as uploadPost } from "@/app/api/upload/route";
import { POST as ocrPost } from "@/app/api/ocr/route";
import { POST as analyzePost } from "@/app/api/analyze/route";
import { POST as chatPost } from "@/app/api/chat/route";
import { GET as historyGet } from "@/app/api/history/route";
import { resetDocumentStoreForTests } from "@/lib/storage/memory";
import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  chatResponseSchema,
  healthDataSchema,
  medPilotAnalysisSchema,
  ocrResultSchema,
  uploadResultSchema,
} from "@/lib/validation/schemas";
import { fileFromBytes, jpegBytes, readJson } from "./helpers";
import { clearPrescriptionPng } from "./ocr-samples";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";

describe("mock API routes", () => {
  afterEach(() => {
    resetDocumentStoreForTests();
    generateJsonFromGemini.mockReset();
  });

  it("GET /api/health returns the frozen success envelope", async () => {
    const response = await healthGet();
    const body = apiSuccessEnvelopeSchema.parse(await readJson(response));
    expect(healthDataSchema.parse(body.data).status).toBe("ok");
    expect(JSON.stringify(body)).not.toMatch(/GEMINI_API_KEY|AIza/);
  });

  it("GET /api/history is UNAUTHORIZED for guests", async () => {
    const response = await historyGet();
    expect(response.status).toBe(401);
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/ocr serves fixture OCR including low confidence", async () => {
    const response = await ocrPost(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "demo-discharge-001" }),
      }),
    );
    const body = apiSuccessEnvelopeSchema.parse(await readJson(response));
    const data = ocrResultSchema.parse(body.data);
    expect(data.confidenceLevel).toBe("low");
    expect(data.needsReview).toBe(true);
    expect(data.source).toBe("demo_fixture");
  });

  it("POST /api/analyze returns schema-valid MedPilotAnalysis", async () => {
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "demo-prescription-001", language: "en" }),
      }),
    );
    const body = apiSuccessEnvelopeSchema.parse(await readJson(response));
    const analysis = medPilotAnalysisSchema.parse(body.data);
    expect(analysis.status).toBe("analysis_complete");
    expect(analysis.source).toBe("demo_fixture");
    expect(analysis.disclaimer.text.length).toBeGreaterThan(0);
    expect(analysis.summary.toLowerCase()).not.toMatch(/\bdiagnos(?:e|is)\b/);
  });

  it("POST /api/chat supports all three grounding statuses", async () => {
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({
        answer:
          "The report lists hemoglobin as 13.2 g/dL with a printed reference range of 12.0-15.0. This restates what is written and is not a diagnosis.",
        groundingStatus: "SUPPORTED_BY_DOCUMENT",
        sourceContextIndicator: "DOCUMENT_OCR_AND_ANALYSIS",
        spokenText:
          "The report lists hemoglobin as 13.2 grams per deciliter with a printed reference range of 12.0 to 15.0.",
      }),
      model: "gemini-2.5-flash",
    });

    const call = (message: string) =>
      chatPost(
        new Request("http://localhost/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            documentId: "demo-lab-001",
            message,
            language: "en",
          }),
        }),
      );

    const supported = chatResponseSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(await call("Explain this hemoglobin result"))).data,
    );
    expect(supported.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");

    const missing = chatResponseSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(await call("What is the weather in Paris today?")))
        .data,
    );
    expect(missing.groundingStatus).toBe("INSUFFICIENT_INFORMATION");

    const restricted = chatResponseSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(await call("Please diagnose this and prescribe a new dose")))
        .data,
    );
    expect(restricted.groundingStatus).toBe("SAFETY_RESTRICTED");
  });

  it("upload then ocr then analyze works for a guest file", async () => {
    const form = new FormData();
    form.set("file", fileFromBytes("scan.png", clearPrescriptionPng(), "image/png"));
    const uploaded = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const uploadBody = apiSuccessEnvelopeSchema.parse(await readJson(uploaded));
    const uploadData = uploadResultSchema.parse(uploadBody.data);

    const ocr = await ocrPost(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: uploadData.documentId }),
      }),
    );
    const ocrData = ocrResultSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(ocr)).data,
    );
    expect(ocrData.source).toBe("upload");
    expect(typeof ocrData.text).toBe("string");
    expect(ocrData.text.length).toBeGreaterThan(0);

    const template = getFixtureAnalysis("demo-prescription-001", "en");
    const confidence = ocrData.confidence;
    const confidenceLevel = classifyConfidence(confidence);
    generateJsonFromGemini.mockResolvedValue({
      text: JSON.stringify({
        ...template,
        documentId: uploadData.documentId,
        language: "en",
        source: "live",
        expiresAt: uploadData.expiresAt,
        ocr: {
          confidence,
          confidenceLevel,
          needsReview: ocrNeedsReview(confidenceLevel),
        },
        needsReview: ocrNeedsReview(confidenceLevel) || template.needsReview,
      }),
      model: "gemini-2.5-flash",
    });

    const analyze = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: uploadData.documentId, language: "en" }),
      }),
    );
    const analysis = medPilotAnalysisSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(analyze)).data,
    );
    expect(analysis.documentId).toBe(uploadData.documentId);
    expect(analysis.language).toBe("en");
    expect(analysis.source).toBe("live");
  }, 120_000);

  it("analyze before OCR returns DOCUMENT_NOT_READY", async () => {
    const form = new FormData();
    form.set("file", fileFromBytes("scan.jpg", jpegBytes(), "image/jpeg"));
    const uploaded = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const uploadData = uploadResultSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(uploaded)).data,
    );
    const analyze = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: uploadData.documentId, language: "en" }),
      }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(analyze));
    expect(body.error.code).toBe("DOCUMENT_NOT_READY");
  });

  it("rejects oversize uploads via the route", async () => {
    const huge = new Uint8Array(10 * 1024 * 1024 + 1);
    huge[0] = 0xff;
    huge[1] = 0xd8;
    huge[2] = 0xff;
    const form = new FormData();
    form.set("file", fileFromBytes("huge.jpg", huge, "image/jpeg"));
    const response = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("FILE_TOO_LARGE");
  });
});
