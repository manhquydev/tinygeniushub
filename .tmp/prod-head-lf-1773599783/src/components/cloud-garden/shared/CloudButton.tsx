"use client";

/**
 * CloudButton — Reusable cloud-shaped interactive button
 *
 * This is the base atom for all interactive answer choices in the activity screen.
 * Visual state is driven by the `state` prop + data-state attribute (CSS handles styling).
 *
 * ICON POLICY: No external icon packages. Inline SVG paths only.
 */

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { CSSProperties, ReactNode } from "react";
import "../cloud-garden.css";

export type CloudButtonState = "idle" | "hovered" | "selected" | "correct" | "incorrect" | "disabled";
export type CloudButtonSize = "sm" | "md" | "lg";
export type CloudButtonSubject = "math" | "phonics" | "art" | "music" | "story" | "neutral";

interface CloudButtonProps {
  label?: ReactNode;
  state?: CloudButtonState;
  size?: CloudButtonSize;
  subject?: CloudButtonSubject;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** aria-label for screen readers */
  ariaLabel?: string;
}

export function CloudButton({
  label,
  state = "idle",
  size = "md",
  subject = "neutral",
  onClick,
  disabled,
  className,
  style,
  ariaLabel,
}: CloudButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  const isDisabled = disabled || state === "disabled";
  const effectiveState = isDisabled ? "disabled" : state;

  // Correct/Incorrect icon rendered as inline SVG (no icon package)
  const feedbackIcon =
    effectiveState === "correct" ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 13l4 4L19 7"
          stroke="var(--garden-story-green)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : effectiveState === "incorrect" ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="var(--garden-wrong-red)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ) : null;

  return (
    <m.button
      className={[
        "cg-btn",
        `cg-btn--${size}`,
        subject !== "neutral" ? `cg-btn--${subject}` : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      data-state={effectiveState}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      whileTap={prefersReducedMotion || isDisabled ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {feedbackIcon}
      {label}
    </m.button>
  );
}
