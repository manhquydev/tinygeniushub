"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type GroundGardenCanvasProps = {
  className?: string;
};

function isReducedMotionPreferred() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GroundGardenCanvas({ className }: GroundGardenCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 50);
    camera.position.set(0, 0, 4.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const particleCount = isReducedMotionPreferred() ? 46 : 110;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let index = 0; index < particleCount; index += 1) {
      const i3 = index * 3;
      positions[i3] = (Math.random() - 0.5) * 9;
      positions[i3 + 1] = (Math.random() - 0.5) * 6;
      positions[i3 + 2] = -Math.random() * 2.5;
      speeds[index] = 0.12 + Math.random() * 0.22;
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: new THREE.Color("#fff1a6"),
      size: 0.055,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const glowGeometry = new THREE.PlaneGeometry(8.8, 6.8, 1, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8dd7ff"),
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, -0.2, -1.6);
    scene.add(glow);

    const resize = () => {
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();

    let rafId = 0;
    const reducedMotion = isReducedMotionPreferred();
    const baseTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - baseTime) * 0.001;
      const positionAttr = starsGeometry.getAttribute("position") as THREE.BufferAttribute;

      for (let index = 0; index < particleCount; index += 1) {
        const i3 = index * 3;
        const driftY = speeds[index] ?? 0.1;
        let y = (positionAttr.array[i3 + 1] as number) + driftY * 0.01;

        if (y > 3.8) {
          y = -3.8;
        }

        positionAttr.array[i3 + 1] = y;

        if (!reducedMotion) {
          const xBase = positionAttr.array[i3] as number;
          positionAttr.array[i3] = xBase + Math.sin(elapsed * 0.3 + index) * 0.0009;
        }
      }

      positionAttr.needsUpdate = true;

      if (!reducedMotion) {
        stars.rotation.z = Math.sin(elapsed * 0.14) * 0.08;
        glow.material.opacity = 0.16 + Math.sin(elapsed * 0.45) * 0.05;
      }

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    window.addEventListener("resize", resize, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafId);
      starsGeometry.dispose();
      starsMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
