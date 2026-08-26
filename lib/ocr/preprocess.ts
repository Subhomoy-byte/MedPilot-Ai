import { createCanvas, loadImage } from "@napi-rs/canvas";

const MAX_EDGE = 2000;

/**
 * Light visual cleanup only: fit oversized pages and flatten to a PNG bitmap.
 * Does not deskew medical content or rewrite glyphs.
 */
export async function preprocessImage(bytes: Uint8Array): Promise<Buffer> {
  const image = await loadImage(Buffer.from(bytes));
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height, 1));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toBuffer("image/png");
}
