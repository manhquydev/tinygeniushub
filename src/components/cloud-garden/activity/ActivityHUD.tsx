"use client";

/**
 * ActivityHUD — Top status bar for the lesson activity screen.
 *
 * Displays:
 *  - Child's owl avatar (SVG illustration, no image asset)
 *  - Level badge
 *  - Star count
 *  - Cloud puff progress bar (steps in current lesson)
 *
 * Design: compact, readable, semi-transparent dark bar.
 */

import { CloudProgressBar } from "../shared/CloudProgressBar";
import "../cloud-garden.css";

interface ActivityHUDProps {
  childName?: string;
  level?: number;
  starsTotal?: number;
  stepCurrent: number;
  stepTotal: number;
}

/** Mini SVG owl head avatar — no image asset */
function OwlAvatarSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Body circle */}
      <circle cx="14" cy="15" r="11" fill="#fde68a" />
      {/* Face */}
      <circle cx="14" cy="14" r="8" fill="#fef3c7" />
      {/* Eyes */}
      <circle cx="10.5" cy="13" r="3.5" fill="#fff" />
      <circle cx="17.5" cy="13" r="3.5" fill="#fff" />
      <circle cx="11"   cy="13" r="2" fill="#1e1b4b" />
      <circle cx="18"   cy="13" r="2" fill="#1e1b4b" />
      {/* Eye shine */}
      <circle cx="11.6" cy="12.4" r="0.7" fill="#fff" />
      <circle cx="18.6" cy="12.4" r="0.7" fill="#fff" />
      {/* Beak */}
      <path d="M 12.5,17 L 14,19 L 15.5,17 Z" fill="#f59e0b" />
      {/* Ear tufts */}
      <path d="M 8,8 L 10,5 L 12,8" fill="#f59e0b" />
      <path d="M 16,8 L 18,5 L 20,8" fill="#f59e0b" />
    </svg>
  );
}

export function ActivityHUD({
  childName,
  level = 1,
  starsTotal = 0,
  stepCurrent,
  stepTotal,
}: ActivityHUDProps) {
  return (
    <header className="cg-hud" role="banner">
      {/* Avatar */}
      <div className="cg-hud__avatar" aria-hidden="true">
        <OwlAvatarSVG />
      </div>

      {/* Level badge */}
      <span className="cg-hud__level" aria-label={`C\u1ea5p \u0111\u1ed9 ${level}`}>
        {`Lv.${level}`}
      </span>

      {/* Stars */}
      <div className="cg-hud__stars" aria-label={`${starsTotal} sao`}>
        {/* Inline star SVG */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <polygon
            points="12,2 15.1,8.4 22,9.3 17,14.1 18.3,21 12,17.8 5.7,21 7,14.1 2,9.3 8.9,8.4"
            fill="#fde047"
            stroke="#f59e0b"
            strokeWidth="1.2"
          />
        </svg>
        <span>{starsTotal}</span>
      </div>

      <div className="cg-hud__spacer" />

      {/* Step progress (cloud puffs) */}
      <div className="cg-hud__progress">
        <CloudProgressBar
          total={stepTotal}
          filled={stepCurrent}
          ariaLabel={`B\u01b0\u1edbc ${stepCurrent} / ${stepTotal}`}
        />
      </div>

      {/* Child name (optional) */}
      {childName && (
        <span
          style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}
          aria-hidden="true"
        >
          {childName}
        </span>
      )}
    </header>
  );
}
