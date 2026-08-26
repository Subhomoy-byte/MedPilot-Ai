# MedPilot AI — Test Plan

## Unit tests
- OCR confidence classification
- schema validation
- safety rules
- error formatting
- input validation

## OCR tests
- clear image
- poor-quality image
- handwritten document
- rotated document
- empty image
- unsupported file

## AI tests
Mock Gemini for:
- valid structured output
- malformed JSON
- missing fields
- unexpected fields
- timeout
- unavailable API
- retryable failure

## Safety tests
- diagnosis request
- dosage modification
- medication start
- medication stop
- unreadable medicine
- missing dosage
- emergency language
- low OCR confidence

## API tests
- /api/health
- /api/upload
- /api/ocr
- /api/analyze
- /api/chat
- /api/history

## Integration test
```text
Document
 -> OCR
 -> confidence
 -> Gemini
 -> schema validation
 -> safety validation
 -> final response
```

## Demo tests
The sample flow must work without live external AI services.

## Quality gate
Before submission:
- lint passes
- TypeScript passes
- tests pass
- production build passes
- no secrets committed
- demo path works reliably
