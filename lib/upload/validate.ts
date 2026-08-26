import { MAX_FILE_BYTES, MAX_PDF_PAGES } from "@/lib/constants";
import type { ErrorCode } from "@/types";

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

export type UploadValidationSuccess = {
  ok: true;
  extension: string;
  mimeType: string;
  pageCount: number | null;
};

export type UploadValidationFailure = {
  ok: false;
  code: ErrorCode;
  message: string;
};

export type UploadValidationResult = UploadValidationSuccess | UploadValidationFailure;

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) {
    return "";
  }
  return filename.slice(idx).toLowerCase();
}

export function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }
  return null;
}

export function countPdfPages(bytes: Uint8Array): number {
  const text = Buffer.from(bytes).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?!\s*s)\b/g);
  if (!matches || matches.length === 0) {
    return 1;
  }
  return matches.length;
}

export function validateUpload(input: {
  filename: string;
  declaredMime: string | undefined;
  bytes: Uint8Array;
}): UploadValidationResult {
  if (input.bytes.length === 0) {
    return { ok: false, code: "INVALID_FILE", message: "The uploaded file is empty." };
  }

  if (input.bytes.length > MAX_FILE_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "The file exceeds the 10 MiB limit.",
    };
  }

  const extension = extensionOf(input.filename);
  const expectedMime = EXT_TO_MIME[extension];
  if (!expectedMime) {
    return {
      ok: false,
      code: "UNSUPPORTED_FILE",
      message: "This file type is not supported. Use JPG, JPEG, PNG, or PDF.",
    };
  }

  const sniffed = sniffMime(input.bytes);
  if (!sniffed || sniffed !== expectedMime) {
    return {
      ok: false,
      code: "UNSUPPORTED_FILE",
      message: "File extension and file contents do not match a supported type.",
    };
  }

  if (input.declaredMime && input.declaredMime !== expectedMime && input.declaredMime !== "application/octet-stream") {
    return {
      ok: false,
      code: "UNSUPPORTED_FILE",
      message: "Declared MIME type does not match the file.",
    };
  }

  let pageCount: number | null = null;
  if (expectedMime === "application/pdf") {
    pageCount = countPdfPages(input.bytes);
    if (pageCount > MAX_PDF_PAGES) {
      return {
        ok: false,
        code: "TOO_MANY_PAGES",
        message: "PDFs may contain at most 5 pages.",
      };
    }
  }

  return { ok: true, extension, mimeType: expectedMime, pageCount };
}
