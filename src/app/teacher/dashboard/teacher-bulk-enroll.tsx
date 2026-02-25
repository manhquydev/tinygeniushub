"use client";

import { useRef, useState } from "react";

type ParsedRow = { email: string; name: string; childNickname: string };

function parseCsv(raw: string): ParsedRow[] {
  const lines = raw.trim().split("\n").filter(Boolean);
  const result: ParsedRow[] = [];
  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    const [email = "", name = "", childNickname = ""] = parts;
    if (email && email.includes("@")) {
      result.push({ email, name, childNickname });
    }
  }
  return result;
}

interface Props {
  orgId: string;
}

type EnrollStatus = "idle" | "loading" | "success" | "error";

export function TeacherBulkEnroll({ orgId }: Props) {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [status, setStatus] = useState<EnrollStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (value: string) => {
    setCsvText(value);
    setPreview(parseCsv(value));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setPreview(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (preview.length === 0) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/bulk-enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview }),
      });
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      const json = (await res.json()) as { ok: boolean; data: { jobId: string } };
      setJobId(json.data.jobId);
      setStatus("success");
      setCsvText("");
      setPreview([]);
    } catch {
      setStatus("error");
      setErrorMsg("Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="page-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Đăng ký hàng loạt
        </h2>
        <p style={{ color: "var(--ink-700)", fontSize: "0.88rem" }}>
          Định dạng CSV: <code>email, họ tên phụ huynh, tên bé</code> — mỗi dòng một học sinh.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <textarea
          className="teacher-csv-textarea"
          value={csvText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={"phuonglan@gmail.com, Nguyễn Phương Lan, Bún\nhoangnam@gmail.com, Trần Hoàng Nam, Phở"}
          rows={6}
          aria-label="Nhập CSV danh sách học sinh"
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--ink-700)" }}>hoặc</span>
          <button
            type="button"
            className="ghost-button"
            style={{ fontSize: "0.85rem" }}
            onClick={() => fileRef.current?.click()}
          >
            Tải lên file CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {preview.length > 0 && (
        <div>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Xem trước: {preview.length} học sinh
          </p>
          <div className="teacher-table-wrap">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>Email phụ huynh</th>
                  <th>Tên phụ huynh</th>
                  <th>Tên bé</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td>{row.email}</td>
                    <td>{row.name}</td>
                    <td>{row.childNickname}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p style={{ textAlign: "center", padding: "0.75rem", fontSize: "0.82rem", color: "var(--ink-700)" }}>
                ...và {preview.length - 10} học sinh nữa
              </p>
            )}
          </div>
        </div>
      )}

      {status === "success" && jobId && (
        <div className="teacher-feedback-success">
          Đăng ký thành công! Mã công việc: <code>{jobId}</code>
        </div>
      )}
      {status === "error" && errorMsg && (
        <div className="teacher-feedback-error">{errorMsg}</div>
      )}

      <button
        type="button"
        className="solid-button"
        disabled={preview.length === 0 || status === "loading"}
        onClick={handleSubmit}
        style={{ alignSelf: "flex-start" }}
      >
        {status === "loading" ? "Đang xử lý..." : "Đăng ký hàng loạt"}
      </button>
    </div>
  );
}
