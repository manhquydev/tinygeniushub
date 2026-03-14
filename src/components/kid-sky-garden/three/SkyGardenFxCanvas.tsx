"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type SkyGardenFxCanvasProps = {
  className?: string;
};

type MistSprite = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  baseX: number;
  baseY: number;
  driftX: number;
  driftY: number;
  speed: number;
  phase: number;
  spin: number;
  pulse: number;
  baseOpacity: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const starCount = prefersReducedMotion() ? 44 : 120;
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
      color: new THREE.Color("#f1f7ff"),
      size: 0.048,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const hazePlaneGeometry = new THREE.PlaneGeometry(15.2, 4.6);
    const hazePlaneMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#e5f4ff"),
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      depthTest: false,
    });
    const hazePlane = new THREE.Mesh(hazePlaneGeometry, hazePlaneMaterial);
    hazePlane.position.set(0, 2.82, -4.6);
    scene.add(hazePlane);

    const textureLoader = new THREE.TextureLoader();
    const cloudTextureA = textureLoader.load("/images/cloud-garden/vfx/platform_cloud_fluffy.png");
    const cloudTextureB = textureLoader.load("/cloud_platform.png");
    cloudTextureA.colorSpace = THREE.SRGBColorSpace;
    cloudTextureB.colorSpace = THREE.SRGBColorSpace;
    cloudTextureA.magFilter = THREE.LinearFilter;
    cloudTextureB.magFilter = THREE.LinearFilter;
    cloudTextureA.minFilter = THREE.LinearMipmapLinearFilter;
    cloudTextureB.minFilter = THREE.LinearMipmapLinearFilter;

    const mistGeometry = new THREE.PlaneGeometry(1, 1);
    const mistGroup = new THREE.Group();
    mistGroup.position.set(0, 0, 0);
    scene.add(mistGroup);

    const mistConfigs: Array<{
      x: number;
      y: number;
      z: number;
      width: number;
      height: number;
      opacity: number;
      speed: number;
      driftX: number;
      driftY: number;
      spin: number;
      pulse: number;
      color: string;
      texture: THREE.Texture;
    }> = [
      {
        x: -3.5,
        y: 2.75,
        z: -1.9,
        width: 4.3,
        height: 2.1,
        opacity: 0.12,
        speed: 0.24,
        driftX: 0.24,
        driftY: 0.05,
        spin: 0.018,
        pulse: 0.022,
        color: "#f2fbff",
        texture: cloudTextureA,
      },
      {
        x: 3.35,
        y: 2.92,
        z: -2.1,
        width: 4.8,
        height: 2.2,
        opacity: 0.13,
        speed: 0.2,
        driftX: 0.28,
        driftY: 0.04,
        spin: 0.014,
        pulse: 0.02,
        color: "#f8fdff",
        texture: cloudTextureA,
      },
      {
        x: 0.2,
        y: 3.16,
        z: -2.35,
        width: 5.4,
        height: 2.5,
        opacity: 0.11,
        speed: 0.16,
        driftX: 0.18,
        driftY: 0.036,
        spin: 0.01,
        pulse: 0.016,
        color: "#f8f4ff",
        texture: cloudTextureB,
      },
      {
        x: -1.2,
        y: 3.28,
        z: -2.85,
        width: 5.8,
        height: 2.7,
        opacity: 0.1,
        speed: 0.14,
        driftX: 0.14,
        driftY: 0.03,
        spin: 0.008,
        pulse: 0.014,
        color: "#ffe9f4",
        texture: cloudTextureB,
      },
      {
        x: 1.5,
        y: 3.42,
        z: -3.2,
        width: 6.4,
        height: 2.9,
        opacity: 0.08,
        speed: 0.12,
        driftX: 0.12,
        driftY: 0.026,
        spin: 0.006,
        pulse: 0.01,
        color: "#e9f7ff",
        texture: cloudTextureA,
      },
    ];

    const mistSprites: MistSprite[] = [];
    const mistMaterials: THREE.MeshBasicMaterial[] = [];

    for (const config of mistConfigs) {
      const material = new THREE.MeshBasicMaterial({
        map: config.texture,
        transparent: true,
        opacity: config.opacity,
        color: new THREE.Color(config.color),
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
      });
      const mesh = new THREE.Mesh(mistGeometry, material);
      mesh.position.set(config.x, config.y, config.z);
      mesh.scale.set(config.width, config.height, 1);
      mesh.renderOrder = 3;

      mistGroup.add(mesh);
      mistMaterials.push(material);
      mistSprites.push({
        mesh,
        baseX: config.x,
        baseY: config.y,
        driftX: config.driftX,
        driftY: config.driftY,
        speed: config.speed,
        phase: Math.random() * Math.PI * 2,
        spin: config.spin,
        pulse: config.pulse,
        baseOpacity: config.opacity,
      });
    }

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
        stars.rotation.z = Math.sin(elapsed * 0.08) * 0.08;
        hazePlaneMaterial.opacity = 0.05 + Math.sin(elapsed * 0.18) * 0.012;
        hazePlane.position.y = 2.82 + Math.sin(elapsed * 0.12) * 0.04;

        for (const sprite of mistSprites) {
          const { mesh } = sprite;
          mesh.position.x = sprite.baseX + Math.sin(elapsed * sprite.speed + sprite.phase) * sprite.driftX;
          mesh.position.y = sprite.baseY + Math.cos(elapsed * sprite.speed * 0.85 + sprite.phase) * sprite.driftY;
          mesh.rotation.z = Math.sin(elapsed * sprite.speed * 0.62 + sprite.phase) * sprite.spin;
          mesh.material.opacity = clamp(
            sprite.baseOpacity +
              Math.sin(elapsed * sprite.speed * 1.35 + sprite.phase * 0.6) * sprite.pulse,
            0.045,
            0.2,
          );
        }
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
      hazePlaneGeometry.dispose();
      hazePlaneMaterial.dispose();
      mistGeometry.dispose();
      cloudTextureA.dispose();
      cloudTextureB.dispose();
      for (const material of mistMaterials) {
        material.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
