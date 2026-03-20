"use client";

/**
 * SignUpModal - Modal for locked zone clicks
 * 
 * Triggered when user clicks a locked zone in preview mode.
 * Shows value prop and sign-up CTA to convert visitors.
 * 
 * Conversion messaging:
 * - "Mở khóa tất cả khu vườn"
 * - Show which zone they tried to access
 * - Benefits of signing up
 * - Primary CTA: Sign up
 * - Secondary: Close and continue exploring
 */

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string | null;
}

const zoneDisplayNames: Record<string, string> = {
  math: "Toán học",
  phonics: "Tiếng Anh Phonics",
  art: "Nghệ thuật",
  music: "Âm nhạc",
  today: "Hôm nay",
};

export function SignUpModal({ isOpen, onClose, zoneName }: SignUpModalProps) {
  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayZone = zoneName ? zoneDisplayNames[zoneName] || zoneName : "khu vườn";

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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
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

        {/* Content */}
        <div style={{ textAlign: "center" }}>
          {/* Icon */}
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

          {/* Title */}
          <h2
            id="modal-title"
            style={{
              margin: "0 0 0.8rem 0",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--cgh-ink)",
            }}
          >
            Mở khóa tất cả khu vườn
          </h2>

          {/* Description */}
          <p
            style={{
              margin: "0 0 1.5rem 0",
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "var(--cgh-ink)",
              opacity: 0.8,
            }}
          >
            Bạn đang muốn khám phá <strong>{displayZone}</strong>. 
            Đăng ký ngay để mở khóa toàn bộ khu vườn và cho con bắt đầu học!
          </p>

          {/* Benefits list */}
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
            <li>✓ Truy cập tất cả 5 khu vườn học tập</li>
            <li>✓ Lộ trình cá nhân hóa cho từng bé</li>
            <li>✓ Báo cáo tiến độ hàng tuần</li>
            <li>✓ Dùng thử miễn phí 7 ngày</li>
          </ul>

          {/* CTAs */}
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
              Đăng ký miễn phí ngay
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
              Tiếp tục khám phá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
