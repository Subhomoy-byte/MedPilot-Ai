import { isDemoFixtureId } from "@/lib/demo/ids";
import { documentStore, isExpired } from "@/lib/storage";
import type { DocumentRecord } from "@/lib/storage/types";
import type { DemoFixtureId } from "@/lib/constants";
import type { ErrorCode } from "@/types";

export type ResolvedDocument =
  | { kind: "fixture"; documentId: DemoFixtureId }
  | { kind: "stored"; record: DocumentRecord };

export function resolveDocument(documentId: string): ResolvedDocument | { error: ErrorCode } {
  if (isDemoFixtureId(documentId)) {
    return { kind: "fixture", documentId };
  }

  const record = documentStore.get(documentId);
  if (!record) {
    return { error: "DOCUMENT_NOT_FOUND" };
  }
  if (isExpired(record)) {
    documentStore.delete(documentId);
    return { error: "DOCUMENT_EXPIRED" };
  }
  return { kind: "stored", record };
}
