"use client";

import * as m from "motion/react-m";
import { RotateCcw } from "lucide-react";

interface HybridReplayButtonProps {
  onClick: () => void;
}

/** "Xem lại" button — replays concept video from activity screen */
export function HybridReplayButton({ onClick }: HybridReplayButtonProps) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: "absolute",
        top: 64,
        right: 24,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
        borderRadius: 20,
        border: "none",
        background: "rgba(255,255,255,0.2)",
        color: "#fff",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        zIndex: 10,
      }}
      aria-label="Xem lại bài giảng"
    >
      <RotateCcw size={16} />
      Xem lại
    </m.button>
  );
}
