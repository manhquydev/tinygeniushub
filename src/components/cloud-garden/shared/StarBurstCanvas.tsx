"use client";

/**
 * StarBurstCanvas — Canvas-based particle star explosion
 *
 * Fire-and-forget canvas particle animation played when a student
 * answers correctly. Renders ≤64 gold+rainbow particles over 1.2s
 * then self-removes from DOM.
 *
 * Usage:
 *   <StarBurstCanvas x={200} y={300} color="gold" />
 *
 * No external animation library — uses requestAnimationFrame directly.
 */

import { useEffect, useRef } from "react";

interface StarBurstCanvasProps {
  /** X origin of burst (screen coords) */
  x: number;
  /** Y origin of burst (screen coords) */
  y: number;
  /** Base hue for particles — defaults to gold theme */
  color?: "gold" | "rainbow" | "mint";
  /** Total particles to emit */
  particleCount?: number;
  /** Duration in ms */
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  hue: number;
  saturation: number;
  lightness: number;
  rotation: number;
  rotationSpeed: number;
}

const BASE_HUES: Record<NonNullable<StarBurstCanvasProps["color"]>, () => number> = {
  gold:    () => 40 + Math.random() * 20,
  rainbow: () => Math.random() * 360,
  mint:    () => 140 + Math.random() * 40,
};

export function StarBurstCanvas({
  x,
  y,
  color = "gold",
  particleCount = 48,
  duration = 1200,
  onComplete,
}: StarBurstCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to full viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const hueFactory = BASE_HUES[color];
    const startTime = performance.now();

    // Create particles
    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,           // slight upward bias
        radius: 2 + Math.random() * 5,
        opacity: 1,
        hue: hueFactory(),
        saturation: 80 + Math.random() * 20,
        lightness: 50 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      };
    });

    function draw(now: number) {
      if (!ctx || !canvas) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;                              // gravity
        p.vx *= 0.97;                              // air resistance
        p.opacity = Math.max(0, 1 - progress * 1.2);
        p.rotation += p.rotationSpeed;

        if (p.opacity <= 0) continue;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Draw a 4-pointed star shape
        ctx.fillStyle = `hsl(${p.hue}, ${p.saturation}%, ${p.lightness}%)`;
        ctx.beginPath();
        const r = p.radius;
        const ir = r * 0.4;
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const rad = i % 2 === 0 ? r : ir;
          i === 0
            ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
            : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        onComplete?.();
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [x, y, color, particleCount, duration, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
}
