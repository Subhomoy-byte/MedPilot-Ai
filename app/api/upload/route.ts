import { apiError, apiSuccess } from "@/lib/api/respond";
import { documentStore } from "@/lib/storage";
import { validateUpload } from "@/lib/upload/validate";
import { uploadResultSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("VALIDATION_FAILED", "Expected multipart form data with a file field.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("VALIDATION_FAILED", "A file field named file is required.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateUpload({
    filename: file.name,
    declaredMime: file.type || undefined,
    bytes,
  });

  if (!validation.ok) {
    return apiError(validation.code, validation.message);
  }

  const record = documentStore.create({
    filename: file.name,
    mimeType: validation.mimeType,
    sizeBytes: bytes.length,
    pageCount: validation.pageCount,
    bytes,
  });

  const data = uploadResultSchema.parse({
    documentId: record.documentId,
    status: "uploaded",
    source: "upload",
    filename: record.filename,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    pageCount: record.pageCount,
    expiresAt: record.expiresAt,
  });

  return apiSuccess(data);
}
