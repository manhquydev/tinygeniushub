"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string | null;
}

const zoneDisplayNames: Record<string, string> = {
  math: "Toán",
  phonics: "Tiếng Anh Phonics",
  art: "Mỹ thuật",
  music: "Âm nhạc",
  today: "Hôm nay",
};

export function SignUpModal({ isOpen, onClose, zoneName }: SignUpModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayZone = zoneName ? zoneDisplayNames[zoneName] || zoneName : "một khu học tập";

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          maxWidth: "480px",
          width: "100%",
          padding: "2rem",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          aria-label="Đóng"
        >
          <X size={24} color="var(--cgh-ink)" />
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "var(--cgh-mint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2rem",
            }}
          >
            🔒
          </div>

          <h2
            id="modal-title"
            style={{
              margin: "0 0 0.8rem 0",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--cgh-ink)",
            }}
          >
            Mở khóa toàn bộ khu học tập
          </h2>

          <p
            style={{
              margin: "0 0 1.5rem 0",
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "var(--cgh-ink)",
              opacity: 0.8,
            }}
          >
            Bạn vừa chọn <strong>{displayZone}</strong>. Tạo tài khoản để mở toàn bộ khu học tập và chọn khóa phù hợp
            cho bé.
          </p>

          <ul
            style={{
              textAlign: "left",
              margin: "0 0 2rem 0",
              padding: "0 0 0 1.5rem",
              fontSize: "0.95rem",
              lineHeight: 1.8,
              color: "var(--cgh-ink)",
            }}
          >
            <li>Mở toàn bộ khu học tập</li>
            <li>Lộ trình học cá nhân hóa</li>
            <li>Báo cáo tiến độ hàng tuần cho phụ huynh</li>
            <li>Thanh toán nhanh bằng chuyển khoản hoặc QR</li>
          </ul>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <Link
              href="/auth/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.9rem 1.8rem",
                borderRadius: "999px",
                backgroundColor: "#0f9f86",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                minHeight: "44px",
                transition: "all 0.2s",
              }}
            >
              Tạo tài khoản
            </Link>

            <button
              onClick={onClose}
              style={{
                padding: "0.9rem 1.8rem",
                borderRadius: "999px",
                backgroundColor: "transparent",
                border: "1px solid rgba(15, 159, 134, 0.3)",
                color: "var(--cgh-ink)",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                minHeight: "44px",
                transition: "all 0.2s",
              }}
            >
              Tiếp tục xem thử
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
