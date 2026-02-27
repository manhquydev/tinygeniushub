"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Volume2 } from "lucide-react";
import type { KeywordWithAudio } from "./interactive-lesson-types";

interface InteractiveKeywordCardsProps {
  keywords: string[];
  activeIndex: number;
  /** Per-keyword audio URLs for replay on tap. Falls back to browser SpeechSynthesis. */
  keywordsWithAudio?: KeywordWithAudio[];
}

const CARD_COLORS = ["#FFE8E8", "#E8F0FF", "#E8FFF0", "#FFF8E8", "#F0E8FF"];
const CARD_BORDER_COLORS = ["#FF6B6B", "#4D96FF", "#34D399", "#FBBF24", "#A78BFA"];

/** Speak a word using browser SpeechSynthesis as fallback when no MP3 available */
function speakWord(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.7; // Slow for children
  utterance.pitch = 1.1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function InteractiveKeywordCards({
  keywords,
  activeIndex,
  keywordsWithAudio,
}: InteractiveKeywordCardsProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const handleCardTap = useCallback(
    (index: number, word: string) => {
      // Find audio URL for this keyword
      const audioUrl = keywordsWithAudio?.[index]?.audioUrl;

      setPlayingIndex(index);
      setTimeout(() => setPlayingIndex(null), 800);

      if (audioUrl) {
        // Play from MP3 file
        if (!audioElRef.current) {
          audioElRef.current = new Audio();
        }
        const audio = audioElRef.current;
        audio.src = audioUrl;
        audio.currentTime = 0;
        audio.play().catch(() => {
          // MP3 failed (404 etc.) — fallback to speech
          speakWord(word);
        });
      } else {
        // No MP3 — use browser SpeechSynthesis
        speakWord(word);
      }
    },
    [keywordsWithAudio],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {keywords.map((keyword, index) => {
        // Future cards are hidden
        if (index > activeIndex) return null;

        const isActive = index === activeIndex;
        const isTapping = playingIndex === index;
        const colorIndex = index % CARD_COLORS.length;
        const bgColor = CARD_COLORS[colorIndex] ?? "#E8F0FF";
        const borderColor = CARD_BORDER_COLORS[colorIndex] ?? "#4D96FF";

        return (
          <m.button
            key={keyword}
            type="button"
            onClick={() => handleCardTap(index, keyword)}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.6, y: 20 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: isActive ? 1 : 0.7 }
                : {
                    opacity: isActive ? 1 : 0.7,
                    scale: isTapping ? 1.08 : isActive ? 1 : 0.93,
                    y: 0,
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.15 }
                : isTapping
                  ? { duration: 0.15 }
                  : {
                      type: "spring",
                      stiffness: 380,
                      damping: 22,
                      delay: index * 0.08,
                    }
            }
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            style={{
              width: 200,
              height: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              borderRadius: 18,
              background: bgColor,
              border: `3px solid ${isActive || isTapping ? borderColor : "transparent"}`,
              boxShadow: isActive || isTapping
                ? `0 6px 24px ${borderColor}44`
                : "0 2px 8px rgba(0,0,0,0.08)",
              cursor: "pointer",
              outline: "none",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: isActive ? "#1e293b" : "#64748b",
              }}
            >
              {keyword}
            </span>
            {/* Small speaker icon hint */}
            <Volume2
              size={16}
              style={{
                color: isTapping ? borderColor : "#94a3b8",
                opacity: isTapping ? 1 : 0.6,
                transition: "color 0.2s, opacity 0.2s",
              }}
            />
          </m.button>
        );
      })}
    </div>
  );
}
