import { kv } from "@vercel/kv";
import { GUEST_TTL_MS } from "@/lib/constants";
import type { CreateDocumentInput, DocumentRecord, DocumentStore } from "@/lib/storage/types";

const KEY_PREFIX = "medpilot:document:";
const TTL_SECONDS = Math.ceil(GUEST_TTL_MS / 1000);

/** JSON-safe representation of a DocumentRecord (bytes as base64). */
type StoredRecord = Omit<DocumentRecord, "bytes"> & { bytesBase64: string };

function toStored(record: DocumentRecord): StoredRecord {
  const { bytes, ...rest } = record;
  return { ...rest, bytesBase64: Buffer.from(bytes).toString("base64") };
}

function fromStored(stored: StoredRecord): DocumentRecord {
  const { bytesBase64, ...rest } = stored;
  return { ...rest, bytes: new Uint8Array(Buffer.from(bytesBase64, "base64")) };
}

function keyFor(documentId: string): string {
  return `${KEY_PREFIX}${documentId}`;
}

/**
 * Vercel KV (Redis) backed store. Each API route (/api/upload, /api/ocr,
 * /api/analyze, ...) runs as its own serverless function invocation with no
 * shared process memory, so documents must live in a real datastore to be
 * readable by a later request. Records expire automatically via Redis TTL,
 * matching the guest session length.
 */
export class RedisDocumentStore implements DocumentStore {
  async create(input: CreateDocumentInput): Promise<DocumentRecord> {
    const createdAt = new Date();
    const record: DocumentRecord = {
      documentId: crypto.randomUUID(),
      status: "uploaded",
      source: "upload",
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      pageCount: input.pageCount,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + GUEST_TTL_MS).toISOString(),
      bytes: Uint8Array.from(input.bytes),
      ocrText: null,
      ocrConfidence: null,
      lastAnalysis: null,
    };
    await kv.set(keyFor(record.documentId), toStored(record), { ex: TTL_SECONDS });
    return record;
  }

  async get(documentId: string): Promise<DocumentRecord | null> {
    const stored = await kv.get<StoredRecord>(keyFor(documentId));
    if (!stored) {
      return null;
    }
    return fromStored(stored);
  }

  async update(documentId: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord | null> {
    const current = await this.get(documentId);
    if (!current) {
      return null;
    }
    const next: DocumentRecord = {
      ...current,
      ...patch,
      documentId: current.documentId,
      bytes: patch.bytes ? Uint8Array.from(patch.bytes) : current.bytes,
    };
    const remainingMs = Date.parse(next.expiresAt) - Date.now();
    const ttlSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
    await kv.set(keyFor(documentId), toStored(next), { ex: ttlSeconds });
    return next;
  }

  async delete(documentId: string): Promise<void> {
    await kv.del(keyFor(documentId));
  }

  async purgeExpired(): Promise<void> {
    // No-op: Redis TTL (set on every write above) expires records automatically.
  }
}

export const redisDocumentStore: DocumentStore = new RedisDocumentStore();
