import type { ReactNode } from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SceneTransitionProps {
  children: ReactNode;
  durationFrames: number;
  fadeFrames?: number;
}

// Wraps children with fade-in for first fadeFrames and fade-out for last fadeFrames.
export function SceneTransition({ children, durationFrames, fadeFrames = 12 }: SceneTransitionProps) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, fadeFrames, durationFrames - fadeFrames, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {children}
    </div>
  );
}
