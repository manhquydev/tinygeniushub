"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type UploadResult = {
  succeeded: number;
  failed: number;
  errors: string[];
};

export default function TeacherBulkEnrollPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select CSV file.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const res = await fetch("/api/teacher/bulk-enroll", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { ok: boolean; data?: { result: UploadResult }; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Upload failed");
      setResult(json.data!.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Upload student list</h1>
            <p className="muted-text" style={{ marginTop: "0.4rem" }}>
              Upload a CSV file to create parent accounts and child profiles in bulk (up to 500 rows).
            </p>
          </div>
          <Link href="/teacher/dashboard" className="ghost-button">
            ← Back to class
          </Link>
        </div>
      </section>

      {/* CSV format guide */}
      <section className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>CSV file format</h2>
        <div
          style={{
            background: "rgba(15,23,42,0.04)",
            borderRadius: 10,
            padding: "0.75rem 1rem",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            lineHeight: 1.7,
          }}
        >
          parent_name,parent_email,child_name,child_age
          <br />
          Nguyen Thi Mai,mai@example.com,An,4
          <br />
          Tran Van Hung,hung@example.com,Binh,3
        </div>
        <p className="muted-text" style={{ marginTop: "0.6rem", fontSize: "0.85rem" }}>
          The new parent account will receive an invitation email. Accounts that already exist will be added to the organization.
        </p>
      </section>

      {/* Upload form */}
      <section className="card">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 600 }}>
            Select CSV file
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              style={{
                border: "1px solid rgba(15,23,42,0.2)",
                borderRadius: 10,
                padding: "0.5rem 0.75rem",
                fontSize: "0.9rem",
              }}
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="solid-button" disabled={uploading} style={{ width: "fit-content" }}>
            {uploading ? "Processing..." : "Upload & Create Account"}
          </button>
        </form>
      </section>

      {/* Result */}
      {result && (
        <section className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Result</h2>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Success: {result.succeeded}</span>
            {result.failed > 0 && (
              <span style={{ color: "#ef4444", fontWeight: 700 }}>✗ Failed: {result.failed}</span>
            )}
          </div>
          {result.errors.length > 0 && (
            <ul style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#ef4444", lineHeight: 1.8 }}>
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
