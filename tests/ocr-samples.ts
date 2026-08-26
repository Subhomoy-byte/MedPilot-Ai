import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PDFDocument, StandardFonts } from "pdf-lib";

function drawPrintedPrescription(rotateDegrees = 0, blur = false): Buffer {
  const width = 900;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (rotateDegrees !== 0) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotateDegrees * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
  }

  ctx.fillStyle = "#111111";
  ctx.font = "36px sans-serif";
  ctx.fillText("Prescription", 80, 90);
  ctx.font = "32px sans-serif";
  ctx.fillText("Metformin 500 mg", 80, 180);
  ctx.font = "28px sans-serif";
  ctx.fillText("Take one tablet twice daily with meals", 80, 250);

  if (!blur) {
    return canvas.toBuffer("image/png");
  }

  const small = createCanvas(180, 100);
  const sctx = small.getContext("2d");
  sctx.drawImage(canvas, 0, 0, 180, 100);
  const blurred = createCanvas(width, height);
  const bctx = blurred.getContext("2d");
  bctx.imageSmoothingEnabled = true;
  bctx.drawImage(small, 0, 0, width, height);
  return blurred.toBuffer("image/png");
}

export function clearPrescriptionPng(): Buffer {
  return drawPrintedPrescription(0, false);
}

export function blurryPrescriptionPng(): Buffer {
  return drawPrintedPrescription(0, true);
}

export function rotatedPrescriptionPng(): Buffer {
  return drawPrintedPrescription(90, false);
}

export function handwrittenSamplePng(): Buffer {
  const canvas = createCanvas(900, 420);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(0, 0, 900, 420);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  let x = 70;
  let y = 160;
  const strokes = "warfarin as written";
  for (const char of strokes) {
    ctx.beginPath();
    ctx.moveTo(x, y + Math.sin(x / 18) * 8);
    ctx.quadraticCurveTo(x + 6, y - 18, x + 14, y + 10);
    ctx.stroke();
    ctx.font = "22px serif";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(char, x, y + (x % 11) - 4);
    x += 28;
    y += (x % 5) - 2;
  }
  return canvas.toBuffer("image/png");
}

export function emptyImagePng(): Buffer {
  const canvas = createCanvas(400, 300);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 400, 300);
  return canvas.toBuffer("image/png");
}

export function invalidImageBytes(): Uint8Array {
  return Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x00]);
}

export async function labReportPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 280]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("Laboratory report", { x: 48, y: 210, size: 22, font });
  page.drawText("Hemoglobin 13.2 g/dL", { x: 48, y: 150, size: 20, font });
  return pdf.save();
}

export async function pngToJpeg(png: Buffer): Promise<Buffer> {
  const image = await loadImage(png);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, image.width, image.height);
  ctx.drawImage(image, 0, 0);
  return canvas.toBuffer("image/jpeg", 90);
}
