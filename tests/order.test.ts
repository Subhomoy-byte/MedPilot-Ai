import { afterEach, describe, expect, it } from "vitest";
import { POST as orderPost } from "@/app/api/order/route";
import { GUEST_TTL_MS } from "@/lib/constants";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { resetDocumentStoreForTests, seedDocumentForTests } from "@/lib/storage/memory";
import { apiErrorEnvelopeSchema, apiSuccessEnvelopeSchema, orderResultSchema } from "@/lib/validation/schemas";
import type { DocumentRecord } from "@/lib/storage/types";
import { jpegBytes, readJson } from "./helpers";

function seedStoredDocument(lastAnalysis: DocumentRecord["lastAnalysis"]): DocumentRecord {
  const record: DocumentRecord = {
    documentId: crypto.randomUUID(),
    status: "analysis_complete",
    source: "upload",
    filename: "scan.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 12,
    pageCount: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + GUEST_TTL_MS).toISOString(),
    bytes: jpegBytes(),
    ocrText: "Metformin 500 mg\nSecond medicine line unreadable",
    ocrConfidence: 0.91,
    lastAnalysis,
  };
  seedDocumentForTests(record);
  return record;
}

function orderRequest(documentId: string, items: Array<{ medicineIndex: number; quantity: number }>) {
  return new Request("http://localhost/api/order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ documentId, items }),
  });
}

describe("POST /api/order", () => {
  afterEach(() => {
    resetDocumentStoreForTests();
  });

  it("places a mock order only for a confirmed stored medicine", async () => {
    const analysis = getFixtureAnalysis("demo-prescription-001", "en");
    const record = seedStoredDocument({ ...analysis, documentId: crypto.randomUUID(), source: "live" });

    const response = await orderPost(orderRequest(record.documentId, [{ medicineIndex: 0, quantity: 2 }]));
    expect(response.status).toBe(200);
    const result = orderResultSchema.parse(apiSuccessEnvelopeSchema.parse(await readJson(response)).data);
    expect(result.mock).toBe(true);
    expect(result.items).toEqual([
      expect.objectContaining({ medicineNameAsExtracted: "Metformin", quantity: 2 }),
    ]);
  });

  it("rejects the whole request when any selected medicine is uncertain", async () => {
    const analysis = getFixtureAnalysis("demo-prescription-001", "en");
    const record = seedStoredDocument({ ...analysis, documentId: crypto.randomUUID(), source: "live" });

    const response = await orderPost(orderRequest(record.documentId, [{ medicineIndex: 1, quantity: 1 }]));
    expect(response.status).toBe(422);
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("MEDICINE_NOT_ORDERABLE");
    expect(body.data).toBeNull();
  });

  it("orders from a demo fixture using its server-side extracted medicine", async () => {
    const response = await orderPost(orderRequest("demo-prescription-001", [{ medicineIndex: 0, quantity: 1 }]));
    const result = orderResultSchema.parse(apiSuccessEnvelopeSchema.parse(await readJson(response)).data);
    expect(result.mock).toBe(true);
    expect(result.items[0]?.medicineNameAsExtracted).toBe("Metformin");
  });

  it("requires a stored document to be analyzed first", async () => {
    const record = seedStoredDocument(null);
    const response = await orderPost(orderRequest(record.documentId, [{ medicineIndex: 0, quantity: 1 }]));
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("DOCUMENT_NOT_READY");
  });

  it("rejects an out-of-range medicine index", async () => {
    const analysis = getFixtureAnalysis("demo-prescription-001", "en");
    const record = seedStoredDocument({ ...analysis, documentId: crypto.randomUUID(), source: "live" });
    const response = await orderPost(orderRequest(record.documentId, [{ medicineIndex: 9, quantity: 1 }]));
    const body = apiErrorEnvelopeSchema.parse(await readJson(response));
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });
});
