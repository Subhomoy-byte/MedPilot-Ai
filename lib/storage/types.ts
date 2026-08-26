import type { DocumentSource, DocumentStatus } from "@/types";

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
 * Development/demo: single-process Node in-memory store. Guest TTL is 60 minutes.
 * Not durable across serverless instances or process restarts.
 * Demo fixtures are not stored here.
 */
export interface DocumentStore {
  create(input: CreateDocumentInput): DocumentRecord;
  get(documentId: string): DocumentRecord | null;
  update(documentId: string, patch: Partial<DocumentRecord>): DocumentRecord | null;
  delete(documentId: string): void;
  purgeExpired(now?: Date): void;
}

export function isExpired(record: DocumentRecord, now = new Date()): boolean {
  return now.getTime() >= Date.parse(record.expiresAt);
}
