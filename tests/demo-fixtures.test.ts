import { describe, expect, it } from "vitest";
import { isDemoMode } from "@/lib/env";
import { getFixtureAnalysis, getFixtureOcr } from "@/lib/demo/fixtures";
import { buildChatResponse } from "@/lib/demo/chat";
import {
  chatResponseSchema,
  medPilotAnalysisSchema,
  ocrResultSchema,
} from "@/lib/validation/schemas";

describe("demo fixtures", () => {
  it("uses the exact fixture ids", () => {
    expect(getFixtureOcr("demo-prescription-001").documentId).toBe("demo-prescription-001");
    expect(getFixtureOcr("demo-lab-001").documentId).toBe("demo-lab-001");
    expect(getFixtureOcr("demo-discharge-001").documentId).toBe("demo-discharge-001");
  });

  it("proves demo analysis passes the same runtime schema as live analysis", () => {
    for (const id of ["demo-prescription-001", "demo-lab-001", "demo-discharge-001"] as const) {
      const analysis = getFixtureAnalysis(id, "en");
      expect(medPilotAnalysisSchema.parse(analysis).source).toBe("demo_fixture");
      expect(ocrResultSchema.parse(getFixtureOcr(id)).source).toBe("demo_fixture");
    }
  });

  it("is deterministic", () => {
    const a = getFixtureAnalysis("demo-prescription-001", "hi");
    const b = getFixtureAnalysis("demo-prescription-001", "hi");
    expect(a).toEqual(b);
  });

  it("parses DEMO_MODE only when the value is true", () => {
    expect(isDemoMode("true")).toBe(true);
    expect(isDemoMode("TRUE")).toBe(true);
    expect(isDemoMode("false")).toBe(false);
    expect(isDemoMode(undefined)).toBe(false);
    expect(isDemoMode("1")).toBe(false);
  });

  it("returns schema-valid chat for grounding statuses", () => {
    const supported = chatResponseSchema.parse(
      buildChatResponse({
        documentId: "demo-prescription-001",
        language: "en",
        message: "What does this document say about metformin?",
      }),
    );
    expect(supported.groundingStatus).toBe("SUPPORTED_BY_DOCUMENT");

    const missing = chatResponseSchema.parse(
      buildChatResponse({
        documentId: "demo-prescription-001",
        language: "en",
        message: "What is the weather in Paris today?",
      }),
    );
    expect(missing.groundingStatus).toBe("INSUFFICIENT_INFORMATION");

    const restricted = chatResponseSchema.parse(
      buildChatResponse({
        documentId: "demo-prescription-001",
        language: "en",
        message: "Diagnose me and tell me to stop taking this medicine",
      }),
    );
    expect(restricted.groundingStatus).toBe("SAFETY_RESTRICTED");
  });
});
