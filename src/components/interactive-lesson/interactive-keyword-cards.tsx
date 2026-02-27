"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Volume2 } from "lucide-react";
import type { KeywordWithAudio } from "./interactive-lesson-types";

interface InteractiveKeywordCardsProps {
  keywords: string[];
  activeIndex: number;
  /** Per-keyword audio URLs for replay on tap. Falls back to browser SpeechSynthesis. */
  keywordsWithAudio?: KeywordWithAudio[];
  /** When true, card taps are disabled (e.g. during step narration) */
  disabled?: boolean;
}

const CARD_COLORS = ["#FFE8E8", "#E8F0FF", "#E8FFF0", "#FFF8E8", "#F0E8FF"];
const CARD_BORDER_COLORS = ["#FF6B6B", "#4D96FF", "#34D399", "#FBBF24", "#A78BFA"];

/** Simple heuristic: contains Vietnamese diacritics or CJK → vi-VN */
const VI_PATTERN = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ○□●]/i;

/** Speak a word using browser SpeechSynthesis as fallback when no MP3 available */
function speakWord(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = VI_PATTERN.test(word) ? "vi-VN" : "en-US";
  utterance.rate = 0.7; // Slow for children
  utterance.pitch = 1.1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function InteractiveKeywordCards({
  keywords,
  activeIndex,
  keywordsWithAudio,
  disabled = false,
}: InteractiveKeywordCardsProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup raw Audio element + pulse timer on unmount
  useEffect(() => {
    return () => {
      audioElRef.current?.pause();
      audioElRef.current = null;
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const handleCardTap = useCallback(
    (index: number, word: string) => {
      if (disabled) return;

      // Find audio URL for this keyword
      const audioUrl = keywordsWithAudio?.[index]?.audioUrl;

      setPlayingIndex(index);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setPlayingIndex(null), 800);

      if (audioUrl) {
        // Stop any previous card audio first
        if (audioElRef.current) {
          audioElRef.current.pause();
        }
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
    [keywordsWithAudio, disabled],
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
              cursor: disabled ? "default" : "pointer",
              outline: "2px solid transparent",
              padding: 0,
              opacity: disabled ? 0.5 : undefined,
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
