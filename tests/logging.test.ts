import { describe, expect, it } from "vitest";
import { logRequest } from "@/lib/logging";

describe("observability", () => {
  it("serializes only operational fields", () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (value: unknown) => {
      lines.push(String(value));
    };
    try {
      logRequest({
        requestId: "req-1",
        endpoint: "/api/analyze",
        durationMs: 12,
        status: 200,
        documentId: "demo-prescription-001",
      });
    } finally {
      console.log = original;
    }
    expect(lines).toHaveLength(1);
    const payload = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(payload).toEqual({
      requestId: "req-1",
      endpoint: "/api/analyze",
      durationMs: 12,
      status: 200,
      documentId: "demo-prescription-001",
    });
    expect(payload).not.toHaveProperty("text");
    expect(payload).not.toHaveProperty("prompt");
    expect(payload).not.toHaveProperty("ocr");
  });
});
