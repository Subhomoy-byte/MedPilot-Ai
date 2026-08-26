export const DISCLAIMER_TEXT_EN =
  "MedPilot is an educational medical-document understanding prototype. It does not diagnose conditions, prescribe treatment, or replace professional medical care. Always review your document and any questions with a qualified healthcare professional.";

export const INTERACTION_AWARENESS_TEXT_EN =
  "A possible interaction concern was identified from the document. This is not a treatment decision. Please review this with a healthcare professional.";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 5;
export const GUEST_TTL_MS = 60 * 60 * 1000;
export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const MAX_CHAT_TURNS = 10;
export const MAX_OCR_CONTEXT_CHARS = 8000;

export const HIGH_CONFIDENCE_MIN = 0.8;
export const MEDIUM_CONFIDENCE_MIN = 0.5;

export const DEMO_FIXTURE_IDS = [
  "demo-prescription-001",
  "demo-lab-001",
  "demo-discharge-001",
] as const;

export type DemoFixtureId = (typeof DEMO_FIXTURE_IDS)[number];
