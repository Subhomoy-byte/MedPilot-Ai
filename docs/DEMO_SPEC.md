# MedPilot AI — Demo Mode Specification

Deterministic demo exists so judges can complete the product journey when live OCR/Gemini fail. Demo uses the **same HTTP endpoints and schemas** as live processing. The frontend must **not** ship a separate fake API.

## Environment

```text
DEMO_MODE=true
```

Parse as boolean: the string `true` (case-insensitive) enables demo mode. Any other value is off.

When `DEMO_MODE=true`:

- Health reports `demoMode: true`.
- Fixture `documentId`s work without a prior upload.
- If live Gemini (or live OCR, if invoked) fails after retries, **fall back** to the matching fixture payload instead of failing the judge path.
- Fallback payloads set `source: "demo_fixture"` (analysis) and still include disclaimer, uncertainties, safety notes, and `spokenText`.

When `DEMO_MODE=false`:

- Fixture ids may still be accepted for explicit sample-document demos (hackathon convenience) **or** rejected — **MVP decision: fixture ids are always valid `documentId`s** so the UI can offer “Load sample prescription” without a second API.
- Live upload/OCR/analyze failures do **not** silently swap in a fixture unless `DEMO_MODE=true`.

## Fixture identifiers

Exact strings:

| `documentId` | Document type | Intended UI |
|---|---|---|
| `demo-prescription-001` | `prescription` | Medicine cards, instructions as written, uncertainty examples |
| `demo-lab-001` | `lab_report` | Tests as written, no inferred diagnosis |
| `demo-discharge-001` | `discharge_summary` | Summary + mixed medicines/tests as applicable |

These ids never expire (`expiresAt: null`). They are not stored in guest DocumentStore.

## Endpoints that accept fixtures

| Endpoint | Behavior |
|---|---|
| `GET /api/health` | Reports `demoMode` |
| `POST /api/upload` | Not required for fixtures |
| `POST /api/ocr` | Returns canned OCR text + confidence for that fixture |
| `POST /api/analyze` | Returns canned `MedPilotAnalysis` for the requested `language` |
| `POST /api/chat` | Answers from canned document context only; same `ChatResponse` schema |
| `GET /api/history` | Unchanged (auth milestone) |

Unknown `documentId` that is not a fixture and not in DocumentStore: `DOCUMENT_NOT_FOUND`.

## Schema identity

Fixture JSON **must** validate as:

- OCR success `data` (ocr endpoint)
- `MedPilotAnalysis` (analyze)
- `ChatResponse` (chat)

including `disclaimer`, `needsReview` where appropriate, `spokenText`, and enums from `API_CONTRACT.md`.

Chat fixture behavior:

- In-document question → `SUPPORTED_BY_DOCUMENT`
- Off-document → `INSUFFICIENT_INFORMATION`
- Diagnose/prescribe/start/stop → `SAFETY_RESTRICTED`

Determinism: same request → same response (no randomness).

## Mapping live failures to fixtures (`DEMO_MODE=true`)

If the user uploaded a real file and Gemini fails:

- If `documentType` is known, use the matching fixture’s **analysis fields** but keep the user’s `documentId` and set `source: "demo_fixture"`.
- If type is `unknown`, use `demo-prescription-001` field templates only as last resort and keep `needsReview: true` plus an `Uncertainty` that live analysis was unavailable.

Never mix raw Gemini fragments with fixture text.
