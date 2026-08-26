# MedPilot AI — AI Specification

## Purpose
Gemini converts validated OCR text into structured, patient-friendly explanations.

## Pipeline
```text
OCR -> Gemini -> schema validation -> safety validation -> frontend
```

## Core output
- documentType
- summary
- medicines[]
- tests[]
- interactionAlerts[]
- uncertainties[]
- safetyNotes[]

## Grounding
Explain information supported by the uploaded document. If information is absent or unreadable, preserve uncertainty and do not guess.

## Prompt requirements
- Simple patient-friendly language.
- No diagnosis.
- No prescription generation.
- No dosage modification.
- No start/stop medication instructions.
- No invented values or medicine names.
- Explicit uncertainty.
- Professional review for clinical decisions.
- Document-grounded follow-up answers.

## Validation
Every model response must pass runtime schema validation before reaching the frontend.

## Failure handling
Handle API failure, timeout, malformed output and rate limits. Keep a deterministic demo fallback.

## Languages
Initial languages: English, Hindi, Bengali. Translation must preserve uncertainty and safety information.
