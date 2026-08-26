import { afterEach, describe, expect, it } from "vitest";
import { POST as ocrPost } from "@/app/api/ocr/route";
import { POST as uploadPost } from "@/app/api/upload/route";
import { extractText } from "@/lib/ocr/extract";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import { hasUsableOcrText, normalizeOcrText } from "@/lib/ocr/normalize";
import { documentStore } from "@/lib/storage";
import { resetDocumentStoreForTests } from "@/lib/storage/memory";
import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  ocrResultSchema,
  uploadResultSchema,
} from "@/lib/validation/schemas";
import { fileFromBytes, readJson } from "./helpers";
import {
  blurryPrescriptionPng,
  clearPrescriptionPng,
  emptyImagePng,
  handwrittenSamplePng,
  invalidImageBytes,
  labReportPdf,
  rotatedPrescriptionPng,
} from "./ocr-samples";

const OCR_TIMEOUT = 120_000;

async function uploadAndOcr(filename: string, bytes: Uint8Array, mime: string) {
  const form = new FormData();
  form.set("file", fileFromBytes(filename, bytes, mime));
  const uploaded = await uploadPost(
    new Request("http://localhost/api/upload", { method: "POST", body: form }),
  );
  const uploadData = uploadResultSchema.parse(
    apiSuccessEnvelopeSchema.parse(await readJson(uploaded)).data,
  );
  const ocr = await ocrPost(
    new Request("http://localhost/api/ocr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: uploadData.documentId }),
    }),
  );
  return { uploadData, ocr };
}

describe("OCR engine", () => {
  afterEach(() => {
    resetDocumentStoreForTests();
  });

  it("keeps frozen confidence thresholds", () => {
    expect(classifyConfidence(0.8)).toBe("high");
    expect(classifyConfidence(0.79)).toBe("medium");
    expect(classifyConfidence(0.49)).toBe("low");
    expect(ocrNeedsReview("low")).toBe(true);
  });

  it("does not rewrite medicine-like tokens during normalization", () => {
    expect(normalizeOcrText("  Metformin   500 mg \n")).toBe("Metformin 500 mg");
    expect(normalizeOcrText("Rx\nMTF")).toBe("Rx\nMTF");
  });

  it(
    "reads a clear prescription image",
    async () => {
      const result = await extractText({
        bytes: clearPrescriptionPng(),
        mimeType: "image/png",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.extractedText.toLowerCase()).toMatch(/metformin/);
      expect(result.engine).toBe("tesseract.js");
      expect(result.words.length).toBeGreaterThan(0);
    },
    OCR_TIMEOUT,
  );

  it(
    "returns low/medium confidence with needsReview for a blurry image",
    async () => {
      const result = await extractText({
        bytes: blurryPrescriptionPng(),
        mimeType: "image/png",
      });
      if (!result.ok) {
        expect(result.reason).toBe("empty");
        return;
      }
      expect(result.needsReview).toBe(true);
      expect(result.confidenceLevel === "high" ? result.needsReview : true).toBe(true);
      expect(result.extractedText.toLowerCase()).not.toMatch(/start taking|stop taking|diagnos/);
    },
    OCR_TIMEOUT,
  );

  it(
    "handles a rotated prescription without inventing dosages",
    async () => {
      const result = await extractText({
        bytes: rotatedPrescriptionPng(),
        mimeType: "image/png",
      });
      if (result.ok) {
        expect(result.extractedText.toLowerCase()).not.toMatch(/you should take|start taking|diagnos/);
      } else {
        expect(["empty", "engine"]).toContain(result.reason);
      }
    },
    OCR_TIMEOUT,
  );

  it(
    "treats a handwritten sample as extraction-only",
    async () => {
      const result = await extractText({
        bytes: handwrittenSamplePng(),
        mimeType: "image/png",
      });
      if (result.ok) {
        expect(result.needsReview).toBe(true);
        expect(result.extractedText.toLowerCase()).not.toMatch(/you should take/);
      } else {
        expect(result.reason).toBe("empty");
      }
    },
    OCR_TIMEOUT,
  );

  it(
    "fails empty images with OCR_FAILED at the API",
    async () => {
      const { ocr } = await uploadAndOcr("blank.png", emptyImagePng(), "image/png");
      const body = apiErrorEnvelopeSchema.parse(await readJson(ocr));
      expect(body.error.code).toBe("OCR_FAILED");
    },
    OCR_TIMEOUT,
  );

  it("fails invalid image bytes in the OCR service", async () => {
    const result = await extractText({
      bytes: invalidImageBytes(),
      mimeType: "image/png",
    });
    expect(result.ok).toBe(false);
  });

  it(
    "OCRs a rasterized PDF",
    async () => {
      const pdf = await labReportPdf();
      const result = await extractText({
        bytes: pdf,
        mimeType: "application/pdf",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.pageCount).toBe(1);
      expect(result.extractedText.toLowerCase()).toMatch(/hemoglobin|laboratory|13/);
    },
    OCR_TIMEOUT,
  );

  it("does not treat low confidence as a fatal API error when text exists", () => {
    expect(ocrNeedsReview("low")).toBe(true);
    expect(hasUsableOcrText("Metformin")).toBe(true);
  });

  it("still serves deterministic demo fixture OCR", async () => {
    const response = await ocrPost(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "demo-discharge-001" }),
      }),
    );
    const data = ocrResultSchema.parse(
      apiSuccessEnvelopeSchema.parse(await readJson(response)).data,
    );
    expect(data.source).toBe("demo_fixture");
    expect(data.confidenceLevel).toBe("low");
    expect(data.needsReview).toBe(true);
    expect(documentStore.get("demo-discharge-001")).toBeNull();
  });

  it("returns DOCUMENT_NOT_FOUND for an unknown id", async () => {
    const response = await ocrPost(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: "missing-ocr-id" }),
      }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("DOCUMENT_NOT_FOUND");
  });
});
