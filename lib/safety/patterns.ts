/** Deterministic keyword/phrase checks. Not a clinical model. */

const BOUNDARY =
  /\b(cannot|can't|does not|do not|don't|not a diagnosis|not a recommendation|not a treatment|not medical advice|not guessed)\b/i;

export function isBoundarySentence(text: string): boolean {
  return BOUNDARY.test(text);
}

export const DIAGNOSIS_RE =
  /\b(diagnos(?:e|is|ing|ed)|what do i have|what('s| is) wrong with me|is this (cancer|diabetes|infection|malignant)|you have (cancer|diabetes|an? infection)|this (confirms|means you have|is) (cancer|diabetes))\b/i;

export const MEDICATION_START_RE =
  /\b((you should |you need to |please )?start (taking|using)|begin taking|write me a prescription|prescrib(?:e|ing)|you should (begin|take this))\b/i;

export const MEDICATION_STOP_RE =
  /\b((you should |please )?(stop|quit|discontinue) (taking|using)|stop this (medicine|medication|drug)|you should stop)\b/i;

export const DOSAGE_MODIFICATION_RE =
  /\b((increase|decrease|change|adjust|raise|lower) (the |your |my )?(dose|dosage)|change (my|the) (dose|dosage)|take (a )?(higher|lower) dose|prescribe a new dose)\b/i;

export const EMERGENCY_RE =
  /\b(chest pain|can't breathe|cannot breathe|cannot catch my breath|suicid|anaphylaxis|severe bleeding|heart attack|stroke symptoms|choking)\b/i;

/** Returns the exact emergency wording found in document or model text. */
export function findEmergencyTriggerPhrases(text: string): string[] {
  return [...new Set(text.match(new RegExp(EMERGENCY_RE.source, "gi")) ?? [])];
}

export const PROMPT_INJECTION_RE =
  /\b(ignore (all |previous |the )?(instructions|rules|safety)|you are (now )?(a )?doctor|act as (a )?physician|override safety|reveal (the )?(system |hidden )?prompt)\b/i;

export const UNSUPPORTED_MEDICAL_RE =
  /\b(best (medicine|drug|antibiotic|treatment) for|recommend (a )?(medicine|drug|treatment|antibiotic)|treat my|cure (me|this|my)|which drug is better|general medical advice)\b/i;

export const PLACEHOLDER_NAME_RE =
  /^(unknown|unreadable|illegible|n\/a|n\.a\.|na|none|\?+|-+|redacted)$/i;
