"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type SkyGardenFxCanvasProps = {
  className?: string;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SkyGardenFxCanvas({ className }: SkyGardenFxCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const starCount = prefersReducedMotion() ? 64 : 170;
    const positions = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount);

    for (let index = 0; index < starCount; index += 1) {
      const i3 = index * 3;
      positions[i3] = (Math.random() - 0.5) * 16;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = -Math.random() * 8;
      velocities[index] = 0.02 + Math.random() * 0.08;
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: new THREE.Color("#f8f4ff"),
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const cloudPlaneGeometry = new THREE.PlaneGeometry(14, 8.4);
    const cloudPlaneMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8e7bff"),
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const cloudPlane = new THREE.Mesh(cloudPlaneGeometry, cloudPlaneMaterial);
    cloudPlane.position.set(0, -0.2, -2.8);
    scene.add(cloudPlane);

    const resize = () => {
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const reducedMotion = prefersReducedMotion();
    const startAt = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      const elapsed = (now - startAt) * 0.001;
      const points = starsGeometry.getAttribute("position") as THREE.BufferAttribute;

      for (let index = 0; index < starCount; index += 1) {
        const i3 = index * 3;
        let y = (points.array[i3 + 1] as number) + (velocities[index] ?? 0.03) * 0.014;
        if (y > 5.4) {
          y = -5.4;
        }
        points.array[i3 + 1] = y;

        if (!reducedMotion) {
          points.array[i3] = (points.array[i3] as number) + Math.sin(elapsed + index * 0.3) * 0.0007;
        }
      }

      points.needsUpdate = true;

      if (!reducedMotion) {
        stars.rotation.z = Math.sin(elapsed * 0.1) * 0.12;
        cloudPlane.rotation.z = Math.sin(elapsed * 0.16) * 0.03;
        cloudPlaneMaterial.opacity = 0.12 + Math.sin(elapsed * 0.22) * 0.03;
      }

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafId);
      starsGeometry.dispose();
      starsMaterial.dispose();
      cloudPlaneGeometry.dispose();
      cloudPlaneMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
