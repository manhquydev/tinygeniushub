"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

interface HybridTransitionOverlayProps {
  isActive: boolean;
  audioUrl?: string;
  onComplete: () => void;
}

/**
 * Crossfade overlay between video and interactive segments.
 * Shows "It's your turn!" text with bounce animation and optional audio cue.
 */
export function HybridTransitionOverlay({ isActive, audioUrl, onComplete }: HybridTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  // Auto-dismiss after 1200ms
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => onCompleteRef.current(), 1200);
    return () => clearTimeout(timer);
  }, [isActive]);

  // Play audio cue
  useEffect(() => {
    if (!isActive || !audioUrl) return;
    const audio = new Audio(audioUrl);
    void audio.play().catch(() => {/* silent */});
    return () => { audio.pause(); };
  }, [isActive, audioUrl]);

  return (
    <AnimatePresence>
      {isActive && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(ellipse at center, rgba(59,130,246,0.85) 0%, rgba(13,27,62,0.95) 100%)",
          }}
        >
          <m.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 30 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.2 }
                : { type: "spring", stiffness: 400, damping: 15, delay: 0.1 }
            }
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: "#fff",
              textAlign: "center",
              fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', system-ui, sans-serif",
              textShadow: "0 4px 16px rgba(0,0,0,0.4)",
              lineHeight: 1.2,
            }}
          >
            It's your turn! 🎯
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
