import type { DocumentSource, DocumentStatus, MedPilotAnalysis } from "@/types";

export type DocumentRecord = {
  documentId: string;
  status: DocumentStatus;
  source: DocumentSource;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  createdAt: string;
  expiresAt: string;
  /** Uploaded file bytes for later OCR. Never log this field. */
  bytes: Uint8Array;
  /**
   * Guest OCR text for the mock pipeline. Never log this field.
   */
  ocrText: string | null;
  ocrConfidence: number | null;
  /** Last validated analysis for server-side follow-on actions. Never log this field. */
  lastAnalysis: MedPilotAnalysis | null;
};

export type CreateDocumentInput = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  bytes: Uint8Array;
};

/**
 * Storage abstraction. API routes must depend on this interface, not a vendor SDK.
 *
 * Backed by Vercel KV (Redis) when KV_REST_API_URL / KV_REST_API_TOKEN are
 * configured, so documents survive across the separate serverless function
 * invocations that handle /api/upload, /api/ocr, /api/analyze, etc.
 * Falls back to an in-memory Map for local development when KV isn't
 * configured — that fallback is NOT durable across serverless instances.
 * Guest TTL is 60 minutes. Demo fixtures are not stored here.
 */
export interface DocumentStore {
  create(input: CreateDocumentInput): Promise<DocumentRecord>;
  get(documentId: string): Promise<DocumentRecord | null>;
  update(documentId: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord | null>;
  delete(documentId: string): Promise<void>;
  purgeExpired(now?: Date): Promise<void>;
}

export function isExpired(record: DocumentRecord, now = new Date()): boolean {
  return now.getTime() >= Date.parse(record.expiresAt);
}
