"use client";

/**
 * ActivityHUD — Top status bar for the lesson activity screen.
 *
 * Displays:
 *  - Child's mascot avatar
 *  - Level badge
 *  - Star count
 *  - Cloud puff progress bar (steps in current lesson)
 *
 * Design: compact, readable, semi-transparent dark bar.
 */

import Image from "next/image";
import { CloudProgressBar } from "../shared/CloudProgressBar";
import "../cloud-garden.css";

interface ActivityHUDProps {
  childName?: string;
  level?: number;
  starsTotal?: number;
  stepCurrent: number;
  stepTotal: number;
}

/** Mini mascot avatar */
function MascotAvatar() {
  return (
    <Image
      src="/logos/tinygeniushub_app_icon.png"
      alt=""
      width={28}
      height={28}
      sizes="28px"
      className="h-7 w-7 object-contain"
      aria-hidden
    />
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
        <MascotAvatar />
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
