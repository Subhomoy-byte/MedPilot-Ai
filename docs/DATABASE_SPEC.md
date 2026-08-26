# MedPilot AI — Database Specification

## Purpose
Supabase is intended for authentication and persistence after the core OCR/AI pipeline is working.

## Planned tables
- users
- documents
- ocr_results
- medicine_analysis
- chat_history
- saved_reports

## documents
Potential fields:
- id
- user_id
- filename
- document_type
- storage_reference
- status
- created_at

## ocr_results
Potential fields:
- id
- document_id
- extracted_text
- confidence
- confidence_level
- needs_review
- created_at

## medicine_analysis
Stores validated structured analysis associated with a document.

## chat_history
Potential fields:
- id
- document_id
- user_id
- role
- message
- created_at

## saved_reports
Stores user-selected saved analyses.

## Security
Private medical documents must not be public by default. Use ownership checks and Supabase Row Level Security. Users must only access their own data.

## Data minimization
Store only information needed for the product. Avoid logging medical document contents or secrets.

Exact columns, indexes, foreign keys and RLS policies should be finalized before implementation.
