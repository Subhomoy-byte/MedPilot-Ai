import type { SafetyFinding } from "@/lib/safety/types";
import type { TestAnalysis } from "@/types";

type PanicRule = {
  aliases: string[];
  unit: string;
  minimum?: number;
  maximum?: number;
  label: string;
};

const PANIC_RULES: PanicRule[] = [
  {
    aliases: ["potassium", "serum potassium"],
    unit: "mmol/l",
    minimum: 2.5,
    maximum: 6.5,
    label: "potassium",
  },
  {
    aliases: ["glucose", "blood glucose", "serum glucose"],
    unit: "mg/dl",
    minimum: 40,
    maximum: 500,
    label: "glucose",
  },
  {
    aliases: ["sodium", "serum sodium"],
    unit: "mmol/l",
    minimum: 120,
    maximum: 160,
    label: "sodium",
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseUnambiguousNumber(value: string | null): number | null {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value.trim())) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Detect a small set of clearly written critical lab values. This intentionally
 * requires an exact recognized test name, a standalone numeric value, and an
 * unambiguous unit; it does not infer values, units, or clinical meaning.
 */
export function checkPanicLabValues(tests: TestAnalysis[]): SafetyFinding[] {
  const findings: SafetyFinding[] = [];

  for (const test of tests) {
    if (!test.testNameAsExtracted || !test.unitAsWritten) {
      continue;
    }

    const name = normalize(test.testNameAsExtracted);
    const unit = normalize(test.unitAsWritten);
    const value = parseUnambiguousNumber(test.valueAsWritten);
    if (value === null) {
      continue;
    }

    const rule = PANIC_RULES.find((candidate) =>
      candidate.aliases.includes(name) && candidate.unit === unit,
    );
    if (!rule) {
      continue;
    }

    const isCritical =
      (rule.minimum !== undefined && value < rule.minimum) ||
      (rule.maximum !== undefined && value > rule.maximum);
    if (!isCritical) {
      continue;
    }

    findings.push({
      category: "emergency_language",
      code: "PANIC_LAB_VALUE",
      message: `A critical ${rule.label} value is written in the document: ${test.valueAsWritten} ${test.unitAsWritten}.`,
      severity: "warning",
    });
  }

  return findings;
}
