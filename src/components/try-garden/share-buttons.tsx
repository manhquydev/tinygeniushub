"use client";

/**
 * ShareButtons - Social sharing buttons for /try-garden
 * 
 * Floating bottom-right buttons for:
 * - Facebook sharing
 * - Copy link to clipboard
 * 
 * Analytics: Tracks share clicks with event_category: "try_garden"
 */

import { useState } from "react";
import { Facebook, Share2, Check } from "lucide-react";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? window.location.href 
    : "https://tinygeniushubvn.tech/try-garden";

  const shareTitle = "Khu Vườn Trên Mây - Học Toán & Tiếng Anh cho bé";
  const shareDescription = "Khám phá Khu Vườn Trên Mây - Học qua trò chơi tương tác dành cho bé 2-6 tuổi!";

  const handleFacebookShare = () => {
    // Track event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "share", {
        event_category: "try_garden",
        event_label: "facebook",
        method: "facebook",
      });
    }

    // Open Facebook share dialog
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleCopyLink = () => {
    // Track event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "share", {
        event_category: "try_garden",
        event_label: "copy_link",
        method: "copy_link",
      });
    }

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        zIndex: 100,
      }}
      aria-label="Chia sẻ"
    >
      {/* Facebook Share */}
      <button
        onClick={handleFacebookShare}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#1877f2",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(24, 119, 242, 0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        aria-label="Chia sẻ lên Facebook"
        title="Chia sẻ lên Facebook"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(24, 119, 242, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(24, 119, 242, 0.4)";
        }}
      >
        <Facebook size={24} />
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: copied ? "#10b981" : "#6b7280",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: copied 
            ? "0 4px 12px rgba(16, 185, 129, 0.4)" 
            : "0 4px 12px rgba(107, 114, 128, 0.4)",
          transition: "all 0.2s",
        }}
        aria-label={copied ? "Đã sao chép" : "Sao chép liên kết"}
        title={copied ? "Đã sao chép!" : "Sao chép liên kết"}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(107, 114, 128, 0.6)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = copied
            ? "0 4px 12px rgba(16, 185, 129, 0.4)"
            : "0 4px 12px rgba(107, 114, 128, 0.4)";
        }}
      >
        {copied ? <Check size={24} /> : <Share2 size={24} />}
      </button>
    </div>
  );
}
