"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { synth } from "@/lib/audio-utils";

interface UseLessonLaunchTransitionOptions {
  lessonId: string;
  onSelect?: (lessonId: string) => void;
  prefersReducedMotion: boolean;
  openDelayMs?: number;
}

interface UseLessonLaunchTransitionResult {
  isOpen: boolean;
  isLaunching: boolean;
  handleStartLesson: () => void;
  handleCloseLesson: () => void;
}

export function useLessonLaunchTransition({
  lessonId,
  onSelect,
  prefersReducedMotion,
  openDelayMs = 380,
}: UseLessonLaunchTransitionOptions): UseLessonLaunchTransitionResult {
  const [isOpen, setIsOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const launchTimerRef = useRef<number | null>(null);

  const clearLaunchTimer = useCallback(() => {
    if (launchTimerRef.current !== null) {
      window.clearTimeout(launchTimerRef.current);
      launchTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearLaunchTimer();
  }, [clearLaunchTimer]);

  const handleStartLesson = useCallback(() => {
    if (isLaunching) {
      return;
    }

    onSelect?.(lessonId);
    synth.playPop();

    if (prefersReducedMotion || openDelayMs <= 0) {
      setIsOpen(true);
      return;
    }

    setIsLaunching(true);
    clearLaunchTimer();
    launchTimerRef.current = window.setTimeout(() => {
      setIsLaunching(false);
      setIsOpen(true);
      launchTimerRef.current = null;
    }, openDelayMs);
  }, [clearLaunchTimer, isLaunching, lessonId, onSelect, openDelayMs, prefersReducedMotion]);

  const handleCloseLesson = useCallback(() => {
    clearLaunchTimer();
    setIsLaunching(false);
    setIsOpen(false);
  }, [clearLaunchTimer]);

  return {
    isOpen,
    isLaunching,
    handleStartLesson,
    handleCloseLesson,
  };
}
