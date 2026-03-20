"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const ageEl = form.elements.namedItem("childAge") as HTMLSelectElement;
    const childAge = ageEl.value ? Number(ageEl.value) : undefined;

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, childAge }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p style={{ color: "var(--color-success, #16a34a)", fontWeight: 600 }}>
        ✅ Đăng ký thành công! Chúng tôi sẽ liên hệ sớm nhất.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label htmlFor="wl-email" style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
          Email của bạn
        </label>
        <input
          id="wl-email"
          type="email"
          name="email"
          required
          placeholder="example@gmail.com"
          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border, #ddd)", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label htmlFor="wl-age" style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
          Bé nhà bạn bao nhiêu tuổi?{" "}
          <span style={{ fontWeight: 400, color: "var(--color-muted, #888)" }}>(không bắt buộc)</span>
        </label>
        <select
          id="wl-age"
          name="childAge"
          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border, #ddd)", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
        >
          <option value="">Chọn độ tuổi</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((age) => (
            <option key={age} value={age}>{age} tuổi</option>
          ))}
        </select>
      </div>
      {status === "error" && (
        <p style={{ color: "var(--color-error, #dc2626)", fontSize: "0.875rem" }}>
          Có lỗi xảy ra. Vui lòng thử lại.
        </p>
      )}
      <button type="submit" className="solid-button" disabled={status === "loading"}>
        {status === "loading" ? "Đang gửi..." : "Đăng ký nhận thông báo"}
      </button>
      <p className="muted-text" style={{ fontSize: "0.875rem" }}>
        Không spam. Chỉ thông báo khi ra mắt và ưu đãi cho người đăng ký sớm.
      </p>
    </form>
  );
}
