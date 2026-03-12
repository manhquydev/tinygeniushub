import type { CSSProperties } from "react";
import { StarField } from "./StarField";
import { ShootingStar } from "./ShootingStar";
import "../cloud-garden.css";

type SkyMode = "day" | "dusk";

interface SkyBackgroundProps {
  mode?: SkyMode;
  className?: string;
  style?: CSSProperties;
}

/**
 * SkyBackground — The layered gradient sky for the Cloud Garden.
 *
 * Replaces SpaceBackground for the /kid/garden route.
 * Composed of: gradient base + StarField + ShootingStar
 * Mode "dusk" shifts palette to warmer tones (evening).
 *
 * This is a SERVER component (no client state).
 */
export function SkyBackground({ mode = "day", className, style }: SkyBackgroundProps) {
  return (
    <div
      className={`cg-sky ${className ?? ""}`.trim()}
      style={{
        ...(mode === "dusk"
          ? {
              background:
                "linear-gradient(180deg, #0c0a1e 0%, #2d1b69 28%, #7c3aed 52%, #c084fc 72%, #f59e0b 88%, #fde68a 100%)",
            }
          : {}),
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Star field — deterministic placement, twinkling */}
      <StarField mode={mode} />
      {/* Shooting star — periodic animation */}
      <ShootingStar />
    </div>
  );
}
