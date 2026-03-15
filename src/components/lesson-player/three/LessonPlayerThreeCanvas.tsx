"use client";

import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

type LessonStep = 0 | 1 | 2 | 3 | 4;
type BurstType = "correct" | "wrong" | null;

interface LessonPlayerThreeCanvasProps {
  step: LessonStep;
  burst?: BurstType;
  className?: string;
}

type ThemeConfig = {
  particleCount: number;
  colors: number[];
  size: number;
  speed: number;
  fogColor: number;
  fogDensity: number;
  hasGravity?: boolean;
};

const STEP_THEMES: Record<LessonStep, ThemeConfig> = {
  0: {
    particleCount: 85,
    colors: [0xfef9c3, 0xfcd34d, 0xa7f3d0, 0xbfdbfe, 0xfde68a],
    size: 0.07,
    speed: 0.009,
    fogColor: 0xbae6fd,
    fogDensity: 0.038,
  },
  1: {
    particleCount: 130,
    colors: [0x818cf8, 0x38bdf8, 0xa78bfa, 0x6ee7b7, 0x60a5fa],
    size: 0.04,
    speed: 0.005,
    fogColor: 0x050514,
    fogDensity: 0.055,
  },
  2: {
    particleCount: 65,
    colors: [0xfcd34d, 0xf97316, 0xfb923c, 0xfacc15, 0xfbbf24],
    size: 0.07,
    speed: 0.016,
    fogColor: 0x082f49,
    fogDensity: 0.06,
  },
  3: {
    particleCount: 70,
    colors: [0x4ade80, 0x22c55e, 0x86efac, 0xa7f3d0, 0x6ee7b7],
    size: 0.063,
    speed: 0.012,
    fogColor: 0xf0fdf4,
    fogDensity: 0.04,
  },
  4: {
    particleCount: 190,
    colors: [0xfacc15, 0xa78bfa, 0x34d399, 0xfb7185, 0x38bdf8, 0xfcd34d],
    size: 0.082,
    speed: 0.02,
    fogColor: 0x0f172a,
    fogDensity: 0.065,
    hasGravity: true,
  },
};

const BURST_COLORS: Record<NonNullable<BurstType>, number[]> = {
  correct: [0x22c55e, 0x4ade80, 0x86efac, 0xfacc15, 0xfde68a],
  wrong: [0xef4444, 0xfca5a5, 0xf97316, 0xfbbf24],
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LessonPlayerThreeCanvas({ step, burst, className }: LessonPlayerThreeCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const velRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number>(0);
  const stepRef = useRef<LessonStep>(step);
  const configRef = useRef(STEP_THEMES[step]);

  // Burst particles (separate Points object for FX)
  const burstRef = useRef<THREE.Points | null>(null);
  const burstVelRef = useRef<{ x: Float32Array; y: Float32Array; life: Float32Array } | null>(null);
  const burstActiveRef = useRef(false);

  // Sync step ref for live config updates
  useEffect(() => {
    stepRef.current = step;
    configRef.current = STEP_THEMES[step];

    // Update fog when step changes
    if (sceneRef.current) {
      const cfg = STEP_THEMES[step];
      (sceneRef.current.fog as THREE.FogExp2).color.setHex(cfg.fogColor);
      (sceneRef.current.fog as THREE.FogExp2).density = cfg.fogDensity;
    }
  }, [step]);

  // Spawn burst on correct/wrong answer
  const spawnBurst = useCallback((type: NonNullable<BurstType>) => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    if (!scene || !renderer || burstActiveRef.current) return;

    const count = 60;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const vx = new Float32Array(count);
    const vy = new Float32Array(count);
    const life = new Float32Array(count);
    const palette = BURST_COLORS[type];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 2] = -5 + Math.random() * 1.5;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.04 + Math.random() * 0.12;
      vx[i] = Math.cos(angle) * speed;
      vy[i] = Math.sin(angle) * speed + 0.03; // slight upward drift
      life[i] = 1.0;

      const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)] ?? 0xffffff);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    // Cleanup old burst
    if (burstRef.current) {
      scene.remove(burstRef.current);
      burstRef.current.geometry.dispose();
      (burstRef.current.material as THREE.PointsMaterial).dispose();
      burstRef.current = null;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    burstRef.current = pts;
    burstVelRef.current = { x: vx, y: vy, life };
    burstActiveRef.current = true;
  }, []);

  // Trigger burst when prop changes
  useEffect(() => {
    if (!burst) return;
    if (!prefersReducedMotion()) {
      spawnBurst(burst);
    }
  }, [burst, spawnBurst]);

  // Mount ThreeJS scene once
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (prefersReducedMotion()) return;

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
    camera.position.set(0, 0, 6);
    sceneRef.current = scene;
    cameraRef.current = camera;

    const cfg = configRef.current;
    scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient particles
    const starCount = cfg.particleCount;
    const positions = new Float32Array(starCount * 3);
    const colorsBuf = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 13;
      positions[i * 3 + 2] = -Math.random() * 10;
      velocities[i] = 0.012 + Math.random() * 0.065;

      const c = new THREE.Color(cfg.colors[Math.floor(Math.random() * cfg.colors.length)] ?? 0xffffff);
      colorsBuf[i * 3] = c.r;
      colorsBuf[i * 3 + 1] = c.g;
      colorsBuf[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colorsBuf, 3));

    const mat = new THREE.PointsMaterial({
      size: cfg.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
    pointsRef.current = points;
    velRef.current = velocities;

    // Resize
    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Animate
    const startAt = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startAt) * 0.001;
      const live = configRef.current;

      // Ambient particles tick
      const pos = points.geometry.getAttribute("position") as THREE.BufferAttribute;
      const vel = velRef.current;
      for (let i = 0; i < starCount; i++) {
        let y = pos.array[i * 3 + 1] as number;
        const x = pos.array[i * 3] as number;
        const v = vel?.[i] ?? 0.02;

        const direction = live.hasGravity ? -1 : 1;
        y += v * 0.012 * direction;
        if (y > 6.8) y = -6.8;
        if (y < -6.8) y = 6.8;

        (pos.array as Float32Array)[i * 3 + 1] = y;
        (pos.array as Float32Array)[i * 3] = x + Math.sin(elapsed * 0.28 + i * 0.35) * 0.0004;
      }
      pos.needsUpdate = true;

      // Slow sway
      points.rotation.y = Math.sin(elapsed * 0.055) * 0.1;
      points.rotation.z = Math.sin(elapsed * 0.032) * 0.04;

      // Burst particles tick
      const bPts = burstRef.current;
      const bVel = burstVelRef.current;
      if (bPts && bVel) {
        const bPos = bPts.geometry.getAttribute("position") as THREE.BufferAttribute;
        let anyAlive = false;
        for (let i = 0; i < bVel.life.length; i++) {
          bVel.life[i] = (bVel.life[i] ?? 1) - 0.025;
          if ((bVel.life[i] ?? 0) <= 0) continue;
          anyAlive = true;

          (bPos.array as Float32Array)[i * 3] += bVel.x[i] ?? 0;
          (bPos.array as Float32Array)[i * 3 + 1] += (bVel.y[i] ?? 0) - 0.003;
          bVel.y[i] = (bVel.y[i] ?? 0) * 0.97; // friction
          bVel.x[i] = (bVel.x[i] ?? 0) * 0.96;
        }
        bPos.needsUpdate = true;
        (bPts.material as THREE.PointsMaterial).opacity = Math.max(0, bVel.life[0] ?? 0);
        if (!anyAlive) {
          scene.remove(bPts);
          bPts.geometry.dispose();
          (bPts.material as THREE.PointsMaterial).dispose();
          burstRef.current = null;
          burstVelRef.current = null;
          burstActiveRef.current = false;
        }
      }

      renderer.render(scene, camera);
      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafRef.current);
      geo.dispose();
      mat.dispose();
      if (burstRef.current) {
        burstRef.current.geometry.dispose();
        (burstRef.current.material as THREE.PointsMaterial).dispose();
        burstRef.current = null;
      }
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
