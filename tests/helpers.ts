export function jpegBytes(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
}

export function pngBytes(): Uint8Array {
  return Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
}

export function pdfBytes(pages: number): Uint8Array {
  const pageMarks = Array.from({ length: pages }, () => "/Type /Page").join("\n");
  return Buffer.from(`%PDF-1.4\n${pageMarks}\n%%EOF\n`);
}

export function fileFromBytes(name: string, bytes: Uint8Array, type: string): File {
  return new File([Buffer.from(bytes)], name, { type });
}

export async function readJson(response: Response): Promise<unknown> {
  return response.json();
}
