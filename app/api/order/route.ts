import { apiError, apiSuccess } from "@/lib/api/respond";
import { getFixtureAnalysis } from "@/lib/demo/fixtures";
import { resolveDocument } from "@/lib/documents/resolve";
import { CANONICAL_DISCLAIMER_TEXT } from "@/lib/safety/messages";
import { orderRequestSchema, orderResultSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOCK_ORDER_NOTE =
  "This is a simulated order for demo purposes only. No real purchase has been made. Please confirm with a pharmacist before ordering.";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Expected a JSON body with documentId and items.");
  }

  const parsed = orderRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_FAILED", "documentId and at least one valid medicine item are required.");
  }

  const resolved = await resolveDocument(parsed.data.documentId);
  if ("error" in resolved) {
    return apiError(resolved.error);
  }

  const medicines =
    resolved.kind === "fixture"
      ? getFixtureAnalysis(resolved.documentId, "en").medicines
      : resolved.record.lastAnalysis?.medicines;

  if (!medicines) {
    return apiError("DOCUMENT_NOT_READY", "Analyze this document before ordering.");
  }

  const items = [];
  for (const requestedItem of parsed.data.items) {
    const medicine = medicines[requestedItem.medicineIndex];
    if (!medicine) {
      return apiError("VALIDATION_FAILED", "One requested medicine does not exist in this document.");
    }
    if (medicine.uncertain || medicine.medicineNameAsExtracted === null) {
      return apiError("MEDICINE_NOT_ORDERABLE");
    }
    items.push({
      medicineNameAsExtracted: medicine.medicineNameAsExtracted,
      strengthAsWritten: medicine.strengthAsWritten,
      instructionsAsWritten: medicine.instructionsAsWritten,
      quantity: requestedItem.quantity,
    });
  }

  return apiSuccess(orderResultSchema.parse({
    orderId: crypto.randomUUID(),
    documentId: parsed.data.documentId,
    items,
    placedAt: new Date().toISOString(),
    mock: true,
    disclaimer: { text: CANONICAL_DISCLAIMER_TEXT },
    note: MOCK_ORDER_NOTE,
  }));
}
