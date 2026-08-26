import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}

/**
 * Server-only Gemini client.
 * The official SDK sends the key via authenticated headers, not query strings.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: getGeminiApiKey(),
    });
  }
  return client;
}

export function resetGeminiClientForTests(): void {
  client = null;
}
