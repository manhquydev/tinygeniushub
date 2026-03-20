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
      setError("Vui lòng chọn file CSV.");
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
      if (!json.ok) throw new Error(json.error ?? "Upload thất bại");
      setResult(json.data!.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Tải lên danh sách học sinh</h1>
            <p className="muted-text" style={{ marginTop: "0.4rem" }}>
              Tải lên file CSV để tạo tài khoản phụ huynh và hồ sơ bé hàng loạt (tối đa 500 dòng).
            </p>
          </div>
          <Link href="/teacher/dashboard" className="ghost-button">
            ← Quay lại lớp học
          </Link>
        </div>
      </section>

      {/* CSV format guide */}
      <section className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Định dạng file CSV</h2>
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
          Nguyễn Thị Mai,mai@example.com,An,4
          <br />
          Trần Văn Hùng,hung@example.com,Bình,3
        </div>
        <p className="muted-text" style={{ marginTop: "0.6rem", fontSize: "0.85rem" }}>
          Tài khoản phụ huynh mới sẽ nhận email mời. Tài khoản đã tồn tại sẽ được thêm vào tổ chức.
        </p>
      </section>

      {/* Upload form */}
      <section className="card">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 600 }}>
            Chọn file CSV
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
            {uploading ? "Đang xử lý..." : "Tải lên & Tạo tài khoản"}
          </button>
        </form>
      </section>

      {/* Result */}
      {result && (
        <section className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Kết quả</h2>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Thành công: {result.succeeded}</span>
            {result.failed > 0 && (
              <span style={{ color: "#ef4444", fontWeight: 700 }}>✗ Thất bại: {result.failed}</span>
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
