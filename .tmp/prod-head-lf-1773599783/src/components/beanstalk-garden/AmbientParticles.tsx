"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// Generate static initial particles to avoid hydration mismatch
const PARTICLE_COUNT = 80;

type AmbientParticle = {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  isGold: boolean;
};

function pseudoRandom(seed: number) {
  const raw = Math.sin(seed * 9999.91) * 10000;
  return raw - Math.floor(raw);
}

function createParticles(sceneHeight: number): AmbientParticle[] {
  const particles: AmbientParticle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const leftSeed = pseudoRandom(i + 1);
    const topSeed = pseudoRandom(i + 21);
    const sizeSeed = pseudoRandom(i + 41);
    const durationSeed = pseudoRandom(i + 61);
    const delaySeed = pseudoRandom(i + 81);
    const opacitySeed = pseudoRandom(i + 101);
    const tintSeed = pseudoRandom(i + 121);

    particles.push({
      id: i,
      left: `${leftSeed * 100}%`,
      top: `${topSeed * sceneHeight}px`,
      size: sizeSeed * 9 + 3,
      duration: durationSeed * 20 + 10,
      delay: delaySeed * 5,
      opacity: opacitySeed * 0.5 + 0.1,
      isGold: tintSeed > 0.7,
    });
  }
  return particles;
}

interface AmbientParticlesProps {
  sceneHeight: number;
}

export function AmbientParticles({ sceneHeight }: AmbientParticlesProps) {
  const particles = useMemo(() => createParticles(sceneHeight), [sceneHeight]);

  return (
    <div className="absolute top-0 left-0 w-full z-[1] pointer-events-none overflow-hidden" style={{ height: `${sceneHeight}px` }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${
            p.isGold ? "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]" : "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          }`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -100, -200, -300], // Float up
            x: [0, 30, -20, 10, 0], // Sway sideways
            opacity: [p.opacity, p.opacity * 2, 0], // Fade out
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
