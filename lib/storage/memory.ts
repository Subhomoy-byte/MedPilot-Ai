import { GUEST_TTL_MS } from "@/lib/constants";
import type { CreateDocumentInput, DocumentRecord, DocumentStore } from "@/lib/storage/types";
import { isExpired } from "@/lib/storage/types";

const records = new Map<string, DocumentRecord>();

function nowIso(date = new Date()): string {
  return date.toISOString();
}

function copyBytes(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(bytes);
}

/**
 * Process-local fallback store, used only when Vercel KV is not configured
 * (e.g. local development). Not durable across serverless instances —
 * see lib/storage/redis.ts for the production-safe store.
 */
export class InMemoryDocumentStore implements DocumentStore {
  async create(input: CreateDocumentInput): Promise<DocumentRecord> {
    const createdAt = new Date();
    const bytes = copyBytes(input.bytes);
    const record: DocumentRecord = {
      documentId: crypto.randomUUID(),
      status: "uploaded",
      source: "upload",
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      pageCount: input.pageCount,
      createdAt: nowIso(createdAt),
      expiresAt: nowIso(new Date(createdAt.getTime() + GUEST_TTL_MS)),
      bytes,
      ocrText: null,
      ocrConfidence: null,
      lastAnalysis: null,
    };
    records.set(record.documentId, record);
    return record;
  }

  async get(documentId: string): Promise<DocumentRecord | null> {
    return records.get(documentId) ?? null;
  }

  async update(documentId: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord | null> {
    const current = records.get(documentId);
    if (!current) {
      return null;
    }
    const next: DocumentRecord = {
      ...current,
      ...patch,
      documentId: current.documentId,
      bytes: patch.bytes ? copyBytes(patch.bytes) : current.bytes,
    };
    records.set(documentId, next);
    return next;
  }

  async delete(documentId: string): Promise<void> {
    records.delete(documentId);
  }

  async purgeExpired(now = new Date()): Promise<void> {
    for (const [id, record] of records) {
      if (isExpired(record, now)) {
        records.delete(id);
      }
    }
  }
}

/** Process-local guest store (local-dev fallback). Demo fixtures are not stored here. */
export const inMemoryDocumentStore: DocumentStore = new InMemoryDocumentStore();

/** Test helper only — not for API routes. */
export function resetDocumentStoreForTests(): void {
  records.clear();
}

/** Test helper: insert a record with a chosen expiry. */
export function seedDocumentForTests(record: DocumentRecord): void {
  records.set(record.documentId, { ...record, bytes: copyBytes(record.bytes) });
}
