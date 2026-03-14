"use client";

import { useEffect } from "react";

export type NavTone = "dark" | "mid" | "light";

export interface NavScrollToneOptions {
  enabled: boolean;
  darkThreshold?: number;
  lightThreshold?: number;
}

const DEFAULT_DARK_THRESHOLD = 0.38;
const DEFAULT_LIGHT_THRESHOLD = 0.72;

export function getNavToneByProgress(
  progress: number,
  darkThreshold = DEFAULT_DARK_THRESHOLD,
  lightThreshold = DEFAULT_LIGHT_THRESHOLD,
): NavTone {
  if (progress >= lightThreshold) {
    return "light";
  }

  if (progress >= darkThreshold) {
    return "mid";
  }

  return "dark";
}

function clearNavToneDataset() {
  delete document.documentElement.dataset.homeTheme;
  delete document.documentElement.dataset.homeNavTone;
}

function readScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  return Math.min(window.scrollY / maxScroll, 1);
}

export function useNavScrollTone({
  enabled,
  darkThreshold = DEFAULT_DARK_THRESHOLD,
  lightThreshold = DEFAULT_LIGHT_THRESHOLD,
}: NavScrollToneOptions) {
  useEffect(() => {
    if (!enabled) {
      clearNavToneDataset();
      return;
    }

    const root = document.documentElement;
    root.dataset.homeTheme = "1";

    const applyTone = () => {
      const progress = readScrollProgress();
      root.dataset.homeNavTone = getNavToneByProgress(progress, darkThreshold, lightThreshold);
    };

    let rafId = 0;
    const scheduleToneUpdate = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        applyTone();
      });
    };

    applyTone();
    window.addEventListener("scroll", scheduleToneUpdate, { passive: true });
    window.addEventListener("resize", scheduleToneUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleToneUpdate);
      window.removeEventListener("resize", scheduleToneUpdate);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      clearNavToneDataset();
    };
  }, [darkThreshold, enabled, lightThreshold]);
}
