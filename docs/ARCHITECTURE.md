# MedPilot AI — Architecture

## Core flow
```text
Frontend
  -> Next.js server/API
  -> upload validation
  -> OCR (Tesseract.js)
  -> OCR confidence
  -> text normalization
  -> Gemini structured analysis
  -> runtime schema validation
  -> application safety validation
  -> final API response
```

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

types/
tests/
```

## Boundaries
- Gemini API calls are server-side only.
- Secrets never reach the browser.
- OCR, AI, safety and persistence logic stay outside presentation components.
- Frontend consumes stable API contracts.

## Principles
1. Separate concerns.
2. Never expose raw model output.
3. Preserve uncertainty.
4. Keep demo behavior deterministic.
5. Avoid unnecessary dependencies and abstractions.
6. Keep the core analysis pipeline usable without Supabase.
