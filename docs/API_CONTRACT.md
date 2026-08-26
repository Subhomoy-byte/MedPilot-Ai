# MedPilot AI — API Contract

This contract is frozen for frontend/backend parallel work. Types below are TypeScript / Zod-compatible. Implementation must validate requests and responses at runtime.

Related: `docs/AI_SPEC.md` (canonical analysis object), `docs/DEMO_SPEC.md` (fixtures), `docs/SAFETY_SPEC.md`.

## Response envelope

Success:

```json
{"success":true,"data":{},"error":null}
```

Error:

```json
{"success":false,"data":null,"error":{"code":"ERROR_CODE","message":"Human-readable message","retryable":false}}
```

`data` is never raw Gemini output.

## Shared enums

```ts
type LanguageCode = "en" | "hi" | "bn";

type DocumentType =
  | "prescription"
  | "lab_report"
  | "discharge_summary"
  | "unknown";

type ConfidenceLevel = "high" | "medium" | "low";

type DocumentStatus =
  | "uploaded"
  | "ocr_processing"
  | "ocr_complete"
  | "analysis_processing"
  | "analysis_complete"
  | "failed";

type DocumentSource = "upload" | "demo_fixture";

type GroundingStatus =
  | "SUPPORTED_BY_DOCUMENT"
  | "INSUFFICIENT_INFORMATION"
  | "SAFETY_RESTRICTED";

type SafetyStatus = "ok" | "restricted" | "emergency_redirect";

type InteractionSupport = "document_supported" | "insufficient_information";

type AnalysisOrigin = "live" | "demo_fixture";
```

## File policy (MVP upload)

Supported extensions: `.jpg`, `.jpeg`, `.png`, `.pdf`  
Supported MIME types (must match extension):

- `image/jpeg`
- `image/png`
- `application/pdf`

Limits (hackathon prototype):

- Maximum file size: **10 MiB**
- Maximum PDF pages: **5**
- Empty file (0 bytes): `INVALID_FILE`
- MIME/extension mismatch or unsupported type: `UNSUPPORTED_FILE`
- Over size: `FILE_TOO_LARGE`
- PDF over page limit: `TOO_MANY_PAGES`

Validate both MIME (from sniffed/content-type) and extension. Do not trust client MIME alone.

## OCR confidence policy

Overall OCR `confidence` is a number in **0.0–1.0** (mean page confidence).

| `confidenceLevel` | Threshold |
|---|---|
| `high` | `confidence >= 0.80` |
| `medium` | `0.50 <= confidence < 0.80` |
| `low` | `confidence < 0.50` |

`needsReview` is `true` when:

- `confidenceLevel` is `medium` or `low`, **or**
- any extracted medicine/test field is marked `uncertain`.

**Low confidence does not automatically fail OCR or destroy analysis.**

- `POST /api/ocr` returns **success** with `confidenceLevel: "low"` and `needsReview: true` when some text was extracted.
- `POST /api/analyze` **still runs** when possible, preserves uncertainty, marks affected fields, and sets `needsReview: true`.
- Unreadable names/values stay `null` with `uncertain: true`. **Never guess.**
- `OCR_LOW_CONFIDENCE` is **not** a fatal error for a completed OCR pass. Do not return it solely because confidence is low.
- If OCR produces no usable text, return `OCR_FAILED` (not a fake analysis).

## Document lifecycle in API responses

Every upload/OCR/analyze success payload includes:

- `documentId` (string)
- `status` (`DocumentStatus`)
- `expiresAt` (`string` ISO-8601 or `null` for demo fixtures that are not expired by TTL)

Guest uploaded documents: `expiresAt` = `createdAt + 60 minutes`.  
Expired access: `DOCUMENT_EXPIRED`.  
Analyze before `ocr_complete`: `DOCUMENT_NOT_READY`.  
Unknown id: `DOCUMENT_NOT_FOUND`.

Demo fixture ids skip upload and never expire (`expiresAt: null`). See `docs/DEMO_SPEC.md`.

## Canonical object: Disclaimer

Required on every successful **analyze** and **chat** payload.

```ts
interface Disclaimer {
  text: string; // required, localized with the response language
}
```

Canonical English `text` (translate for `hi` / `bn`, do not weaken):

> MedPilot is an educational medical-document understanding prototype. It does not diagnose conditions, prescribe treatment, or replace professional medical care. Always review your document and any questions with a qualified healthcare professional.

## Canonical object: Uncertainty

```ts
interface Uncertainty {
  code: string; // required, e.g. "LOW_OCR" | "UNREADABLE_MEDICINE_NAME" | "MISSING_STRENGTH" | "MISSING_INSTRUCTIONS" | "UNREADABLE_TEST_VALUE"
  message: string; // required, patient-friendly
  relatedField: string | null; // optional pointer, e.g. "medicines[0].medicineNameAsExtracted"
}
```

## Canonical object: SafetyNote

```ts
interface SafetyNote {
  code: string; // required, e.g. "NOT_A_DIAGNOSIS" | "PROFESSIONAL_REVIEW" | "EMERGENCY_REDIRECT" | "DOSAGE_BOUNDARY"
  message: string; // required, non-prescriptive
  severity: "info" | "warning"; // required; not a clinical risk score
}
```

## Canonical object: MedicineAnalysis

No fields for diagnosis, indication-as-disease, recommended dose, start/stop, or “should take”.

```ts
interface MedicineAnalysis {
  medicineNameAsExtracted: string | null; // null if unreadable; never invented
  strengthAsWritten: string | null; // dose/strength exactly as written; null if absent/unreadable
  instructionsAsWritten: string | null; // directions as written; null if absent/unreadable
  patientFriendlyExplanation: string; // explains what is written; must not add new clinical instructions
  confidence: number; // 0.0–1.0, required
  confidenceLevel: ConfidenceLevel; // required
  uncertain: boolean; // required; true if name/strength/instructions missing, unreadable, or low OCR
  uncertainReasons: string[]; // required array, empty if none
  warnings: string[]; // required array; non-prescriptive visibility warnings only
}
```

## Canonical object: TestAnalysis

No fields that interpret values as a diagnosis (no “you have X”, no automatic disease flags).

```ts
interface TestAnalysis {
  testNameAsExtracted: string | null;
  valueAsWritten: string | null;
  unitAsWritten: string | null;
  referenceRangeAsWritten: string | null; // only if present on the document
  flagAsWritten: string | null; // only a flag printed on the document, e.g. "H"; not inferred
  patientFriendlyExplanation: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  uncertain: boolean;
  uncertainReasons: string[];
  warnings: string[];
}
```

## Canonical object: InteractionAlert

MVP is **not** a general drug-interaction engine. Include an alert only when the **document text** supports mentioning a possible concern (for example the document itself notes an interaction). Otherwise omit it. Never present a confident interaction claim from general model knowledge.

```ts
interface InteractionAlert {
  summary: string; // awareness wording; must request professional review
  support: InteractionSupport; // MVP: only "document_supported" may be returned to clients
  substancesAsWritten: string[]; // names as they appear in the document
  professionalReviewRequired: true; // always true (literal)
  warnings: string[];
}
```

Required awareness wording (language-adapted, not weakened):

> A possible interaction concern was identified from the document. This is not a treatment decision. Please review this with a healthcare professional.

If `support !== "document_supported"`, the safety layer **strips** the alert before the response.

## Canonical object: MedPilotAnalysis

This is `data` for `POST /api/analyze`.

```ts
interface MedPilotAnalysis {
  documentId: string;
  status: "analysis_complete";
  documentType: DocumentType;
  language: LanguageCode;
  source: AnalysisOrigin;
  expiresAt: string | null;
  summary: string; // patient-friendly; document-grounded
  spokenText: string; // canonical TTS string; see AI_SPEC
  medicines: MedicineAnalysis[];
  tests: TestAnalysis[];
  interactionAlerts: InteractionAlert[];
  uncertainties: Uncertainty[]; // never dropped in translation
  safetyNotes: SafetyNote[]; // never dropped
  warnings: string[]; // top-level non-prescriptive warnings; never dropped
  disclaimer: Disclaimer; // never dropped
  ocr: {
    confidence: number;
    confidenceLevel: ConfidenceLevel;
    needsReview: boolean;
  };
  needsReview: boolean; // true if ocr.needsReview or any medicine/test.uncertain
}
```

Empty arrays are valid. Do not omit required keys.

## Endpoints

### GET /api/health

Service health. No secrets.

Success `data`:

```ts
{
  status: "ok";
  demoMode: boolean; // true when DEMO_MODE=true
  geminiConfigured: boolean; // whether GEMINI_API_KEY is present; never the key
}
```

### POST /api/upload

`multipart/form-data` field `file` (required) for a user document.

Success `data`:

```ts
{
  documentId: string;
  status: "uploaded";
  source: DocumentSource; // "upload"
  filename: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null; // PDF page count; null for images
  expiresAt: string; // ISO-8601
}
```

Demo: clients may skip upload and use fixture `documentId` values directly on later endpoints (`docs/DEMO_SPEC.md`).

### POST /api/ocr

Request:

```ts
{ documentId: string }
```

Success `data`:

```ts
{
  documentId: string;
  status: "ocr_complete";
  source: DocumentSource; // "upload" | "demo_fixture"
  text: string; // extracted text for the uploading user; not logged server-side
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  needsReview: boolean;
  expiresAt: string | null;
}
```

Low confidence: still `success: true` with `needsReview: true`.

### POST /api/analyze

Request:

```ts
{
  documentId: string;
  language: LanguageCode; // required
}
```

Success `data`: **`MedPilotAnalysis`** (schema above).

Raw Gemini output must never be returned. Live failures when `DEMO_MODE=true` may return the matching fixture **using this same schema** (`source: "demo_fixture"`).

### POST /api/chat

Request (all required):

```ts
{
  documentId: string;
  message: string; // 1–500 characters after trim
  language: LanguageCode;
}
```

Success `data`:

```ts
interface ChatResponse {
  documentId: string;
  language: LanguageCode;
  answer: string; // patient-friendly; never raw model output
  groundingStatus: GroundingStatus;
  sourceContextIndicator:
    | "DOCUMENT_OCR_AND_ANALYSIS"
    | "DOCUMENT_ANALYSIS"
    | "NONE";
  safetyStatus: SafetyStatus;
  safetyNotes: SafetyNote[];
  disclaimer: Disclaimer;
  spokenText: string; // TTS-ready; typically the same content as answer
}
```

Grounding:

- `SUPPORTED_BY_DOCUMENT` — answer is supported by OCR and/or validated analysis of this `documentId`.
- `INSUFFICIENT_INFORMATION` — question is off-document, unreadable in source, or not present; do not fill from general medical knowledge.
- `SAFETY_RESTRICTED` — diagnosis / prescribe / dosage change / start-stop / injection-style override; return a boundary message, not a clinical decision.

Prefer HTTP 200 with `groundingStatus: "SAFETY_RESTRICTED"` over `SAFETY_BLOCK` for chat. Use `SAFETY_BLOCK` only if a safe payload cannot be produced.

Chat limits:

- Max message length: **500** characters (`MESSAGE_TOO_LONG`).
- Max retained turns per guest document: **10** (oldest dropped).
- OCR context passed into the model: max **8000** characters.
- Same application safety engine as analysis.

### GET /api/history

Authenticated users only (Supabase milestone). Guests: `UNAUTHORIZED`.

Success `data` (when implemented): `{ items: MedPilotAnalysis[] }` or a thin summary list using the same field names. Not required for the guest/demo path.

## Error codes

| Code | Typical use | `retryable` |
|---|---|---|
| `INVALID_FILE` | Empty or corrupt file | false |
| `UNSUPPORTED_FILE` | Bad type/extension | false |
| `FILE_TOO_LARGE` | Over 10 MiB | false |
| `TOO_MANY_PAGES` | PDF > 5 pages | false |
| `OCR_FAILED` | No usable text / OCR crash | true if transient |
| `OCR_LOW_CONFIDENCE` | **Do not use as fatal** for completed low-confidence OCR | — |
| `DOCUMENT_NOT_READY` | Analyze/chat before OCR complete | false |
| `DOCUMENT_NOT_FOUND` | Unknown id | false |
| `DOCUMENT_EXPIRED` | Guest TTL elapsed | false |
| `AI_UNAVAILABLE` | Gemini down/timeout and no demo fallback | true |
| `AI_INVALID_RESPONSE` | Model output failed schema (no demo fallback) | true |
| `VALIDATION_FAILED` | Request or internal schema failure | false |
| `SAFETY_BLOCK` | Could not emit a safe payload | false |
| `MESSAGE_TOO_LONG` | Chat message > 500 | false |
| `UNAUTHORIZED` | History without auth | false |
| `INTERNAL_ERROR` | Unexpected | false |

## Frontend binding rule

The frontend must not invent fields. Cards, confidence UI, chat, TTS, and disclaimers bind only to this contract and `MedPilotAnalysis` / `ChatResponse`.
