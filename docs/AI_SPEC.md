# MedPilot AI — AI Specification

## Purpose

Gemini converts **conservatively normalized OCR text** into a structured, patient-friendly **canonical** `MedPilotAnalysis`. Chat answers questions using **that document’s OCR + validated analysis only**.

Canonical TypeScript shapes live in `docs/API_CONTRACT.md`. This file defines pipeline, Gemini I/O, translation, TTS, and failure behavior.

## Pipeline

```text
OCR
  -> confidence classification (high / medium / low)
  -> conservative normalization
  -> Gemini structured JSON (canonical English object)
  -> runtime schema validation
  -> application safety validation
  -> translation of user-facing fields (if language !== en)
  -> API response
```

Chat:

```text
validated analysis + truncated OCR
  -> Gemini grounded answer JSON
  -> schema validation
  -> same safety engine
  -> translation if needed
  -> ChatResponse
```

Raw model output never reaches the frontend.

## Canonical analysis (required keys)

See `API_CONTRACT.md` for full field nullability. Summary:

- `MedPilotAnalysis`
- `MedicineAnalysis` — `medicineNameAsExtracted`, `strengthAsWritten`, `instructionsAsWritten`, `patientFriendlyExplanation`, `confidence`, `confidenceLevel`, `uncertain`, `uncertainReasons`, `warnings`
- `TestAnalysis` — extracted-as-written values only; `flagAsWritten` only if printed on the document
- `InteractionAlert` — document-supported awareness only
- `Uncertainty`, `SafetyNote`, `Disclaimer`
- `ocr.confidence` / `ocr.confidenceLevel` / `ocr.needsReview`
- `spokenText`
- `needsReview`

Do **not** add schema fields for diagnosis, prescription generation, recommended dosage, start/stop advice, or inferred disease.

## OCR confidence and analysis

Thresholds (0.0–1.0): `high` ≥ 0.80; `medium` ≥ 0.50 and < 0.80; `low` < 0.50.

Low OCR **does not** skip Gemini when usable text exists. The model and validators must:

- copy unreadable tokens as uncertain, not “best guess” drug names or lab numbers;
- set `uncertain: true` and populate `uncertainties[]`;
- set `needsReview: true`;
- keep `medicineNameAsExtracted` / numeric fields `null` rather than inventing values.

If OCR text is empty or unusable, do not call Gemini for analysis; return `OCR_FAILED` or `DOCUMENT_NOT_READY` as specified in the API contract.

## Conservative normalization

Allowed:

- Unicode normalization
- Trim and collapse excessive whitespace
- Strip NUL / non-text control characters
- Preserve line breaks enough to keep list structure

**Forbidden:**

- Expanding or “correcting” medical abbreviations
- Spell-checking medicine names
- Inferring missing strength, frequency, or lab values
- Reordering clinical meaning

Normalization must not invent clinical corrections.

## Gemini input policy

Send only:

1. `normalizedOcrText` (required)
2. `documentTypeHint` if already known (`prescription` | `lab_report` | `discharge_summary` | `unknown`); otherwise `unknown`
3. `language` (requested UI language; **canonical generation is still English**, then translate)
4. OCR metadata useful for uncertainty: `confidence`, `confidenceLevel`, `needsReview`

Do not send: API keys, user account data, prior unrelated chats, extra filenames, or speculative clinical annotations.

## Gemini configuration contract

Environment (never commit values; never `NEXT_PUBLIC_` for secrets):

| Variable | Required | Meaning |
|---|---|---|
| `GEMINI_API_KEY` | For live AI | Server-only secret |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash` |
| `DEMO_MODE` | No | `true` / `false`; default `false` in production-like runs, `true` recommended for judging if keys fail |

Initial generation settings:

| Setting | Value |
|---|---|
| Structured output | JSON object matching canonical schema (`responseMimeType: application/json` or equivalent schema-constrained JSON) |
| Temperature | `0.2` |
| Max output tokens | `4096` |
| Request timeout | `30` seconds |
| Retry count | **2 retries** (3 attempts total) |
| Retryable | HTTP 429, 503, 500, network/timeout |
| Not retryable | 400, 401, 403, schema-invalid after success |

If live Gemini fails after retries: when `DEMO_MODE=true`, return the deterministic fixture for that document type / id using the **same** `MedPilotAnalysis` schema (`source: "demo_fixture"`). When `DEMO_MODE=false`, return `AI_UNAVAILABLE` or `AI_INVALID_RESPONSE`.

## Prompt requirements

- Simple patient-friendly language.
- No diagnosis.
- No prescription generation.
- No dosage modification.
- No start/stop medication instructions.
- No invented values or medicine names.
- Explicit uncertainty.
- Professional review for clinical decisions.
- Document-grounded follow-up answers only.
- Interaction content only if supported by the document (see safety spec).

## Interaction awareness (MVP)

MedPilot is **not** a drug-interaction checker.

- Do not query a general interaction database.
- Do not let the model assert interactions from world knowledge.
- If the document itself mentions an interaction or incompatible combination, emit at most an `InteractionAlert` with `support: "document_supported"` and `professionalReviewRequired: true`.
- Otherwise `interactionAlerts` is `[]`.
- Wording is awareness + professional review, never a treatment plan.

## Validation

Every model response must pass **runtime schema validation** (Zod or equivalent) against `MedPilotAnalysis` or the chat JSON shape **before** safety and **before** the frontend.

- Extra unexpected fields: strip, do not forward.
- Missing required fields: `AI_INVALID_RESPONSE` (or demo fallback).
- Enum mismatches: invalid.

## Translation

Freeze:

1. Generate the **canonical analysis in English**.
2. Run schema validation and the application safety engine on that object.
3. If `language` is `hi` or `bn`, translate **user-facing strings only** on the already-validated object.
4. Translation must **not** re-interpret medical content (no new findings, no dropped hedges).

**Never drop or empty:** `uncertainties`, `warnings` (top-level and per-item), `safetyNotes`, `disclaimer` (including `disclaimer.text`).

**Do not translate “as written” source fields** (`medicineNameAsExtracted`, `strengthAsWritten`, `instructionsAsWritten`, `valueAsWritten`, `unitAsWritten`, `referenceRangeAsWritten`, `flagAsWritten`, `substancesAsWritten`). Translate explanations, summaries, `spokenText`, messages, and `disclaimer.text`.

Chat: same rule — safety on English/canonical answer, then translate `answer` / `spokenText` / notes / disclaimer.

## TTS (`spokenText`)

No TTS backend.

`MedPilotAnalysis.spokenText` is the canonical spoken-text field: a short patient-friendly explanation of the document (summary-level), including that some items may need review when `needsReview` is true, without reading raw OCR or inventing facts.

`ChatResponse.spokenText` is TTS-ready speech for that answer (usually aligned with `answer`).

Frontend/device Web Speech (or OS TTS) consumes these strings.

## Chat grounding and limits

Context to the model: validated `MedPilotAnalysis` plus OCR text truncated to **8000** characters.

- Off-document questions → `INSUFFICIENT_INFORMATION`, no general encyclopedia diagnosis.
- Prompt injection / “ignore safety / diagnose me” → `SAFETY_RESTRICTED`, same safety engine as analysis.
- Max message **500** characters; max **10** turns retained per guest document.

## Languages

`en`, `hi`, `bn` as `LanguageCode`. Unknown language: `VALIDATION_FAILED`.

## Failure handling

Handle API failure, timeout, malformed JSON, missing fields, and rate limits. Keep a deterministic demo fallback when `DEMO_MODE=true` (`docs/DEMO_SPEC.md`).
