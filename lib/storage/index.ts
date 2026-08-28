import type { DocumentStore } from "@/lib/storage/types";
import { inMemoryDocumentStore } from "@/lib/storage/memory";
import { redisDocumentStore } from "@/lib/storage/redis";

export type { CreateDocumentInput, DocumentRecord, DocumentStore } from "@/lib/storage/types";
export { isExpired } from "@/lib/storage/types";

function hasKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
}

/**
 * Guest document store. Uses Vercel KV in production so documents are
 * readable across the separate serverless invocations that handle each API
 * route; falls back to an in-process Map for local development. Set
 * KV_REST_API_URL / KV_REST_API_TOKEN (auto-added when you connect a KV
 * store to this project in the Vercel dashboard) to enable the durable path.
 */
export const documentStore: DocumentStore = hasKvConfigured()
  ? redisDocumentStore
  : inMemoryDocumentStore;
