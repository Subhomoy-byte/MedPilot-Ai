"use client";

type EmergencyBannerProps = {
  emergencyFlags: {
    flagged: boolean;
    triggerPhrases: string[];
    note: string;
  };
};

/** A persistent, non-dismissible emergency notice for validated analysis output. */
export function EmergencyBanner({ emergencyFlags }: EmergencyBannerProps) {
  if (!emergencyFlags.flagged) {
    return null;
  }

  return (
    <section
      aria-live="assertive"
      role="alert"
      style={{
        background: "#7f1d1d",
        border: "3px solid #fecaca",
        color: "#fff",
        marginBottom: "1.5rem",
        padding: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Emergency attention</h2>
      <p>{emergencyFlags.note}</p>
      {emergencyFlags.triggerPhrases.length > 0 ? (
        <details>
          <summary>View the document signals that triggered this alert</summary>
          <ul>
            {emergencyFlags.triggerPhrases.map((phrase) => (
              <li key={phrase}>{phrase}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
