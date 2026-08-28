# Medora frontend

This Vite application is the MedPilot web interface. Its live document flow uses the backend in the repository:

`POST /api/upload` → `POST /api/ocr` → `POST /api/analyze`, with `POST /api/chat` for document-grounded questions.

## Development

1. Start the repository backend: `npm run dev` from the repository root.
2. Start this frontend: `npm run dev` from this directory.

The Vite proxy forwards `/api` requests to `http://localhost:3000` by default. For a separately deployed backend, set `VITE_API_BASE_URL` to its public origin (without a trailing slash).

The backend supports English, Hindi, and Bengali. Other interface languages use English for API requests until the backend adds support for them.
