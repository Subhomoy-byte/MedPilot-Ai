import { NextResponse } from "next/server";
import type { ApiErrorEnvelope, ApiSuccessEnvelope, ErrorCode } from "@/types";

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  INVALID_FILE: "The uploaded file is empty or could not be read.",
  UNSUPPORTED_FILE: "This file type is not supported. Use JPG, JPEG, PNG, or PDF.",
  FILE_TOO_LARGE: "The file exceeds the 10 MiB limit.",
  TOO_MANY_PAGES: "PDFs may contain at most 5 pages.",
  OCR_FAILED: "No usable text could be read from this document.",
  OCR_LOW_CONFIDENCE: "OCR confidence is low. Review highlighted fields.",
  MEDICINE_NOT_ORDERABLE: "This medicine could not be confirmed from the document and cannot be ordered.",
  DOCUMENT_NOT_READY: "This document is not ready for the requested step yet.",
  DOCUMENT_NOT_FOUND: "No document was found for this id.",
  DOCUMENT_EXPIRED: "This guest document has expired.",
  AI_UNAVAILABLE: "The analysis service is temporarily unavailable.",
  AI_INVALID_RESPONSE: "The analysis result could not be validated.",
  VALIDATION_FAILED: "The request is invalid.",
  SAFETY_BLOCK: "A safe response could not be produced.",
  MESSAGE_TOO_LONG: "The message exceeds 500 characters.",
  UNAUTHORIZED: "Authentication is required.",
  INTERNAL_ERROR: "An unexpected error occurred.",
};

const HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID_FILE: 400,
  UNSUPPORTED_FILE: 400,
  FILE_TOO_LARGE: 400,
  TOO_MANY_PAGES: 400,
  OCR_FAILED: 422,
  OCR_LOW_CONFIDENCE: 200,
  MEDICINE_NOT_ORDERABLE: 422,
  DOCUMENT_NOT_READY: 409,
  DOCUMENT_NOT_FOUND: 404,
  DOCUMENT_EXPIRED: 410,
  AI_UNAVAILABLE: 503,
  AI_INVALID_RESPONSE: 502,
  VALIDATION_FAILED: 400,
  SAFETY_BLOCK: 403,
  MESSAGE_TOO_LONG: 400,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
};

const RETRYABLE: Record<ErrorCode, boolean> = {
  INVALID_FILE: false,
  UNSUPPORTED_FILE: false,
  FILE_TOO_LARGE: false,
  TOO_MANY_PAGES: false,
  OCR_FAILED: true,
  OCR_LOW_CONFIDENCE: false,
  MEDICINE_NOT_ORDERABLE: false,
  DOCUMENT_NOT_READY: false,
  DOCUMENT_NOT_FOUND: false,
  DOCUMENT_EXPIRED: false,
  AI_UNAVAILABLE: true,
  AI_INVALID_RESPONSE: true,
  VALIDATION_FAILED: false,
  SAFETY_BLOCK: false,
  MESSAGE_TOO_LONG: false,
  UNAUTHORIZED: false,
  INTERNAL_ERROR: false,
};

export function successEnvelope<T>(data: T): ApiSuccessEnvelope<T> {
  return { success: true, data, error: null };
}

export function errorEnvelope(
  code: ErrorCode,
  message?: string,
  retryable?: boolean,
): ApiErrorEnvelope {
  return {
    success: false,
    data: null,
    error: {
      code,
      message: message ?? DEFAULT_MESSAGES[code],
      retryable: retryable ?? RETRYABLE[code],
    },
  };
}

export function corsHeaders(): Record<string, string> {
  const origin = process.env.FRONTEND_ORIGIN?.trim();
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(successEnvelope(data), { status, headers: corsHeaders() });
}

export function apiError(
  code: ErrorCode,
  message?: string,
  retryable?: boolean,
): NextResponse {
  return NextResponse.json(errorEnvelope(code, message, retryable), {
    status: HTTP_STATUS[code],
    headers: corsHeaders(),
  });
}

export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
