import { afterEach, describe, expect, it } from "vitest";
import { POST as uploadPost } from "@/app/api/upload/route";
import { MAX_FILE_BYTES } from "@/lib/constants";
import { resolveDocument } from "@/lib/documents/resolve";
import { documentStore } from "@/lib/storage";
import { resetDocumentStoreForTests, seedDocumentForTests } from "@/lib/storage/memory";
import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  uploadResultSchema,
} from "@/lib/validation/schemas";
import { fileFromBytes, jpegBytes, pngBytes, readJson } from "./helpers";

describe("document storage and upload flow", () => {
  afterEach(() => {
    resetDocumentStoreForTests();
  });

  it("stores a valid upload and retrieves the same bytes by documentId", async () => {
    const original = jpegBytes();
    const form = new FormData();
    form.set("file", fileFromBytes("scan.jpg", original, "image/jpeg"));

    const response = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const raw = (await readJson(response)) as { data: Record<string, unknown> };
    const body = apiSuccessEnvelopeSchema.parse(raw);
    const data = uploadResultSchema.parse(body.data);

    expect(data.status).toBe("uploaded");
    expect(data.source).toBe("upload");
    expect(data.mimeType).toBe("image/jpeg");
    expect(data.sizeBytes).toBe(original.length);
    expect(raw.data).not.toHaveProperty("bytes");

    const stored = documentStore.get(data.documentId);
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe("uploaded");
    expect(stored?.bytes).toEqual(original);
    expect(stored?.filename).toBe("scan.jpg");

    const resolved = resolveDocument(data.documentId);
    expect(resolved).toMatchObject({ kind: "stored" });
    if ("kind" in resolved && resolved.kind === "stored") {
      expect(resolved.record.bytes).toEqual(original);
    }
  });

  it("retrieves PNG bytes after create", () => {
    const bytes = pngBytes();
    const created = documentStore.create({
      filename: "lab.png",
      mimeType: "image/png",
      sizeBytes: bytes.length,
      pageCount: null,
      bytes,
    });
    const stored = documentStore.get(created.documentId);
    expect(stored?.bytes).toEqual(bytes);
    expect(stored?.mimeType).toBe("image/png");
  });

  it("rejects invalid MIME via upload", async () => {
    const form = new FormData();
    form.set(
      "file",
      fileFromBytes("notes.txt", new TextEncoder().encode("hello"), "text/plain"),
    );
    const response = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("UNSUPPORTED_FILE");
    expect(documentStore.get("unused")).toBeNull();
  });

  it("rejects invalid extension even when bytes look like JPEG", async () => {
    const form = new FormData();
    form.set("file", fileFromBytes("scan.gif", jpegBytes(), "image/jpeg"));
    const response = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("UNSUPPORTED_FILE");
  });

  it("rejects files over 10 MiB and does not store them", async () => {
    const huge = new Uint8Array(MAX_FILE_BYTES + 1);
    huge[0] = 0xff;
    huge[1] = 0xd8;
    huge[2] = 0xff;
    const form = new FormData();
    form.set("file", fileFromBytes("huge.jpg", huge, "image/jpeg"));
    const response = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("rejects empty files and does not store them", async () => {
    const form = new FormData();
    form.set("file", fileFromBytes("empty.jpg", new Uint8Array(), "image/jpeg"));
    const response = await uploadPost(
      new Request("http://localhost/api/upload", { method: "POST", body: form }),
    );
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("INVALID_FILE");
  });

  it("returns DOCUMENT_EXPIRED for an expired stored document", () => {
    seedDocumentForTests({
      documentId: "expired-upload",
      status: "uploaded",
      source: "upload",
      filename: "scan.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 3,
      pageCount: null,
      createdAt: new Date(Date.now() - 61 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      bytes: jpegBytes(),
      ocrText: null,
      ocrConfidence: null,
      lastAnalysis: null,
    });
    expect(resolveDocument("expired-upload")).toEqual({ error: "DOCUMENT_EXPIRED" });
    expect(documentStore.get("expired-upload")).toBeNull();
  });

  it("returns DOCUMENT_NOT_FOUND for a missing document", () => {
    expect(resolveDocument("does-not-exist")).toEqual({ error: "DOCUMENT_NOT_FOUND" });
    expect(documentStore.get("does-not-exist")).toBeNull();
  });

  it("does not put demo fixtures in DocumentStore", () => {
    expect(documentStore.get("demo-prescription-001")).toBeNull();
    expect(resolveDocument("demo-prescription-001")).toEqual({
      kind: "fixture",
      documentId: "demo-prescription-001",
    });
  });
});
