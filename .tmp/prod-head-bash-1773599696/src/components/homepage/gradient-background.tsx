"use client";

/**
 * GradientBackground - Unified gradient for homepage journey
 * 
 * Original BeanstalkJourney gradient (yellow → purple → navy) extended
 * to full page height for unified scroll experience.
 * 
 * Phase 3: Added star field decoration for ambient atmosphere
 * 
 * Adaptive text colors:
 * - Yellow zones (0-15%, 75-100%): Dark text (#1E1B4B)
 * - Purple/Navy zones (15-75%): Light text (#F8FAFC)
 */

import { useMemo } from "react";
import "./gradient-background.css";
import "./ambient-animations.css";

interface GradientBackgroundProps {
  /** Total scene height in pixels (default: 5500px) */
  height?: number;
  /** Children to render on top of gradient */
  children?: React.ReactNode;
}

// Generate random star positions (memoized for consistency)
function generateStars(count: number, heightPx: number): Array<{ x: number; y: number }> {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100, // % from left
      y: Math.random() * (heightPx * 0.3), // Only in top 30% (sky zone)
    });
  }
  return stars;
}

export function GradientBackground({
  height = 5500,
  children,
}: GradientBackgroundProps) {
  // Generate star field once (60 stars in sky zone)
  const stars = useMemo(() => generateStars(60, height), [height]);

  return (
    <div 
      className="gradient-background" 
      style={{ 
        height: `${height}px`,
        minHeight: `${height}px` 
      }}
    >
      {/* Star field (z-2, behind tree z-5) */}
      <div className="usj-stars-layer" style={{ zIndex: 2, position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {stars.map((star, i) => (
          <div
            key={i}
            className="usj-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}px`,
            }}
          />
        ))}
      </div>

      {/* Content layers (children) */}
      {children}
    </div>
  );
}
