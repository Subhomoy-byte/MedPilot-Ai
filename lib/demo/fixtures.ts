import { DISCLAIMER_TEXT_EN, INTERACTION_AWARENESS_TEXT_EN } from "@/lib/constants";
import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import type { DemoFixtureId } from "@/lib/constants";
import type { DocumentType, LanguageCode, MedPilotAnalysis, OcrResult } from "@/types";
import { medPilotAnalysisSchema, ocrResultSchema } from "@/lib/validation/schemas";
import { EMERGENCY_REDIRECT_MESSAGE } from "@/lib/safety/messages";

const disclaimer = { text: DISCLAIMER_TEXT_EN };

const professionalReviewNote = {
  code: "PROFESSIONAL_REVIEW",
  message: "Clinical decisions should be reviewed with a qualified healthcare professional.",
  severity: "info" as const,
};

const notDiagnosisNote = {
  code: "NOT_A_DIAGNOSIS",
  message: "This explanation is for document understanding only. It is not a diagnosis.",
  severity: "info" as const,
};

type FixturePack = {
  documentType: DocumentType;
  ocrText: string;
  ocrConfidence: number;
  analysis: Omit<MedPilotAnalysis, "documentId" | "language">;
};

function pack(
  documentType: DocumentType,
  ocrText: string,
  ocrConfidence: number,
  analysis: Omit<MedPilotAnalysis, "documentId" | "language" | "ocr" | "needsReview" | "status" | "source" | "expiresAt">,
): FixturePack {
  const confidenceLevel = classifyConfidence(ocrConfidence);
  const medicinesUncertain = analysis.medicines.some((item) => item.uncertain);
  const testsUncertain = analysis.tests.some((item) => item.uncertain);
  const ocrReview = ocrNeedsReview(confidenceLevel, medicinesUncertain || testsUncertain);
  const ocr = {
    confidence: ocrConfidence,
    confidenceLevel,
    needsReview: ocrReview,
  };
  return {
    documentType,
    ocrText,
    ocrConfidence,
    analysis: {
      ...analysis,
      status: "analysis_complete",
      source: "demo_fixture",
      expiresAt: null,
      ocr,
      needsReview: ocrReview || medicinesUncertain || testsUncertain,
    },
  };
}

const prescription = pack(
  "prescription",
  [
    "Rx",
    "Metformin 500 mg",
    "Take one tablet twice daily with meals",
    "Second medicine line unreadable",
  ].join("\n"),
  0.94,
  {
    documentType: "prescription",
    summary:
      "This document appears to be a prescription. It lists metformin 500 mg with written directions to take one tablet twice daily with meals. Another medicine line could not be read clearly.",
    spokenText:
      "This looks like a prescription. It mentions metformin 500 milligrams, with written instructions to take one tablet twice daily with meals. Another medicine name could not be read clearly, so that item should be checked with a healthcare professional. This is not a diagnosis or a new prescription.",
    medicines: [
      {
        medicineNameAsExtracted: "Metformin",
        strengthAsWritten: "500 mg",
        instructionsAsWritten: "Take one tablet twice daily with meals",
        patientFriendlyExplanation:
          "The document lists metformin at 500 mg, with written directions to take one tablet twice daily with meals. This explains what is written; it is not a recommendation to start, stop, or change a dose.",
        confidence: 0.94,
        confidenceLevel: "high",
        uncertain: false,
        uncertainReasons: [],
        warnings: [],
      },
      {
        medicineNameAsExtracted: null,
        strengthAsWritten: null,
        instructionsAsWritten: null,
        patientFriendlyExplanation:
          "A second medicine line is present but could not be read clearly. The name and instructions were not guessed.",
        confidence: 0.31,
        confidenceLevel: "low",
        uncertain: true,
        uncertainReasons: ["UNREADABLE_MEDICINE_NAME", "MISSING_STRENGTH", "MISSING_INSTRUCTIONS"],
        warnings: ["This medicine name was unreadable and was not guessed."],
      },
    ],
    tests: [],
    interactionAlerts: [],
    uncertainties: [
      {
        code: "UNREADABLE_MEDICINE_NAME",
        message: "A medicine name on the prescription could not be read clearly and was not guessed.",
        relatedField: "medicines[1].medicineNameAsExtracted",
      },
    ],
    safetyNotes: [notDiagnosisNote, professionalReviewNote],
    emergencyFlags: { flagged: false, triggerPhrases: [], note: EMERGENCY_REDIRECT_MESSAGE },
    warnings: ["Some information on this prescription could not be read clearly."],
    disclaimer,
  },
);

const lab = pack(
  "lab_report",
  [
    "Laboratory report",
    "Hemoglobin 13.2 g/dL  Reference 12.0-15.0",
    "Second result line smudged",
  ].join("\n"),
  0.66,
  {
    documentType: "lab_report",
    summary:
      "This document appears to be a laboratory report. One printed result is hemoglobin 13.2 g/dL with a printed reference range of 12.0-15.0. Another result line could not be read clearly. Values were not interpreted as a diagnosis.",
    spokenText:
      "This looks like a lab report. It lists hemoglobin 13.2 grams per deciliter, with a printed reference range of 12.0 to 15.0. Another result could not be read clearly and was not guessed. This is not a diagnosis. Please review the report with a healthcare professional. Some items may need a closer look because reading confidence is medium.",
    medicines: [],
    tests: [
      {
        testNameAsExtracted: "Hemoglobin",
        valueAsWritten: "13.2",
        unitAsWritten: "g/dL",
        referenceRangeAsWritten: "12.0-15.0",
        flagAsWritten: null,
        patientFriendlyExplanation:
          "The report lists hemoglobin as 13.2 g/dL and prints a reference range of 12.0-15.0. This restates what is written. It does not diagnose a condition.",
        confidence: 0.72,
        confidenceLevel: "medium",
        uncertain: false,
        uncertainReasons: [],
        warnings: [],
      },
      {
        testNameAsExtracted: null,
        valueAsWritten: null,
        unitAsWritten: null,
        referenceRangeAsWritten: null,
        flagAsWritten: null,
        patientFriendlyExplanation:
          "Another result line is present but could not be read clearly. No value was guessed.",
        confidence: 0.28,
        confidenceLevel: "low",
        uncertain: true,
        uncertainReasons: ["UNREADABLE_TEST_VALUE"],
        warnings: ["This result was unreadable and was not guessed."],
      },
    ],
    interactionAlerts: [],
    uncertainties: [
      {
        code: "LOW_OCR",
        message: "Overall reading confidence is medium, so details should be checked against the original report.",
        relatedField: null,
      },
      {
        code: "UNREADABLE_TEST_VALUE",
        message: "A laboratory value could not be read clearly and was not guessed.",
        relatedField: "tests[1].valueAsWritten",
      },
    ],
    safetyNotes: [notDiagnosisNote, professionalReviewNote],
    emergencyFlags: { flagged: false, triggerPhrases: [], note: EMERGENCY_REDIRECT_MESSAGE },
    warnings: ["Some laboratory lines could not be read clearly."],
    disclaimer,
  },
);

const discharge = pack(
  "discharge_summary",
  [
    "Discharge summary (partially faded)",
    "Warfarin as written on the chart",
    "Note on form: avoid ibuprofen with warfarin as documented",
    "Follow-up clinic as written",
  ].join("\n"),
  0.41,
  {
    documentType: "discharge_summary",
    summary:
      "This document appears to be a discharge summary. It mentions warfarin as written and includes a note on the form about ibuprofen with warfarin. Reading confidence is low, so details should be checked against the original page. This is not a treatment plan.",
    spokenText:
      "This looks like a discharge summary. Reading confidence is low, so please compare it with the original document. It mentions warfarin as written, and the form includes a note about ibuprofen with warfarin. That note is for awareness only and is not a decision to start or stop any medicine. Please review it with a healthcare professional.",
    medicines: [
      {
        medicineNameAsExtracted: "Warfarin",
        strengthAsWritten: null,
        instructionsAsWritten: null,
        patientFriendlyExplanation:
          "The summary lists warfarin as written. Strength and directions were not clearly readable, so they were not guessed.",
        confidence: 0.44,
        confidenceLevel: "low",
        uncertain: true,
        uncertainReasons: ["LOW_OCR", "MISSING_STRENGTH", "MISSING_INSTRUCTIONS"],
        warnings: ["Strength and directions were not clearly readable."],
      },
    ],
    tests: [],
    interactionAlerts: [
      {
        summary: INTERACTION_AWARENESS_TEXT_EN,
        support: "document_supported",
        substancesAsWritten: ["warfarin", "ibuprofen"],
        professionalReviewRequired: true,
        warnings: ["This restates a note printed on the document. It is not a treatment decision."],
      },
    ],
    uncertainties: [
      {
        code: "LOW_OCR",
        message: "Overall reading confidence is low. Please compare this explanation with the original document.",
        relatedField: null,
      },
      {
        code: "MISSING_STRENGTH",
        message: "No clear strength was readable for warfarin, so none was filled in.",
        relatedField: "medicines[0].strengthAsWritten",
      },
    ],
    safetyNotes: [notDiagnosisNote, professionalReviewNote],
    emergencyFlags: { flagged: false, triggerPhrases: [], note: EMERGENCY_REDIRECT_MESSAGE },
    warnings: ["Low reading confidence. Unreadable details were not guessed."],
    disclaimer,
  },
);

const FIXTURES: Record<DemoFixtureId, FixturePack> = {
  "demo-prescription-001": prescription,
  "demo-lab-001": lab,
  "demo-discharge-001": discharge,
  "demo-discharge-emergency-001": pack(
    "discharge_summary",
    [
      "Discharge summary",
      "The document records chest pain as written.",
      "Urgent review is noted on the document.",
    ].join("\n"),
    0.92,
    {
      documentType: "discharge_summary",
      summary:
        "This discharge summary includes a written note mentioning chest pain. This restates the document and is not a diagnosis.",
      spokenText:
        "This discharge summary includes a written note mentioning chest pain. Seek urgent professional or emergency healthcare support if this is an emergency.",
      medicines: [],
      tests: [],
      interactionAlerts: [],
      uncertainties: [],
      safetyNotes: [notDiagnosisNote, professionalReviewNote],
      emergencyFlags: {
        flagged: true,
        triggerPhrases: ["Emergency-related document language: chest pain."],
        note: EMERGENCY_REDIRECT_MESSAGE,
      },
      warnings: [],
      disclaimer,
    },
  ),
};

export function getFixtureOcr(documentId: DemoFixtureId): OcrResult {
  const fixture = FIXTURES[documentId];
  const confidenceLevel = classifyConfidence(fixture.ocrConfidence);
  const payload: OcrResult = {
    documentId,
    status: "ocr_complete",
    source: "demo_fixture",
    text: fixture.ocrText,
    confidence: fixture.ocrConfidence,
    confidenceLevel,
    needsReview: ocrNeedsReview(
      confidenceLevel,
      fixture.analysis.medicines.some((item) => item.uncertain) ||
        fixture.analysis.tests.some((item) => item.uncertain),
    ),
    expiresAt: null,
  };
  return ocrResultSchema.parse(payload);
}

export function getFixtureAnalysis(
  documentId: DemoFixtureId,
  language: LanguageCode,
): MedPilotAnalysis {
  const fixture = FIXTURES[documentId];
  const payload: MedPilotAnalysis = {
    ...structuredClone(fixture.analysis),
    documentId,
    language,
  };
  return medPilotAnalysisSchema.parse(payload);
}

export function getFixtureDocumentType(documentId: DemoFixtureId): DocumentType {
  return FIXTURES[documentId].documentType;
}

export function getFixtureKeywords(documentId: DemoFixtureId): string[] {
  switch (documentId) {
    case "demo-prescription-001":
      return ["metformin", "tablet", "prescription", "medicine", "dose as written"];
    case "demo-lab-001":
      return ["hemoglobin", "lab", "report", "g/dl", "reference"];
    case "demo-discharge-001":
      return ["warfarin", "ibuprofen", "discharge", "summary"];
    case "demo-discharge-emergency-001":
      return ["chest pain", "discharge", "summary", "urgent"];
    default:
      return [];
  }
}
