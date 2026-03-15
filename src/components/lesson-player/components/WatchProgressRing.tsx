"use client";

interface WatchProgressRingProps {
  percentage: number; // 0-100
  isReady?: boolean;
  size?: number;
  strokeWidth?: number;
}

export function WatchProgressRing({
  percentage,
  isReady = false,
  size = 64,
  strokeWidth = 6,
}: WatchProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <svg
      className="lp-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        className="lp-ring-track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        className={`lp-ring-fill${isReady ? " is-ready" : ""}`}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "center",
          transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease",
        }}
      />
      {/* Percentage text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        style={{
          fontSize: size < 60 ? "0.55rem" : "0.72rem",
          fontWeight: 800,
          fill: isReady ? "#4ade80" : "#e2e8f0",
          fontFamily: "inherit",
        }}
      >
        {percentage}%
      </text>
    </svg>
  );
}
