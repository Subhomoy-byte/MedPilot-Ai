import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES } from "@/lib/constants";
import { sniffMime, validateUpload } from "@/lib/upload/validate";
import { jpegBytes, pdfBytes, pngBytes } from "./helpers";

describe("upload validation", () => {
  it("accepts JPEG with matching extension and magic bytes", () => {
    const result = validateUpload({
      filename: "scan.jpg",
      declaredMime: "image/jpeg",
      bytes: jpegBytes(),
    });
    expect(result.ok).toBe(true);
  });

  it("accepts PNG", () => {
    const result = validateUpload({
      filename: "scan.png",
      declaredMime: "image/png",
      bytes: pngBytes(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageCount).toBeNull();
    }
  });

  it("accepts PDF with 5 pages", () => {
    const result = validateUpload({
      filename: "report.pdf",
      declaredMime: "application/pdf",
      bytes: pdfBytes(5),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageCount).toBe(5);
    }
  });

  it("rejects empty files", () => {
    const result = validateUpload({
      filename: "scan.jpg",
      declaredMime: "image/jpeg",
      bytes: new Uint8Array(),
    });
    expect(result).toMatchObject({ ok: false, code: "INVALID_FILE" });
  });

  it("rejects unsupported MIME/extension", () => {
    const result = validateUpload({
      filename: "notes.txt",
      declaredMime: "text/plain",
      bytes: new TextEncoder().encode("hello"),
    });
    expect(result).toMatchObject({ ok: false, code: "UNSUPPORTED_FILE" });
  });

  it("rejects extension/content mismatch", () => {
    const result = validateUpload({
      filename: "scan.png",
      declaredMime: "image/png",
      bytes: jpegBytes(),
    });
    expect(result).toMatchObject({ ok: false, code: "UNSUPPORTED_FILE" });
  });

  it("rejects files over 10 MiB", () => {
    const bytes = new Uint8Array(MAX_FILE_BYTES + 1);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;
    const result = validateUpload({
      filename: "huge.jpg",
      declaredMime: "image/jpeg",
      bytes,
    });
    expect(result).toMatchObject({ ok: false, code: "FILE_TOO_LARGE" });
  });

  it("rejects PDFs over 5 pages", () => {
    const result = validateUpload({
      filename: "long.pdf",
      declaredMime: "application/pdf",
      bytes: pdfBytes(6),
    });
    expect(result).toMatchObject({ ok: false, code: "TOO_MANY_PAGES" });
  });

  it("sniffs JPEG, PNG, and PDF magic bytes", () => {
    expect(sniffMime(jpegBytes())).toBe("image/jpeg");
    expect(sniffMime(pngBytes())).toBe("image/png");
    expect(sniffMime(pdfBytes(1))).toBe("application/pdf");
  });
});
