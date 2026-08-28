import type { DocumentType, LanguageCode, MedicalDocument } from '../types';

type SupportedApiLanguage = 'en' | 'hi' | 'bn';

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { message?: string } | null;
}

interface AnalysisResponse {
  documentId: string;
  documentType: 'prescription' | 'lab_report' | 'discharge_summary' | 'unknown';
  summary: string;
  spokenText: string;
  medicines: Array<{
    medicineNameAsExtracted: string | null;
    strengthAsWritten: string | null;
    instructionsAsWritten: string | null;
    patientFriendlyExplanation: string;
    confidence: number;
    uncertain: boolean;
    uncertainReasons: string[];
    warnings: string[];
  }>;
  tests: Array<{
    testNameAsExtracted: string | null;
    valueAsWritten: string | null;
    unitAsWritten: string | null;
    referenceRangeAsWritten: string | null;
    flagAsWritten: string | null;
    patientFriendlyExplanation: string;
    confidence: number;
    uncertain: boolean;
    uncertainReasons: string[];
    warnings: string[];
  }>;
  interactionAlerts: Array<{
    summary: string;
    substancesAsWritten: string[];
    warnings: string[];
  }>;
  uncertainties: Array<{ message: string }>;
  warnings: string[];
  disclaimer: { text: string };
  ocr: { confidence: number; needsReview: boolean };
  needsReview: boolean;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const url = (path: string) => `${apiBaseUrl}${path}`;

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? 'The request could not be completed.');
  }
  return payload.data;
}

function toApiLanguage(language: LanguageCode): SupportedApiLanguage {
  return language === 'hi' || language === 'bn' ? language : 'en';
}

function toDocumentType(type: AnalysisResponse['documentType']): DocumentType {
  return type === 'unknown' ? 'prescription' : type;
}

function confidencePercent(confidence: number): number {
  return Math.round(Math.max(0, Math.min(1, confidence)) * 100);
}

export async function uploadAndAnalyze(file: File, language: LanguageCode): Promise<MedicalDocument> {
  const formData = new FormData();
  formData.append('file', file);
  const upload = await readApi<{ documentId: string }>(
    await fetch(url('/api/upload'), { method: 'POST', body: formData }),
  );

  await readApi(
    await fetch(url('/api/ocr'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ documentId: upload.documentId }),
    }),
  );

  const analysis = await readApi<AnalysisResponse>(
    await fetch(url('/api/analyze'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ documentId: upload.documentId, language: toApiLanguage(language) }),
    }),
  );

  return {
    id: analysis.documentId,
    title: file.name,
    type: toDocumentType(analysis.documentType),
    uploadedAt: new Date().toLocaleDateString(),
    status: analysis.needsReview ? 'needs_review' : 'explained',
    overallConfidence: confidencePercent(analysis.ocr.confidence),
    hasUncertainties: analysis.needsReview,
    documentImageUrl: URL.createObjectURL(file),
    medicines: analysis.medicines.map((medicine, index) => ({
      id: `medicine-${index}`,
      name: medicine.medicineNameAsExtracted ?? 'Unreadable medicine name',
      strength: medicine.strengthAsWritten ?? 'Not clearly written',
      dosageForm: 'As written',
      instructions: medicine.instructionsAsWritten ?? 'No instructions were extracted',
      frequency: 'See original document',
      purpose: medicine.patientFriendlyExplanation,
      ocrConfidence: confidencePercent(medicine.confidence),
      rawOcrText: medicine.medicineNameAsExtracted ?? '',
      uncertaintyReason: medicine.uncertainReasons.join(' '),
      isLowConfidence: medicine.uncertain,
      interactions: [],
      interactionNotes: medicine.warnings.join(' '),
      withFood: 'either',
    })),
    labs: analysis.tests.map((test, index) => ({
      id: `test-${index}`,
      name: test.testNameAsExtracted ?? 'Unreadable test name',
      value: test.valueAsWritten ?? 'Not clearly written',
      unit: test.unitAsWritten ?? '',
      referenceRange: test.referenceRangeAsWritten ?? 'Not listed',
      status: test.flagAsWritten === 'H' ? 'high' : test.flagAsWritten === 'L' ? 'low' : test.uncertain ? 'uncertain' : 'normal',
      confidence: confidencePercent(test.confidence),
      plainExplanation: test.patientFriendlyExplanation,
      clinicalContext: test.warnings.join(' '),
      category: 'Other',
    })),
    interactions: analysis.interactionAlerts.map((alert, index) => ({
      id: `interaction-${index}`,
      entityIds: [],
      entityNames: alert.substancesAsWritten,
      severity: 'caution',
      title: 'Document-supported interaction note',
      plainSummary: alert.summary,
      rationale: alert.warnings.join(' '),
      doctorQuestionPrompt: 'Could you please review this possible interaction noted in my document?',
    })),
    plainSummary: {
      overview: analysis.summary,
      keyTakeaways: [...analysis.uncertainties.map((item) => item.message), ...analysis.warnings].slice(0, 3),
      actionItems: ['Review the original document with a qualified healthcare professional.'],
      disclaimer: analysis.disclaimer.text,
    },
    audioText: analysis.spokenText,
    suggestedQuestions: ['What parts of this document should I review with my healthcare professional?'],
  };
}

export async function askCopilot(documentId: string, message: string, language: LanguageCode): Promise<string> {
  const response = await readApi<{ answer: string }>(
    await fetch(url('/api/chat'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ documentId, message, language: toApiLanguage(language) }),
    }),
  );
  return response.answer;
}
