export type DocumentType = 'prescription' | 'lab_report' | 'discharge_summary';
export type DocumentStatus = 'processing' | 'needs_review' | 'explained';

export type LanguageCode = 'en' | 'bn' | 'es' | 'hi' | 'fr' | 'zh' | 'de' | 'tl' | 'ar';

export interface MedicineEntity {
  id: string;
  name: string;
  genericName?: string;
  strength: string;
  dosageForm: string; // e.g. "Tablet", "Capsule", "Syrup"
  instructions: string; // e.g. "Take 1 tablet by mouth daily in the evening with water"
  frequency: string; // e.g. "Once daily (Evening)"
  purpose: string; // Plain-language explanation of what it is for
  ocrConfidence: number; // 0 - 100
  rawOcrText: string; // What OCR saw before translation
  uncertaintyReason?: string; // e.g. "Handwritten dosage numeral has trailing loop"
  isLowConfidence: boolean; // < 75%
  interactions: string[]; // IDs of other medicines with flagged interaction
  interactionNotes?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  withFood?: 'with_food' | 'empty_stomach' | 'either';
}

export interface LabTestEntity {
  id: string;
  name: string;
  code?: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'uncertain';
  confidence: number;
  plainExplanation: string; // Plain translation for patient
  clinicalContext: string;
  category: 'Metabolic' | 'Lipid' | 'Complete Blood Count' | 'Liver' | 'Kidney' | 'Other';
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface RawOcrToken {
  id: string;
  text: string;
  confidence: number;
  isLowConfidence: boolean;
  type: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface InteractionAlert {
  id: string;
  entityIds: string[]; // Medicine or food IDs involved
  entityNames: string[];
  severity: 'caution' | 'moderate' | 'notable' | 'high';
  title: string;
  plainSummary: string;
  description?: string;
  rationale: string;
  actionableAdvice?: string;
  doctorQuestionPrompt: string; // What the patient should ask their doctor
}

export interface DocumentAnnotation {
  id: string;
  type: 'medicine' | 'lab' | 'instruction' | 'warning';
  title: string;
  text: string;
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface MedicalDocument {
  id: string;
  title: string;
  type: DocumentType;
  uploadedAt: string;
  doctorName?: string;
  clinicName?: string;
  patientName?: string;
  status: DocumentStatus;
  overallConfidence: number; // Average OCR/AI extraction confidence
  hasUncertainties: boolean;
  documentImageUrl: string;
  documentSvgData?: string;
  rawOcrTokens?: RawOcrToken[];
  
  medicines: MedicineEntity[];
  labs: LabTestEntity[];
  interactions: InteractionAlert[];
  
  plainSummary: {
    overview: string;
    keyTakeaways: string[];
    actionItems: string[];
    disclaimer: string;
  };
  
  audioText: string;
  suggestedQuestions: string[];
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  referencedEntityId?: string;
  isDisclaimer?: boolean;
}

export interface AppSettings {
  language: LanguageCode;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  voiceSpeed: number; // 0.75 - 1.5
  reducedMotion: boolean;
  autoPlayVoice: boolean;
}
