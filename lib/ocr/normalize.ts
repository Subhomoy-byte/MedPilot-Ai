/**
 * Conservative OCR text cleanup only. No medical spelling correction,
 * abbreviation expansion, or guessed dosages.
 */
export function normalizeOcrText(text: string): string {
  const withoutNul = text.replace(/\u0000/g, "");
  const withoutControls = withoutNul.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  const normalized = withoutControls.normalize("NFC");
  const lines = normalized.split(/\r\n|\n|\r/).map((line) => line.replace(/[ \t]+/g, " ").trimEnd());
  return lines.join("\n").trim();
}

export function hasUsableOcrText(text: string): boolean {
  const lettersOrDigits = normalizeOcrText(text).replace(/[^\p{L}\p{N}]+/gu, "");
  return lettersOrDigits.length >= 2;
}
