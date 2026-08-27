"use client";

import { useState } from "react";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import type { LanguageCode, MedPilotAnalysis } from "@/types";

type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { message: string } };

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "The request could not be completed." : payload.error.message);
  }
  return payload.data;
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [analysis, setAnalysis] = useState<MedPilotAnalysis | null>(null);
  const [status, setStatus] = useState("Choose a document to begin.");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function analyzeDocument() {
    if (!file) {
      setError("Choose a JPG, PNG, or PDF document first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      setStatus("Uploading document…");
      const formData = new FormData();
      formData.append("file", file);
      const upload = await readApi<{ documentId: string }>(
        await fetch("/api/upload", { method: "POST", body: formData }),
      );

      setStatus("Reading document text…");
      await readApi(
        await fetch("/api/ocr", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ documentId: upload.documentId }),
        }),
      );

      setStatus("Preparing document explanation…");
      const result = await readApi<MedPilotAnalysis>(
        await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ documentId: upload.documentId, language }),
        }),
      );
      setAnalysis(result);
      setStatus("Analysis complete.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be analyzed.");
      setStatus("Analysis did not complete.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: "Arial, sans-serif", margin: "0 auto", maxWidth: 800, padding: "2rem" }}>
      <h1>MedPilot AI</h1>
      <p>Upload a medical document to view a document-grounded explanation.</p>

      <label>
        Document (JPG, PNG, or PDF)
        <input
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          disabled={isLoading}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          style={{ display: "block", margin: "0.5rem 0 1rem" }}
          type="file"
        />
      </label>
      <label>
        Response language
        <select
          disabled={isLoading}
          onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          value={language}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="bn">Bengali</option>
        </select>
      </label>
      <button disabled={isLoading || !file} onClick={analyzeDocument} style={{ display: "block", margin: "1rem 0" }}>
        {isLoading ? "Analyzing…" : "Upload and analyze"}
      </button>
      <p aria-live="polite">{status}</p>
      {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}

      {analysis ? (
        <section aria-label="Document analysis">
          <EmergencyBanner emergencyFlags={analysis.emergencyFlags} />
          <h2>Document summary</h2>
          <p>{analysis.summary}</p>
          <p><strong>Reading confidence:</strong> {analysis.ocr.confidenceLevel}</p>
          {analysis.needsReview ? <p>Some document details need review against the original.</p> : null}

          <h2>Medicines as written</h2>
          {analysis.medicines.length === 0 ? <p>No medicine entries were extracted.</p> : (
            <ul>
              {analysis.medicines.map((medicine, index) => (
                <li key={`${medicine.medicineNameAsExtracted ?? "unreadable"}-${index}`}>
                  <strong>{medicine.medicineNameAsExtracted ?? "Unreadable medicine name"}</strong>
                  {medicine.strengthAsWritten ? ` — ${medicine.strengthAsWritten}` : ""}
                  <br />{medicine.patientFriendlyExplanation}
                </li>
              ))}
            </ul>
          )}

          <h2>Tests as written</h2>
          {analysis.tests.length === 0 ? <p>No test entries were extracted.</p> : (
            <ul>
              {analysis.tests.map((test, index) => (
                <li key={`${test.testNameAsExtracted ?? "unreadable"}-${index}`}>
                  <strong>{test.testNameAsExtracted ?? "Unreadable test name"}</strong>
                  {test.valueAsWritten ? ` — ${test.valueAsWritten}${test.unitAsWritten ? ` ${test.unitAsWritten}` : ""}` : ""}
                  <br />{test.patientFriendlyExplanation}
                </li>
              ))}
            </ul>
          )}
          <p><small>{analysis.disclaimer.text}</small></p>
        </section>
      ) : null}
    </main>
  );
}
