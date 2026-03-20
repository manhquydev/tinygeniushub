"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

interface InteractiveKeywordDisplayProps {
  keyword: string;
  subtext?: string;
  visible: boolean;
}

const VOWELS = new Set(["a", "e", "i", "o", "u", "A", "E", "I", "O", "U"]);

// Colors individual letters: vowels red, consonants blue
function ColoredKeyword({ keyword }: { keyword: string }) {
  return (
    <>
      {keyword.split("").map((char, index) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={`${char}-${index}`}
          style={{ color: VOWELS.has(char) ? "#FF6B6B" : "#4D96FF" }}
        >
          {char}
        </span>
      ))}
    </>
  );
}

export function InteractiveKeywordDisplay({
  keyword,
  subtext,
  visible,
}: InteractiveKeywordDisplayProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <AnimatePresence>
      {visible ? (
        <m.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 300, damping: 20 }
          }
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', system-ui, sans-serif",
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            <ColoredKeyword keyword={keyword} />
          </div>

          {subtext ? (
            <div
              style={{
                fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
                fontSize: 36,
                color: "#4b5563",
                marginTop: 8,
              }}
            >
              {subtext}
            </div>
          ) : null}
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
