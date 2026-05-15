"use client";

/**
 * CloudZone — Interactive zone bubble in the World Map.
 *
 * Each zone represents a subject area. Rendered as a cloud bubble
 * floating above the ground. On tap, calls `onSelect(zone)`.
 *
 * Subject visual glyphs are hand-crafted SVG — no icon packages.
 *
 * Props:
 *  - zone      : subject identifier
 *  - label     : English display name
 *  - isToday   : highlights with golden glow (today's recommended zone)
 *  - progress  : 0–1 for the SVG progress ring around the bubble
 *  - isLocked  : disables interaction
 *  - size      : bubble diameter in px
 *  - onSelect  : callback on tap/click
 */

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import "../cloud-garden.css";

export type GardenZone = "math" | "phonics" | "art" | "music" | "story" | "today";

const ZONE_META: Record<
  GardenZone,
  { accent: string; bg: string; bubbleFrom: string; bubbleTo: string; label: string; floatDur: string; floatDelay: string }
> = {
  math:    { accent: "#F59E0B", bg: "#FFFBEB", bubbleFrom: "#FEF9C3", bubbleTo: "#FDE68A",  label: "Maths",     floatDur: "4.2s", floatDelay: "0s" },
  phonics: { accent: "#0EA5E9", bg: "#EFF6FF", bubbleFrom: "#BAE6FD", bubbleTo: "#7DD3FC",  label: "English", floatDur: "4.8s", floatDelay: "-1.5s" },
  art:     { accent: "#F97316", bg: "#FFF7ED", bubbleFrom: "#FED7AA", bubbleTo: "#FDBA74",  label: "Skill",  floatDur: "5.1s", floatDelay: "-0.8s" },
  music:   { accent: "#EC4899", bg: "#FDF2F8", bubbleFrom: "#FBCFE8", bubbleTo: "#F9A8D4",  label: "Music",  floatDur: "4.6s", floatDelay: "-2.1s" },
  story:   { accent: "#10B981", bg: "#F0FDF4", bubbleFrom: "#A7F3D0", bubbleTo: "#6EE7B7",  label: "Tell stories",floatDur: "5.4s", floatDelay: "-3s" },
  today:   { accent: "#F59E0B", bg: "#fffbeb", bubbleFrom: "#FEF08A", bubbleTo: "#FDE047",  label: "Today!",  floatDur: "3.8s", floatDelay: "-0.4s" },
};

/** Custom SVG glyph per zone — hand-crafted, monochrome, on colored background */
function ZoneGlyph({ zone, size = 110 }: { zone: GardenZone; size?: number }) {
  const s = size;
  const half = s / 2;

  switch (zone) {
    case "math":
      // Stylized "1+2" number composition
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <text x="2" y="20" fontSize="11" fontWeight="900" fill="var(--garden-math-gold)" fontFamily="system-ui">1</text>
          <text x="9" y="20" fontSize="11" fontWeight="900" fill="#b45309" fontFamily="system-ui">+</text>
          <text x="16" y="20" fontSize="11" fontWeight="900" fill="var(--garden-math-gold)" fontFamily="system-ui">2</text>
          <path d="M 4,22 L 24,22" stroke="var(--garden-math-gold)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "phonics":
      // Big bold "Aa" — more readable than book icon
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <text x="1" y="23" fontSize="20" fontWeight="900"
            fill="#0369A1" fontFamily="Georgia, serif"
            style={{ fontStyle: "italic" }}>A</text>
          <text x="16" y="25" fontSize="16" fontWeight="900"
            fill="#0EA5E9" fontFamily="Georgia, serif">a</text>
        </svg>
      );

    case "art":
      // Paintbrush with stroke
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          {/* Brush handle */}
          <path d="M8,22 L18,10" stroke="var(--garden-art-coral)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Brush head */}
          <ellipse cx="20" cy="8" rx="4" ry="3" transform="rotate(-30 20 8)"
            fill="var(--garden-art-coral)" opacity="0.9" />
          {/* Paint blob */}
          <circle cx="8" cy="22" r="3.5" fill="var(--garden-art-coral)" opacity="0.5" />
          <circle cx="6" cy="24" r="2" fill="var(--garden-music-rose)" opacity="0.6" />
          <circle cx="11" cy="24" r="2" fill="var(--garden-math-gold)" opacity="0.6" />
        </svg>
      );

    case "music":
      // Musical note ♩ — clear and iconic
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          {/* Single note stem */}
          <line x1="18" y1="8" x2="18" y2="24" stroke="#BE185D" strokeWidth="2.5" strokeLinecap="round" />
          {/* Note head */}
          <ellipse cx="14.5" cy="24" rx="5.5" ry="4" fill="#EC4899" transform="rotate(-12 14.5 24)" />
          {/* Flag on stem */}
          <path d="M 18 8 C 24 10, 26 15, 22 18" stroke="#BE185D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Second note (beamed) */}
          <line x1="26" y1="5" x2="26" y2="21" stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="22.5" cy="21" rx="4.5" ry="3.5" fill="#F472B6" transform="rotate(-12 22.5 21)" />
          {/* Beam connecting stems */}
          <line x1="18" y1="8" x2="26" y2="5" stroke="#BE185D" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "story":
      // Star + sparkle (story / imagination)
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          {/* Main 5-point star */}
          <polygon
            points="14,4 16.2,10.8 23.4,10.8 17.6,15.2 19.8,22 14,17.6 8.2,22 10.4,15.2 4.6,10.8 11.8,10.8"
            fill="var(--garden-story-green)"
            stroke="var(--garden-story-green)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Small sparkle dots */}
          <circle cx="24" cy="6"  r="2" fill="var(--garden-story-green)" opacity="0.6" />
          <circle cx="5"  cy="7"  r="1.5" fill="var(--garden-story-green)" opacity="0.5" />
          <circle cx="22" cy="22" r="1.5" fill="var(--garden-story-green)" opacity="0.5" />
        </svg>
      );

    case "today":
    default:
      // Radiant sun / star burst (today's highlight)
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          {/* Rays */}
          {[0,45,90,135,180,225,270,315].map((deg, i) => {
            const r = Math.PI * deg / 180;
            const x1 = half + Math.cos(r) * 7;
            const y1 = half + Math.sin(r) * 7;
            const x2 = half + Math.cos(r) * 12;
            const y2 = half + Math.sin(r) * 12;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            );
          })}
          {/* Center circle */}
          <circle cx={half} cy={half} r="5.5" fill="#fde047" />
          <circle cx={half} cy={half} r="3.5" fill="#f59e0b" />
        </svg>
      );
  }
}

interface CloudZoneProps {
  zone: GardenZone;
  /** Label override (defaults from ZONE_META) */
  label?: string;
  /** 0–1 ring completion progress */
  progress?: number;
  isToday?: boolean;
  isLocked?: boolean;
  /** Bubble diameter in px */
  size?: number;
  /** Absolute positioning style from parent */
  style?: CSSProperties;
  onSelect?: (zone: GardenZone) => void;
}

export function CloudZone({
  zone,
  label,
  progress = 0,
  isToday = false,
  isLocked = false,
  size = 110,
  style,
  onSelect,
}: CloudZoneProps) {
  const meta = ZONE_META[zone];
  const prefersReducedMotion = useReducedMotion();
  const displayLabel = label ?? meta.label;
  const isHighlighted = isToday || zone === "today";

  // Progress ring: circumference of circle r=40% of size
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const ringOffset = circ * (1 - Math.min(progress, 1));

  function handleClick() {
    if (isLocked) return;
    onSelect?.(zone);
  }

  return (
    <m.div
      className="cg-zone-wrap"
      style={
        {
          ...style,
          "--zone-float-dur": meta.floatDur,
          "--zone-float-delay": meta.floatDelay,
          "--zone-accent": meta.accent,
        } as CSSProperties
      }
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-label={`${displayLabel}${isLocked ? " (locked)" : ""}${isHighlighted ? " - Today!" : ""}`}
      aria-disabled={isLocked}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" || e.key === " " ? handleClick() : undefined}
      whileTap={prefersReducedMotion || isLocked ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
    >
      {/* Progress ring (SVG circle arc around bubble) */}
      {progress > 0 && (
        <svg
          style={{
            position: "absolute",
            top: -4, left: -4,
            width: size + 8, height: size + 8,
            pointerEvents: "none",
          }}
          viewBox={`0 0 ${size + 8} ${size + 8}`}
          overflow="visible"
          aria-hidden="true"
        >
          <circle
            cx={(size + 8) / 2} cy={(size + 8) / 2}
            r={r}
            stroke={meta.accent}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={ringOffset}
            transform={`rotate(-90 ${(size + 8) / 2} ${(size + 8) / 2})`}
            opacity="0.85"
          />
        </svg>
      )}

      {/* Main bubble */}
      <div
        className={`cg-zone-bubble${isHighlighted ? " cg-zone-bubble--today" : ""}`}
        style={{
          width: size, height: size,
          background: isLocked
            ? "rgba(209,213,219,0.7)"
            : `radial-gradient(ellipse at 38% 30%, ${meta.bubbleFrom}, ${meta.bubbleTo})`,
          border: isLocked ? "3px solid rgba(156,163,175,0.5)" : `3px solid rgba(255,255,255,0.7)`,
          boxShadow: isLocked
            ? "0 4px 12px rgba(0,0,0,0.15)"
            : `inset 0 3px 0 rgba(255,255,255,0.8), 0 10px 30px ${meta.accent}55, 0 2px 8px rgba(0,0,0,0.15)`,
        }}
      >
        {isLocked ? (
          // Feather lock icon — SVG path inline, no import
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#9ca3af" strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="#9ca3af" />
          </svg>
        ) : (
          <ZoneGlyph zone={zone} size={Math.round(size * 0.4)} />
        )}
      </div>

      {/* Zone label */}
      <span className="cg-zone-label">{displayLabel}</span>
    </m.div>
  );
}
