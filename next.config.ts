import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "@napi-rs/canvas", "pdfjs-dist", "@google/genai"],
  // Ensure the bundled Tesseract language data (referenced via a dynamic
  // path at runtime, not a static import) is included in the deployed
  // /api/ocr serverless function instead of being tree-shaken out.
  outputFileTracingIncludes: {
    "/api/ocr": ["./lib/ocr/tessdata/**"],
  },
};

export default nextConfig;
