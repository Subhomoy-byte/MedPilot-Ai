import { createWorker, type Worker } from "tesseract.js";
import type { OcrWord } from "@/lib/ocr/types";

let workerPromise: Promise<Worker> | null = null;
let queue: Promise<void> = Promise.resolve();

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("eng", 1, {
        logger: () => undefined,
      });
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
    const { data } = await worker.recognize(
      image,
      { rotateAuto: true },
      { text: true, blocks: true },
    );
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
