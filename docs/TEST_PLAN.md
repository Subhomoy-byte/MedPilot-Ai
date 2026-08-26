# MedPilot AI — Test Plan

Tests must use the frozen schemas in `docs/API_CONTRACT.md`. Demo fixtures must pass the same schema validators as live responses.

## Unit tests

- OCR confidence classification (`high` ≥ 0.80, `medium` ≥ 0.50, `low` < 0.50)
- `needsReview` derivation
- schema validation (`MedPilotAnalysis`, `ChatResponse`, medicines/tests)
- safety rules (including interaction strip, disclaimer injection)
- error envelope formatting
- input validation (file policy, chat length, language enum)
- conservative normalization (does not rewrite drug names)
- DocumentStore expiry / `DOCUMENT_EXPIRED`
- logging redaction (no OCR/prompt/response/secrets in log strings)

## OCR tests

- clear image
- poor-quality image (success + `needsReview` / `low` or `medium`, not fatal `OCR_LOW_CONFIDENCE`)
- handwritten document
- rotated document
- empty image / empty file → `INVALID_FILE` or `OCR_FAILED` as specified
- unsupported file → `UNSUPPORTED_FILE`
- oversize → `FILE_TOO_LARGE`
- PDF page limit → `TOO_MANY_PAGES`

## AI tests

Mock Gemini for:

- valid structured output
- malformed JSON
- missing fields
- unexpected fields (stripped, not forwarded)
- timeout
- unavailable API
- retryable failure (429/503)
- invented interaction → stripped
- unreadable name guessed by model → forced `null` + uncertain by safety/validation policy

## Safety tests

- diagnosis request
- dosage modification
- medication start
- medication stop
- unreadable medicine
- missing dosage
- emergency language
- low OCR confidence (analysis returned, uncertainty preserved, no confident invented fields)
- off-document question → `INSUFFICIENT_INFORMATION`
- prompt injection → `SAFETY_RESTRICTED`
- translation preserves `uncertainties`, `warnings`, `safetyNotes`, `disclaimer`

## API tests

- `GET /api/health`
- `POST /api/upload`
- `POST /api/ocr`
- `POST /api/analyze` (including `language`)
- `POST /api/chat` (`documentId`, `message`, `language`)
- `GET /api/history` (guest → `UNAUTHORIZED` until auth milestone)

## Integration test

```text
Document
 -> OCR
 -> confidence
 -> Gemini (mocked)
 -> schema validation
 -> safety validation
 -> final MedPilotAnalysis
```

Also: low-confidence OCR still reaches analysis with `needsReview: true`.

## Demo tests

- `DEMO_MODE=true` and Gemini unavailable still serves fixture payloads
- Fixture ids `demo-prescription-001`, `demo-lab-001`, `demo-discharge-001` on `/api/ocr`, `/api/analyze`, `/api/chat`
- Fixture payloads pass the **same** Zod/schema as live
- Frontend does not need a second fake API

## Quality gate

Before submission:

- lint passes
- TypeScript passes
- tests pass
- production build passes
- no secrets committed
- demo path works reliably
- OCR/AI routes are Node runtime, not Edge
