# MedPilot-Ai
MedPilot AI — an AI-powered medical document copilot that turns prescriptions, lab reports, and discharge summaries into clear, multilingual, voice-enabled explanations with safety and uncertainty built in.

## Frontend

The production UI is in [`frontend`](./frontend). It connects to this backend through the documented `/api/upload`, `/api/ocr`, `/api/analyze`, and `/api/chat` endpoints.

For local development, run the backend from the repository root and the Vite frontend from `frontend`. The frontend development server proxies API traffic to `http://localhost:3000`; see [`frontend/README.md`](./frontend/README.md) for separately deployed environments.
