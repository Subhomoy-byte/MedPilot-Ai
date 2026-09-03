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
  console.log(`[ocr] pagesFromDocument mimeType=${input.mimeType} bytes=${input.bytes.length}`);
  const start = Date.now();
  let result: Buffer[];
  if (isPdf(input.mimeType)) {
    result = await rasterizePdfPages(input.bytes);
  } else if (isImage(input.mimeType)) {
    result = [await preprocessImage(input.bytes)];
  } else {
    throw new Error("unsupported");
  }
  console.log(`[ocr] pagesFromDocument took ${Date.now() - start}ms, pages=${result.length}`);
  return result;
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
    console.error("[ocr] extractText failed:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "unsupported") {
      return { ok: false, reason: "unsupported" };
    }
    return { ok: false, reason: "engine" };
  }
}
