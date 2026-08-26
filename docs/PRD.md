# MedPilot AI — Product Requirements Document

## Product
MedPilot AI is an AI-powered medical document copilot that turns prescriptions, lab reports, and discharge summaries into clear, multilingual, voice-enabled explanations with safety and uncertainty built in.

## Vision
**From Medical Jargon to Clarity.**

MedPilot is a health-literacy layer between complex medical documents and the people who need to understand them.

## Problem
Medical documents can contain handwriting, abbreviations, dense terminology, and information that is difficult for patients and caregivers to understand. Language and accessibility barriers make this harder.

## Target users
- Patients
- Caregivers
- Elderly users
- Users who prefer multilingual or audio explanations

## MVP document types
- Prescriptions
- Laboratory reports
- Discharge summaries

## Core user journey
```text
Document upload
  -> OCR
  -> OCR confidence
  -> AI analysis
  -> Structured explanation
  -> Safety and uncertainty
  -> Language
  -> Voice
  -> Document-grounded Q&A
```

## MVP features
1. Document upload for common image/PDF formats.
2. OCR using Tesseract.js.
3. OCR confidence and uncertainty visibility.
4. Gemini-based structured document analysis.
5. Medicine understanding cards.
6. Laboratory/report summarization.
7. Potential interaction awareness presented as an awareness item.
8. English, Hindi and Bengali output.
9. Browser/device voice playback for patient-friendly explanations.
10. Document-grounded Ask MedPilot chat.
11. Deterministic demo mode for hackathon reliability.
12. Optional authenticated history using Supabase.

## Safety boundaries
MedPilot must not diagnose, prescribe, recommend dosage changes, or instruct users to start/stop medication. It must not guess unreadable medicine names or laboratory values. Uncertainty must be visible.

## Non-goals for MVP
- Autonomous diagnosis
- Autonomous treatment decisions
- Prescription generation
- Medication dosage optimization
- Replacing clinicians
- Full clinical decision support

## Success criteria
A judge can upload or use the sample prescription and experience the complete flow from document to OCR confidence, structured explanation, safety, language, voice and grounded Q&A without needing to understand the implementation.

## Hackathon priority
Reliability, safety, clear product storytelling, deterministic demo fallback, and a polished end-to-end flow are higher priority than adding many secondary features.
