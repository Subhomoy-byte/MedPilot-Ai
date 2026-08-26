import { afterEach, describe, expect, it } from "vitest";
import { GUEST_TTL_MS } from "@/lib/constants";
import { documentStore } from "@/lib/storage";
import { isExpired } from "@/lib/storage/types";
import { resetDocumentStoreForTests, seedDocumentForTests } from "@/lib/storage/memory";
import { resolveDocument } from "@/lib/documents/resolve";

describe("document lifecycle", () => {
  afterEach(() => {
    resetDocumentStoreForTests();
  });

  it("creates guest documents as uploaded with a 60-minute expiry", () => {
    const created = documentStore.create({
      filename: "scan.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 12,
      pageCount: null,
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
    });
    expect(created.status).toBe("uploaded");
    expect(created.source).toBe("upload");
    const ttl = Date.parse(created.expiresAt) - Date.parse(created.createdAt);
    expect(ttl).toBe(GUEST_TTL_MS);
    expect(isExpired(created, new Date(Date.parse(created.createdAt) + GUEST_TTL_MS - 1000))).toBe(
      false,
    );
    expect(isExpired(created, new Date(Date.parse(created.expiresAt)))).toBe(true);
  });

  it("returns DOCUMENT_EXPIRED for expired guest ids", () => {
    seedDocumentForTests({
      documentId: "expired-1",
      status: "uploaded",
      source: "upload",
      filename: "scan.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 10,
      pageCount: null,
      createdAt: new Date(Date.now() - GUEST_TTL_MS - 1000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      bytes: new Uint8Array([0xff, 0xd8, 0xff]),
      ocrText: null,
      ocrConfidence: null,
    });
    expect(resolveDocument("expired-1")).toEqual({ error: "DOCUMENT_EXPIRED" });
    expect(documentStore.get("expired-1")).toBeNull();
  });

  it("returns DOCUMENT_NOT_FOUND for unknown ids", () => {
    expect(resolveDocument("missing-id")).toEqual({ error: "DOCUMENT_NOT_FOUND" });
  });

  it("does not require storage for demo fixtures", () => {
    expect(resolveDocument("demo-lab-001")).toEqual({
      kind: "fixture",
      documentId: "demo-lab-001",
    });
  });
});
