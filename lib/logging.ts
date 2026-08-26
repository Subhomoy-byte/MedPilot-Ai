export type SafeLogFields = {
  requestId: string;
  endpoint: string;
  durationMs: number;
  status: number;
  errorCode?: string;
  documentId?: string;
  documentStatus?: string;
};

/**
 * Operational logs only. Never pass OCR text, prompts, model output, keys, or tokens.
 */
export function logRequest(fields: SafeLogFields): void {
  console.log(JSON.stringify(fields));
}

export function newRequestId(): string {
  return crypto.randomUUID();
}
