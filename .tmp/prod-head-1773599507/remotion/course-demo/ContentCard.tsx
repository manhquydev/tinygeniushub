import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import type { VideoSection } from "./lesson-video-data";
import { SECTION_COLORS } from "./TopBar";

interface ContentCardProps {
  section: VideoSection;
}

// Colorize vowels in red and consonants in blue for phonics content.
// Applies to the sublabel text of teach/activity sections.
function colorizePhonics(text: string): React.ReactNode {
  const vowels = /[aeiouAEIOU]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = vowels.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const consonantSlice = text.slice(lastIndex, match.index);
      parts.push(
        <span key={lastIndex} style={{ color: "#4D96FF" }}>
          {consonantSlice}
        </span>
      );
    }
    parts.push(
      <span key={match.index} style={{ color: "#FF6B6B", fontWeight: 800 }}>
        {match[0]}
      </span>
    );
    lastIndex = match.index + 1;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={lastIndex} style={{ color: "#4D96FF" }}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

// Child-friendly content card: large rounded white card with colored left border,
// spring entrance animation, and phonics color highlighting.
export function ContentCard({ section }: ContentCardProps) {
  const frame = useCurrentFrame();

  // Spring scale + opacity entrance over ~20 frames
  const scale = spring({
    frame,
    fps: 30,
    config: { damping: 10, stiffness: 120 },
    from: 0.8,
    to: 1,
  });

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const borderColor = SECTION_COLORS[section.type];
  const isPhonicsSection = section.type === "teach" || section.type === "activity";

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 32,
        padding: "48px 56px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        borderLeft: `8px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        gap: 28,
        maxWidth: 900,
        width: "100%",
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: "center center",
      }}
    >
      {/* Main label */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: "#1e3a8a",
          lineHeight: 1.2,
          letterSpacing: "0.02em",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        {section.label}
      </div>

      {/* Sublabel — optionally colorized for phonics content */}
      {section.sublabel && (
        <div
          style={{
            fontSize: 40,
            color: "#4b5563",
            lineHeight: 1.4,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          {isPhonicsSection
            ? colorizePhonics(section.sublabel)
            : section.sublabel}
        </div>
      )}
    </div>
  );
}
