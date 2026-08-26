# MedPilot AI — API Contract

## Response envelope
Success:
```json
{"success":true,"data":{},"error":null}
```

Error:
```json
{"success":false,"data":null,"error":{"code":"ERROR_CODE","message":"Human-readable message","retryable":false}}
```

## Endpoints

### GET /api/health
Service health.

### POST /api/upload
Multipart upload for supported document files.

Response data:
```json
{"documentId":"string","status":"uploaded"}
```

### POST /api/ocr
Input:
```json
{"documentId":"string"}
```
Response data:
```json
{"documentId":"string","text":"string","confidence":0.94,"confidenceLevel":"high","needsReview":false}
```

### POST /api/analyze
Input:
```json
{"documentId":"string","language":"en"}
```
Returns validated MedPilot analysis. Raw Gemini output must never be returned.

### POST /api/chat
Input:
```json
{"documentId":"string","message":"string"}
```
Must be grounded in the uploaded document and validated analysis.

### GET /api/history
Returns authenticated user's saved analyses.

## Initial error codes
- INVALID_FILE
- UNSUPPORTED_FILE
- OCR_FAILED
- OCR_LOW_CONFIDENCE
- AI_UNAVAILABLE
- AI_INVALID_RESPONSE
- VALIDATION_FAILED
- SAFETY_BLOCK
- DOCUMENT_NOT_FOUND
- UNAUTHORIZED
- INTERNAL_ERROR
