import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import { hasUsableOcrText, normalizeOcrText } from "@/lib/ocr/normalize";
import { preprocessImage } from "@/lib/ocr/preprocess";
import { rasterizePdfPages } from "@/lib/ocr/rasterize";
import { recognizePage } from "@/lib/ocr/tesseract";
import type { OcrExtractInput, OcrExtractResult, OcrWord } from "@/lib/ocr/types";

function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

function isImage(mimeType: string): boolean {
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

async function pagesFromDocument(input: OcrExtractInput): Promise<Buffer[]> {
  if (isPdf(input.mimeType)) {
    return rasterizePdfPages(input.bytes);
  }
  if (isImage(input.mimeType)) {
    return [await preprocessImage(input.bytes)];
  }
  throw new Error("unsupported");
}

export async function extractText(document: OcrExtractInput): Promise<OcrExtractResult> {
  try {
    const pages = await pagesFromDocument(document);
    if (pages.length === 0) {
      return { ok: false, reason: "empty" };
    }

    const pageResults = [];
    for (const page of pages) {
      pageResults.push(await recognizePage(page));
    }

    const extractedText = normalizeOcrText(pageResults.map((page) => page.text).join("\n"));
    if (!hasUsableOcrText(extractedText)) {
      return { ok: false, reason: "empty" };
    }

    const confidence =
      pageResults.reduce((sum, page) => sum + page.confidence, 0) / pageResults.length;
    const confidenceLevel = classifyConfidence(confidence);
    const words: OcrWord[] = pageResults.flatMap((page) => page.words);

    return {
      ok: true,
      extractedText,
      confidence,
      confidenceLevel,
      needsReview: ocrNeedsReview(confidenceLevel),
      pageCount: pages.length,
      words,
      engine: "tesseract.js",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "unsupported") {
      return { ok: false, reason: "unsupported" };
    }
    return { ok: false, reason: "engine" };
  }
}
