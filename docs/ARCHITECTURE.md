# MedPilot AI — Architecture

## Core flow

```text
Frontend
  -> Next.js server/API (Node.js runtime)
  -> upload validation (file policy)
  -> DocumentStore (guest/demo abstraction)
  -> OCR (Tesseract.js)
  -> OCR confidence classification
  -> conservative text normalization
  -> Gemini structured JSON analysis (server-side only)
  -> runtime schema validation (canonical MedPilotAnalysis)
  -> application safety validation
  -> optional translation of validated object
  -> final API response (never raw model output)
```

Chat uses the same validated document context and the same application safety engine.

## Backend modules

```text
app/api/
  upload/
  ocr/
  analyze/
  chat/
  history/
  health/

lib/
  ocr/
  ai/
  safety/
  validation/
  demo/
  storage/          # DocumentStore abstraction
  logging/

types/              # canonical schemas shared with API
tests/
```

## Runtime

OCR and AI routes (`/api/upload`, `/api/ocr`, `/api/analyze`, `/api/chat`) **must use the Node.js runtime**, not the Edge runtime.

Reasons:

- Tesseract.js needs Node-compatible WASM / filesystem behavior.
- PDF pages are rasterized on the Node server before OCR (max 5 pages); this is not an Edge-friendly workload.
- Gemini calls, timeouts, and retries are long-running relative to Edge limits.
- Guest `DocumentStore` is process-local memory (see below).
- Do not optimize prematurely for serverless Edge execution.

Set `runtime = "nodejs"` (or equivalent) on those routes.

## Boundaries

- Gemini API calls are server-side only.
- Secrets never reach the browser (`GEMINI_API_KEY` is never `NEXT_PUBLIC_*`).
- OCR, AI, safety, storage, and persistence logic stay outside presentation components.
- Frontend consumes stable API contracts only.
- Raw Gemini output never leaves the AI module except into schema validation.
- Supabase is optional and unused until its milestone.

## DocumentStore (pre-Supabase)

The application must depend on a **DocumentStore** interface, not on a concrete vendor SDK.

```text
DocumentStore
  create(file, metadata) -> DocumentRecord
  get(documentId) -> DocumentRecord | null
  update(documentId, patch) -> DocumentRecord
  delete(documentId) -> void
  purgeExpired() -> void
```

**Initial implementation target:** a development/demo-friendly **local, single-process Node in-memory store** (with optional temp-disk bytes for the current process only).

Limitations (explicit):

- Suitable for **local development and hackathon demo** only.
- **Not durable** across serverless instances, process restarts, or multiple replicas.
- Guest/demo medical bytes and OCR text **expire** (see lifecycle).
- Replaced by **Supabase Auth + private storage + RLS** before any production deployment.

Do **not** introduce Redis or another external store unless a later product decision requires it. The PRD does not require it.

Demo fixtures (`demo-prescription-001`, `demo-lab-001`, `demo-discharge-001`) are served from `lib/demo/` and **do not require** DocumentStore persistence.

## Document lifecycle

Statuses (exact strings):

| Status | Meaning |
|---|---|
| `uploaded` | File accepted; bytes stored in DocumentStore (guest) or fixture resolved (demo). |
| `ocr_processing` | OCR started. |
| `ocr_complete` | OCR finished; text + confidence stored on the record. |
| `analysis_processing` | Gemini/demo analysis started. |
| `analysis_complete` | Validated, safety-checked analysis available. |
| `failed` | Terminal failure (`OCR_FAILED`, `AI_UNAVAILABLE` without usable demo fallback, `VALIDATION_FAILED`, etc.). |

Guest/demo uploaded documents expire **60 minutes** after `createdAt` (or sooner on process restart). After expiry, APIs return `DOCUMENT_EXPIRED`. Do not persist guest medical information indefinitely.

## Principles

1. Separate concerns (OCR, AI, validation, safety, storage, demo).
2. Never expose raw model output.
3. Preserve uncertainty; never guess unreadable medical information.
4. Keep demo behavior deterministic and on the **same** API schemas.
5. Avoid unnecessary dependencies and abstractions.
6. Keep the core analysis pipeline usable without Supabase.
7. Log operational metadata only — never document text, OCR, prompts, or secrets.

## Observability

Logs **may** contain: request id, endpoint, duration, HTTP status, error code, opaque `documentId`, `document.status`.

Logs **must not** contain: uploaded bytes/text, OCR text, Gemini prompts or responses, API keys, auth tokens, filenames that include clinical content if avoidable (store original filename on the record; do not print file contents).

## Demo mode

See `docs/DEMO_SPEC.md`. `DEMO_MODE=true` enables live-failure fallback. Fixture ids `demo-prescription-001`, `demo-lab-001`, and `demo-discharge-001` use the same endpoints and schemas as live traffic.

## Voice (TTS)

There is **no TTS backend**. The API provides `spokenText` on analysis (and chat `answer` suitable for speech). The frontend/device performs speech synthesis.
