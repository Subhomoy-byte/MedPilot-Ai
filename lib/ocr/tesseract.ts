import fs from "node:fs";
import path from "node:path";
import { createWorker, type Worker } from "tesseract.js";
import type { OcrWord } from "@/lib/ocr/types";

let workerPromise: Promise<Worker> | null = null;
let queue: Promise<void> = Promise.resolve();

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const langPath = path.join(process.cwd(), "lib", "ocr", "tessdata");
      const langFile = path.join(langPath, "eng.traineddata.gz");
      const exists = fs.existsSync(langFile);
      console.log(`[ocr] langFile=${langFile} exists=${exists} cwd=${process.cwd()}`);

      const startWorker = Date.now();
      const worker = await createWorker("eng", 1, {
        logger: () => undefined,
        // Vercel's serverless filesystem is read-only except /tmp.
        // Without this, tesseract.js tries to cache the downloaded
        // language data to a non-writable path, fails silently, and
        // retries until the function times out.
        cachePath: "/tmp",
        // eng.traineddata.gz is bundled in the deployment (see
        // lib/ocr/tessdata/) so OCR never depends on a network fetch to a
        // third-party CDN at request time — that fetch was slow/unreliable
        // enough on Vercel's serverless network to exceed even a 120s
        // function timeout on a cold start.
        langPath,
      });
      console.log(`[ocr] createWorker took ${Date.now() - startWorker}ms`);
      await worker.setParameters({
        user_defined_dpi: "300",
        preserve_interword_spaces: "1",
      });
      return worker;
    })();
  }
  return workerPromise;
}

function clampUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function collectWords(data: { blocks?: Array<{
  paragraphs?: Array<{
    lines?: Array<{
      words?: Array<{ text: string; confidence: number }>;
    }>;
  }>;
}> | null }): OcrWord[] {
  const words: OcrWord[] = [];
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        for (const word of line.words ?? []) {
          if (word.text.trim().length === 0) {
            continue;
          }
          words.push({
            text: word.text,
            confidence: clampUnit(word.confidence / 100),
          });
        }
      }
    }
  }
  return words;
}

export type TesseractPageResult = {
  text: string;
  confidence: number;
  words: OcrWord[];
};

export async function recognizePage(image: Buffer): Promise<TesseractPageResult> {
  const run = queue.then(async () => {
    const worker = await getWorker();
    console.log(`[ocr] worker ready, calling recognize() on ${image.length} bytes`);
    const startRecognize = Date.now();
    const { data } = await worker.recognize(
      image,
      { rotateAuto: true },
      { text: true, blocks: true },
    );
    console.log(`[ocr] recognize() took ${Date.now() - startRecognize}ms`);
    return {
      text: data.text ?? "",
      confidence: clampUnit((data.confidence ?? 0) / 100),
      words: collectWords(data),
    };
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
