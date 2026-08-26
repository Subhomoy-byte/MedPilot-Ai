import type { ConfidenceLevel } from "@/types";

export type OcrWord = {
  text: string;
  confidence: number;
};

export type OcrExtractInput = {
  bytes: Uint8Array;
  mimeType: string;
};

export type OcrExtractSuccess = {
  ok: true;
  extractedText: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  needsReview: boolean;
  pageCount: number;
  words: OcrWord[];
  engine: "tesseract.js";
};

export type OcrExtractFailure = {
  ok: false;
  reason: "empty" | "engine" | "unsupported";
};

export type OcrExtractResult = OcrExtractSuccess | OcrExtractFailure;
