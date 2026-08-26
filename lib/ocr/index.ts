export { extractText } from "@/lib/ocr/extract";
export { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
export type { OcrExtractInput, OcrExtractResult } from "@/lib/ocr/types";

export const OCR_ENGINE = "tesseract.js" as const;
