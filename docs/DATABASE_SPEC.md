# MedPilot AI — Database Specification

## Purpose

Supabase is intended for **authentication and persistence after** the core OCR/AI pipeline works. The guest/demo path must not require it.

## Pre-Supabase: DocumentStore

Guest uploads use the **DocumentStore** abstraction (`docs/ARCHITECTURE.md`), not SQL.

Initial target: **single-process Node in-memory (optional temp files for the same process)**.

| Topic | Contract |
|---|---|
| Durability | Not durable across serverless instances or restarts |
| Guest TTL | **60 minutes** from `createdAt`, then purge; APIs return `DOCUMENT_EXPIRED` |
| What is stored | Original bytes, filename, mime, status, OCR text + confidence, optional validated analysis, last N chat turns (max 10) |
| What is not stored | Secrets; unlimited history |
| Demo fixtures | Not written to DocumentStore; served from `lib/demo/` |

This store is **not** production medical records storage. Replace with Supabase private buckets + RLS before production.

Do not add Redis unless a later explicit product decision requires it.

## Planned tables (Supabase milestone only)

- `documents`
- `ocr_results`
- `medicine_analysis` (validated `MedPilotAnalysis` JSON, not raw Gemini)
- `chat_history`
- `saved_reports`

Use **Supabase Auth** for identity. Do not create a parallel password `users` table unless a profile payload is required later.

## documents

Potential fields:

- `id`
- `user_id` (auth uid; null not used for other people’s data)
- `filename`
- `document_type`
- `storage_reference` (private bucket only)
- `status` (same enum as API: `uploaded` | `ocr_processing` | `ocr_complete` | `analysis_processing` | `analysis_complete` | `failed`)
- `created_at`
- `expires_at` (optional; authenticated retention policy TBD at that milestone)

## ocr_results

Potential fields:

- `id`
- `document_id`
- `extracted_text` (PHI)
- `confidence`
- `confidence_level`
- `needs_review`
- `created_at`

## medicine_analysis

Stores **validated** structured analysis (`MedPilotAnalysis`) associated with a document. Never persist raw Gemini JSON.

## chat_history

Potential fields:

- `id`
- `document_id`
- `user_id`
- `role`
- `message`
- `grounding_status` (when implemented)
- `created_at`

## saved_reports

Stores user-selected saved analyses.

## Security

Private medical documents must not be public by default. Use ownership checks and Supabase Row Level Security. Users must only access their own data. Storage buckets: private; signed URLs only.

## Data minimization

Store only information needed for the product. Avoid logging medical document contents or secrets (`docs/ARCHITECTURE.md` observability rules).

Exact columns, indexes, foreign keys and RLS policies are finalized at the Supabase milestone, not before.
