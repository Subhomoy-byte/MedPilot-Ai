import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "@napi-rs/canvas", "pdfjs-dist", "@google/genai"],
  // Ensure the bundled Tesseract language data and WASM engine binaries
  // (both referenced via dynamic paths at runtime, not static imports) are
  // included in the deployed /api/ocr serverless function instead of being
  // tree-shaken out by Next.js's automatic file tracing.
  outputFileTracingIncludes: {
    "/api/ocr": ["./lib/ocr/tessdata/**", "./node_modules/tesseract.js-core/**"],
  },
};

export default nextConfig;
