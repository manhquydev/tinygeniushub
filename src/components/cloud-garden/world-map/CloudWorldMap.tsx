"use client";

/**
 * CloudWorldMap — Scene root for the Garden World Map.
 *
 * Mounts and positions all world map elements:
 *  - SkyBackground (gradient + stars + shooting star)
 *  - GroundCloudLayer (3-layer SVG wave at bottom)
 *  - MagicTree (center SVG)
 *  - 5x CloudZone (positioned around the tree)
 *  - GardenMascotGuide (bottom-left)
 *  - CloudProgressBar (bottom-center)
 *  - Parent Zone button (bottom-right)
 *
 * PARALLAX: Mouse/pointer movement updates CSS variables --px --py.
 * Each layer translates by a different multiplier for depth effect.
 *
 * "use client" because of parallax pointer listeners.
 */

import { useCallback, useRef } from "react";
import { SkyBackground } from "./SkyBackground";
import { GroundCloudLayer } from "./GroundCloudLayer";
import { MagicTree } from "./MagicTree";
import { CloudZone, type GardenZone } from "./CloudZone";
import { CloudProgressBar } from "../shared/CloudProgressBar";
import "../cloud-garden.css";

interface ZonePosition {
  zone: GardenZone;
  top: string;
  left: string;
  size: number;
  progress?: number;
  isToday?: boolean;
  isLocked?: boolean;
}

// Positions are % of cg-scene, tuned for tablet landscape (768-1048px wide)
const ZONE_POSITIONS: ZonePosition[] = [
  { zone: "math",    top: "18%", left: "12%",  size: 88,  progress: 0.4 },
  { zone: "phonics", top: "18%", left: "68%",  size: 88,  progress: 0.2 },
  { zone: "art",     top: "50%", left: "6%",   size: 76,  progress: 0.6 },
  { zone: "music",   top: "50%", left: "76%",  size: 76,  isLocked: false },
  { zone: "today",   top: "5%",  left: "42%",  size: 96,  isToday: true  },
];

interface CloudWorldMapProps {
  /** Current locale time hour for sky mode calc (0-23) */
  hourOfDay?: number;
  /** Total + filled from lesson data */
  progressTotal?: number;
  progressFilled?: number;
  onZoneSelect?: (zone: GardenZone) => void;
  onParentZoneClick?: () => void;
}

export function CloudWorldMap({
  hourOfDay = new Date().getHours(),
  progressTotal = 5,
  progressFilled = 0,
  onZoneSelect,
  onParentZoneClick,
}: CloudWorldMapProps) {
  const sceneRef = useRef<HTMLDivElement>(null);

  // Lightweight parallax via CSS custom properties — no state updates
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = sceneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;  // -1 to +1
    const py = ((e.clientY - rect.top)  / rect.height - 0.5) * 2; // -1 to +1
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));
  }, []);

  const skyMode = hourOfDay >= 5 && hourOfDay < 18 ? "day" : "dusk";

  return (
    <div
      ref={sceneRef}
      className="cg-scene"
      onPointerMove={handlePointerMove}
      style={{ "--px": "0", "--py": "0" } as React.CSSProperties}
    >
      {/* Layer 0 — Sky */}
      <SkyBackground mode={skyMode} />

      {/* Layer 1 — Ground clouds (stays fixed, slowest parallax) */}
      <div
        className="cg-world-layer"
        style={{
          transform: "translate(calc(var(--px, 0) * -5px), calc(var(--py, 0) * -3px))",
          zIndex: 2,
        }}
      >
        <GroundCloudLayer />
      </div>

      {/* Layer 2 — Magic Tree (mid parallax speed) */}
      <div
        className="cg-world-layer"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: "14%",
          transform: "translate(calc(var(--px, 0) * -12px), calc(var(--py, 0) * -8px))",
          zIndex: 3,
        }}
      >
        <MagicTree width={300} height={360} />
      </div>

      {/* Layer 3 — Zones (fast parallax — closest to user) */}
      <div
        className="cg-world-layer"
        style={{
          transform: "translate(calc(var(--px, 0) * -20px), calc(var(--py, 0) * -14px))",
          zIndex: 4,
        }}
      >
        {ZONE_POSITIONS.map((pos) => (
          <CloudZone
            key={pos.zone}
            zone={pos.zone}
            size={pos.size}
            progress={pos.progress}
            isToday={pos.isToday}
            isLocked={pos.isLocked}
            onSelect={onZoneSelect}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
            }}
          />
        ))}
      </div>

      {/* Bottom HUD — z=10, no parallax */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 1rem 1.2rem",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Left spacer (mascot guide goes here via GardenMascotGuide absolute in its own layer) */}
        <div style={{ width: 120 }} />

        {/* Center — cloud puff progress */}
        <div style={{ pointerEvents: "auto" }}>
          <CloudProgressBar
            total={progressTotal}
            filled={progressFilled}
            ariaLabel={`${progressFilled} of ${progressTotal} lessons today`}
          />
        </div>

        {/* Right — Parent Zone button */}
        <button
          className="cg-parent-btn"
          style={{ pointerEvents: "auto", position: "static" }}
          onClick={onParentZoneClick}
          aria-label="Open parent area"
        >
          {/* Feather moon icon — inline SVG path, no import */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Parents</span>
        </button>
      </div>
    </div>
  );
}
