# MedPilot AI — Master Cursor Prompt

You are the lead engineer and product designer for MedPilot AI.

Build incrementally. Read the PRD and relevant engineering specifications before each milestone. Do not build the entire application at once.

## Engineering rules
- Use Next.js + TypeScript.
- Keep Gemini calls server-side.
- Never expose secrets to client code.
- Separate OCR, AI, validation and safety modules.
- Validate model output at runtime before returning it.
- Never guess unreadable medical information.
- Do not diagnose, prescribe, recommend dosage changes, or tell users to start/stop medication.
- Keep document-grounded chat bounded to uploaded document context.
- Keep demo fallback deterministic.
- Do not modify unrelated files.
- After each milestone run lint, typecheck, relevant tests and build.
- Report exactly what changed.

## Suggested implementation order
1. Foundation
2. Stable mock API
3. OCR
4. Gemini
5. Runtime AI validation
6. Application safety engine
7. Complete analysis pipeline
8. Document-grounded chat
9. Multilingual support
10. Supabase persistence/auth
11. Deterministic demo mode
12. Frontend integration
13. Full testing
14. Security audit
15. Hackathon polish

## Product boundary
MedPilot is a medical-document understanding and health-literacy prototype, not a diagnostic or prescribing system.
