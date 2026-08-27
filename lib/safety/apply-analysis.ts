import { classifyConfidence, ocrNeedsReview } from "@/lib/ocr/confidence";
import { evaluateTextSafety } from "@/lib/safety/evaluate-text";
import {
  CANONICAL_DISCLAIMER_TEXT,
  EMERGENCY_REDIRECT_MESSAGE,
  INTERACTION_AWARENESS_TEXT,
  LOW_OCR_MESSAGE,
  MISSING_INSTRUCTIONS_MESSAGE,
  MISSING_STRENGTH_MESSAGE,
  MISSING_TEST_VALUE_MESSAGE,
  noteEmergencyRedirect,
  noteNotDiagnosis,
  noteProfessionalReview,
  SAFE_DOCUMENT_NARRATIVE,
  UNREADABLE_MEDICINE_MESSAGE,
  uncertainty,
} from "@/lib/safety/messages";
import {
  DIAGNOSIS_RE,
  DOSAGE_MODIFICATION_RE,
  EMERGENCY_RE,
  findEmergencyTriggerPhrases,
  isBoundarySentence,
  MEDICATION_START_RE,
  MEDICATION_STOP_RE,
  PLACEHOLDER_NAME_RE,
} from "@/lib/safety/patterns";
import { checkPanicLabValues } from "@/lib/safety/panic-values";
import type { AnalysisSafetyResult, SafetyCategory, SafetyDecision, SafetyFinding } from "@/lib/safety/types";
import { medPilotAnalysisSchema } from "@/lib/validation/schemas";
import type {
  InteractionAlert,
  MedPilotAnalysis,
  MedicineAnalysis,
  SafetyNote,
  TestAnalysis,
  Uncertainty,
} from "@/types";

export type AnalysisSafetyContext = {
  ocrText?: string;
};

function uniqueByCode<T extends { code: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.code)) {
      continue;
    }
    seen.add(item.code);
    result.push(item);
  }
  return result;
}

function uniqueUncertainties(items: Uncertainty[]): Uncertainty[] {
  const seen = new Set<string>();
  const result: Uncertainty[] = [];
  for (const item of items) {
    const key = `${item.code}:${item.relatedField ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function uniqueFindings(items: SafetyFinding[]): SafetyFinding[] {
  const seen = new Set<string>();
  const result: SafetyFinding[] = [];
  for (const item of items) {
    if (seen.has(item.category)) {
      continue;
    }
    seen.add(item.category);
    result.push(item);
  }
  return result;
}

function normalizeHaystack(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ");
}

function appearsInDocument(value: string, ocrText: string | undefined): boolean {
  if (!ocrText) {
    return true;
  }
  const needle = value.trim().toLowerCase();
  if (needle.length === 0) {
    return false;
  }
  return normalizeHaystack(ocrText).includes(needle);
}

function emptyToNull(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isPlaceholder(value: string | null): boolean {
  if (value === null) {
    return true;
  }
  return PLACEHOLDER_NAME_RE.test(value.trim());
}

function sentenceHasProhibitedAdvice(sentence: string): boolean {
  if (isBoundarySentence(sentence)) {
    return EMERGENCY_RE.test(sentence);
  }
  return (
    DIAGNOSIS_RE.test(sentence) ||
    MEDICATION_START_RE.test(sentence) ||
    MEDICATION_STOP_RE.test(sentence) ||
    DOSAGE_MODIFICATION_RE.test(sentence)
  );
}

function sanitizeNarrative(text: string): { text: string; rewritten: boolean } {
  const parts = text.match(/[^.!?]+[.!?]*/g);
  if (!parts) {
    return sentenceHasProhibitedAdvice(text)
      ? { text: SAFE_DOCUMENT_NARRATIVE, rewritten: true }
      : { text, rewritten: false };
  }
  let rewritten = false;
  const kept = parts.map((part) => {
    if (sentenceHasProhibitedAdvice(part)) {
      rewritten = true;
      return ` ${SAFE_DOCUMENT_NARRATIVE}`;
    }
    return part;
  });
  if (!rewritten) {
    return { text, rewritten: false };
  }
  const joined = kept.join("").replace(/\s+/g, " ").trim();
  return { text: joined.length > 0 ? joined : SAFE_DOCUMENT_NARRATIVE, rewritten: true };
}

function addFinding(
  findings: SafetyFinding[],
  category: SafetyCategory,
  code: string,
  message: string,
  severity: SafetyFinding["severity"],
): void {
  if (findings.some((item) => item.category === category)) {
    return;
  }
  findings.push({ category, code, message, severity });
}

function sanitizeMedicine(
  medicine: MedicineAnalysis,
  index: number,
  ocrText: string | undefined,
  findings: SafetyFinding[],
  uncertainties: Uncertainty[],
): MedicineAnalysis {
  let name = emptyToNull(medicine.medicineNameAsExtracted);
  let strength = emptyToNull(medicine.strengthAsWritten);
  let instructions = emptyToNull(medicine.instructionsAsWritten);
  const reasons = new Set(medicine.uncertainReasons);
  let uncertain = medicine.uncertain;
  const warnings = [...medicine.warnings];
  const explanation = sanitizeNarrative(medicine.patientFriendlyExplanation);

  if (name !== null && (isPlaceholder(name) || !appearsInDocument(name, ocrText))) {
    name = null;
  }
  if (strength !== null && !appearsInDocument(strength, ocrText)) {
    strength = null;
  }
  if (instructions !== null && isPlaceholder(instructions)) {
    instructions = null;
  }

  if (name === null) {
    uncertain = true;
    reasons.add("UNREADABLE_MEDICINE_NAME");
    addFinding(
      findings,
      "unreadable_medicine",
      "UNREADABLE_MEDICINE_NAME",
      UNREADABLE_MEDICINE_MESSAGE,
      "warning",
    );
    uncertainties.push(
      uncertainty("UNREADABLE_MEDICINE_NAME", UNREADABLE_MEDICINE_MESSAGE, `medicines[${index}].medicineNameAsExtracted`),
    );
    if (!warnings.some((item) => /unreadable|not guessed/i.test(item))) {
      warnings.push("This medicine name was unreadable and was not guessed.");
    }
  }

  if (strength === null) {
    uncertain = true;
    reasons.add("MISSING_STRENGTH");
    addFinding(findings, "missing_dosage", "MISSING_STRENGTH", MISSING_STRENGTH_MESSAGE, "warning");
    uncertainties.push(
      uncertainty("MISSING_STRENGTH", MISSING_STRENGTH_MESSAGE, `medicines[${index}].strengthAsWritten`),
    );
  }

  if (instructions === null) {
    uncertain = true;
    reasons.add("MISSING_INSTRUCTIONS");
    addFinding(
      findings,
      "missing_medical_information",
      "MISSING_INSTRUCTIONS",
      MISSING_INSTRUCTIONS_MESSAGE,
      "warning",
    );
    uncertainties.push(
      uncertainty("MISSING_INSTRUCTIONS", MISSING_INSTRUCTIONS_MESSAGE, `medicines[${index}].instructionsAsWritten`),
    );
  }

  if (medicine.confidenceLevel === "low" || medicine.confidence < 0.5) {
    uncertain = true;
  }

  let patientFriendlyExplanation = explanation.text;
  if (name === null && !/not guessed/i.test(patientFriendlyExplanation)) {
    patientFriendlyExplanation = UNREADABLE_MEDICINE_MESSAGE;
  }

  return {
    ...medicine,
    medicineNameAsExtracted: name,
    strengthAsWritten: strength,
    instructionsAsWritten: instructions,
    patientFriendlyExplanation,
    uncertain,
    uncertainReasons: [...reasons],
    warnings,
    confidenceLevel: classifyConfidence(medicine.confidence),
  };
}

function sanitizeTest(
  test: TestAnalysis,
  index: number,
  ocrText: string | undefined,
  findings: SafetyFinding[],
  uncertainties: Uncertainty[],
): TestAnalysis {
  let testName = emptyToNull(test.testNameAsExtracted);
  let value = emptyToNull(test.valueAsWritten);
  let unit = emptyToNull(test.unitAsWritten);
  let reference = emptyToNull(test.referenceRangeAsWritten);
  let flag = emptyToNull(test.flagAsWritten);
  const reasons = new Set(test.uncertainReasons);
  let uncertain = test.uncertain;
  const warnings = [...test.warnings];
  const explanation = sanitizeNarrative(test.patientFriendlyExplanation);

  if (testName !== null && (isPlaceholder(testName) || !appearsInDocument(testName, ocrText))) {
    testName = null;
  }
  if (value !== null && !appearsInDocument(value, ocrText)) {
    value = null;
  }
  if (unit !== null && ocrText && !appearsInDocument(unit, ocrText)) {
    unit = null;
  }
  if (reference !== null && ocrText && !appearsInDocument(reference, ocrText)) {
    reference = null;
  }
  if (flag !== null && ocrText && !appearsInDocument(flag, ocrText)) {
    flag = null;
  }

  if (testName === null || value === null) {
    uncertain = true;
    reasons.add("UNREADABLE_TEST_VALUE");
    addFinding(
      findings,
      "missing_medical_information",
      "UNREADABLE_TEST_VALUE",
      MISSING_TEST_VALUE_MESSAGE,
      "warning",
    );
    uncertainties.push(
      uncertainty("UNREADABLE_TEST_VALUE", MISSING_TEST_VALUE_MESSAGE, `tests[${index}].valueAsWritten`),
    );
    if (!warnings.some((item) => /not guessed/i.test(item))) {
      warnings.push("This test detail was unreadable and was not guessed.");
    }
  }

  if (test.confidenceLevel === "low" || test.confidence < 0.5) {
    uncertain = true;
  }

  return {
    ...test,
    testNameAsExtracted: testName,
    valueAsWritten: value,
    unitAsWritten: unit,
    referenceRangeAsWritten: reference,
    flagAsWritten: flag,
    patientFriendlyExplanation: explanation.text,
    uncertain,
    uncertainReasons: [...reasons],
    warnings,
    confidenceLevel: classifyConfidence(test.confidence),
  };
}

function sanitizeInteractions(
  alerts: InteractionAlert[],
  ocrText: string | undefined,
  findings: SafetyFinding[],
): InteractionAlert[] {
  const kept: InteractionAlert[] = [];
  for (const alert of alerts) {
    const substancesOk =
      alert.substancesAsWritten.length === 0 ||
      alert.substancesAsWritten.every((name) => appearsInDocument(name, ocrText));
    if (alert.support !== "document_supported" || !substancesOk) {
      addFinding(
        findings,
        "unsupported_medical_request",
        "INSUFFICIENT_INFORMATION",
        "Possible interaction claims that are not supported by the document were removed.",
        "warning",
      );
      continue;
    }
    kept.push({
      ...alert,
      summary: INTERACTION_AWARENESS_TEXT,
      support: "document_supported",
      professionalReviewRequired: true,
    });
  }
  return kept;
}

function mergeTextFindings(text: string, findings: SafetyFinding[]): void {
  const decision = evaluateTextSafety(text);
  for (const item of decision.findings) {
    addFinding(findings, item.category, item.code, item.message, item.severity);
  }
}

function decisionFromFindings(findings: SafetyFinding[], analysisNotes: SafetyNote[]): SafetyDecision {
  const unique = uniqueFindings(findings);
  const categories = unique.map((item) => item.category);
  const hasEmergency = categories.includes("emergency_language");
  const hasRestricted =
    categories.includes("diagnosis_request") ||
    categories.includes("medication_start") ||
    categories.includes("medication_stop") ||
    categories.includes("dosage_modification");
  const notes = uniqueByCode([...analysisNotes]);
  const codes = new Set(notes.map((note) => note.code));
  if (hasEmergency && !codes.has("EMERGENCY_REDIRECT")) {
    notes.unshift(noteEmergencyRedirect());
  }
  if (!codes.has("NOT_A_DIAGNOSIS")) {
    notes.push(noteNotDiagnosis());
  }
  if (!codes.has("PROFESSIONAL_REVIEW")) {
    notes.push(noteProfessionalReview());
  }

  return {
    findings: unique,
    categories,
    safetyStatus: hasEmergency ? "emergency_redirect" : hasRestricted ? "restricted" : "ok",
    groundingStatus: hasEmergency || hasRestricted ? "SAFETY_RESTRICTED" : null,
    safetyNotes: notes,
  };
}

/**
 * Deterministic analysis sanitizer. Never diagnoses or decides treatment.
 */
export function applyAnalysisSafety(
  analysis: MedPilotAnalysis,
  context: AnalysisSafetyContext = {},
): AnalysisSafetyResult {
  const findings: SafetyFinding[] = [];
  const extraUncertainties: Uncertainty[] = [...analysis.uncertainties];
  const extraNotes: SafetyNote[] = [...analysis.safetyNotes];

  const medicines = analysis.medicines.map((item, index) =>
    sanitizeMedicine(item, index, context.ocrText, findings, extraUncertainties),
  );
  const tests = analysis.tests.map((item, index) =>
    sanitizeTest(item, index, context.ocrText, findings, extraUncertainties),
  );
  const interactionAlerts = sanitizeInteractions(analysis.interactionAlerts, context.ocrText, findings);

  for (const panicFinding of checkPanicLabValues(tests)) {
    addFinding(
      findings,
      panicFinding.category,
      panicFinding.code,
      panicFinding.message,
      panicFinding.severity,
    );
  }

  const summary = sanitizeNarrative(analysis.summary);
  const spoken = sanitizeNarrative(analysis.spokenText);
  mergeTextFindings(
    [
      analysis.summary,
      analysis.spokenText,
      ...analysis.medicines.map((item) => item.patientFriendlyExplanation),
      ...analysis.tests.map((item) => item.patientFriendlyExplanation),
    ].join("\n"),
    findings,
  );

  if (summary.rewritten || spoken.rewritten) {
    if (DIAGNOSIS_RE.test(analysis.summary) || DIAGNOSIS_RE.test(analysis.spokenText)) {
      addFinding(
        findings,
        "diagnosis_request",
        "NOT_A_DIAGNOSIS",
        "Diagnostic conclusions were removed. This is document understanding only.",
        "warning",
      );
    }
    if (MEDICATION_START_RE.test(`${analysis.summary} ${analysis.spokenText}`)) {
      addFinding(findings, "medication_start", "DOSAGE_BOUNDARY", SAFE_DOCUMENT_NARRATIVE, "warning");
    }
    if (MEDICATION_STOP_RE.test(`${analysis.summary} ${analysis.spokenText}`)) {
      addFinding(findings, "medication_stop", "DOSAGE_BOUNDARY", SAFE_DOCUMENT_NARRATIVE, "warning");
    }
    if (DOSAGE_MODIFICATION_RE.test(`${analysis.summary} ${analysis.spokenText}`)) {
      addFinding(findings, "dosage_modification", "DOSAGE_BOUNDARY", SAFE_DOCUMENT_NARRATIVE, "warning");
    }
  }

  const emergencyTriggers = findEmergencyTriggerPhrases(
    `${analysis.summary}\n${analysis.spokenText}\n${context.ocrText ?? ""}`,
  );
  if (emergencyTriggers.length > 0) {
    addFinding(
      findings,
      "emergency_language",
      "EMERGENCY_REDIRECT",
      `Emergency-related document language: ${emergencyTriggers.join(", ")}.`,
      "warning",
    );
  }

  const ocrConfidenceLevel = classifyConfidence(analysis.ocr.confidence);
  const anyUncertain = medicines.some((item) => item.uncertain) || tests.some((item) => item.uncertain);
  const ocrReview = ocrNeedsReview(ocrConfidenceLevel, anyUncertain);

  if (ocrConfidenceLevel === "low") {
    addFinding(findings, "low_ocr_confidence", "LOW_OCR", LOW_OCR_MESSAGE, "warning");
    extraUncertainties.push(uncertainty("LOW_OCR", LOW_OCR_MESSAGE, "ocr.confidence"));
  }

  const warnings = [...analysis.warnings];
  if (anyUncertain && !warnings.some((item) => /could not be read|not guessed|unclear/i.test(item))) {
    warnings.push("Some information could not be read clearly and was not guessed.");
  }

  const decision = decisionFromFindings(findings, extraNotes);
  const emergencyFindings = decision.findings.filter((item) => item.category === "emergency_language");
  const emergencyTriggerPhrases = [
    ...emergencyTriggers.map((phrase) => `Emergency-related document language: ${phrase}.`),
    ...emergencyFindings
      .filter((item) => item.code === "PANIC_LAB_VALUE")
      .map((item) => item.message),
  ];
  const sanitized = medPilotAnalysisSchema.parse({
    ...analysis,
    summary: summary.text,
    spokenText: spoken.text,
    medicines,
    tests,
    interactionAlerts,
    uncertainties: uniqueUncertainties(extraUncertainties),
    safetyNotes: decision.safetyNotes,
    emergencyFlags: {
      flagged: decision.safetyStatus === "emergency_redirect",
      triggerPhrases: [...new Set(emergencyTriggerPhrases)],
      note: EMERGENCY_REDIRECT_MESSAGE,
    },
    warnings,
    disclaimer: { text: CANONICAL_DISCLAIMER_TEXT },
    ocr: {
      confidence: analysis.ocr.confidence,
      confidenceLevel: ocrConfidenceLevel,
      needsReview: ocrReview,
    },
    needsReview: ocrReview || anyUncertain,
  });

  return { analysis: sanitized, decision };
}

/**
 * Application safety for a schema-validated MedPilotAnalysis.
 * Must run after Zod, before the client response. Independent of the Gemini prompt.
 */
export function enforceAnalysisSafety(
  validatedAnalysis: MedPilotAnalysis,
  context: AnalysisSafetyContext = {},
): MedPilotAnalysis {
  const validated = medPilotAnalysisSchema.parse(validatedAnalysis);
  return applyAnalysisSafety(validated, context).analysis;
}
