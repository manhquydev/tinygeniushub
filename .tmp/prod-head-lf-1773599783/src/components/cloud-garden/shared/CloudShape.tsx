/**
 * CloudShape — Reusable SVG cloud primitive
 *
 * Variants:
 *  - "puff"  : Full round puffy cloud (default)
 *  - "wide"  : Horizontally wide, shorter height
 *  - "flat"  : Low, flat cloud layer
 *  - "round" : Near-circle cloud bubble
 */

import type { CSSProperties, SVGProps } from "react";

export type CloudVariant = "puff" | "wide" | "flat" | "round";

interface CloudShapeProps extends Omit<SVGProps<SVGSVGElement>, "fill"> {
  variant?: CloudVariant;
  fill?: string;
  shadowFill?: string;
  glowFill?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
}

const PATHS: Record<CloudVariant, { vb: string; body: string; highlight: string; shadow: string }> = {
  puff: {
    vb: "0 0 200 120",
    body: "M 30,90 C 10,90 5,72 15,62 C 10,52 18,40 32,42 C 34,28 50,18 68,22 C 76,10 96,6 112,16 C 124,6 148,10 156,26 C 172,26 184,40 178,56 C 192,60 196,78 184,88 C 180,96 166,98 156,94 L 44,94 C 36,98 24,96 30,90 Z",
    highlight: "M 50,52 C 55,44 68,38 80,40 C 90,32 108,30 118,38",
    shadow: "M 30,90 C 24,94 28,98 36,96 L 160,96 C 170,98 178,94 178,90",
  },
  wide: {
    vb: "0 0 240 100",
    body: "M 20,76 C 4,76 2,60 14,52 C 10,40 22,30 38,34 C 42,22 58,14 76,20 C 86,10 108,8 122,18 C 138,8 162,12 168,26 C 184,24 198,38 192,52 C 208,56 212,72 200,80 C 196,86 182,88 172,84 L 48,84 C 38,88 24,86 20,78 Z",
    highlight: "M 48,46 C 54,36 72,28 88,32 C 100,24 124,22 136,32",
    shadow: "M 22,78 C 16,82 20,88 28,86 L 192,86 C 202,88 208,82 200,78",
  },
  flat: {
    vb: "0 0 280 70",
    body: "M 10,56 C 2,56 0,44 8,38 C 6,28 18,22 30,26 C 32,16 48,12 64,16 C 74,6 96,4 112,12 C 124,4 148,6 158,14 C 174,8 196,18 192,30 C 208,30 218,44 208,52 C 214,58 216,66 204,66 L 76,66 C 64,68 4,64 10,56 Z",
    highlight: "M 30,36 C 38,26 58,20 76,24 C 88,16 108,14 120,22",
    shadow: "M 10,56 C 4,60 8,66 16,64 L 204,64 C 214,66 218,60 208,56",
  },
  round: {
    vb: "0 0 160 160",
    body: "M 80,16 C 100,10 124,18 134,36 C 152,38 164,58 156,74 C 170,88 166,112 148,120 C 144,138 124,150 104,144 C 94,158 72,162 58,152 C 42,162 18,154 12,138 C -4,130 -6,108 10,96 C -2,82 2,58 20,50 C 22,30 44,16 64,22 C 68,16 76,14 80,16 Z",
    highlight: "M 52,52 C 62,38 82,32 98,40 C 110,30 130,36 138,50",
    shadow: "M 16,132 C 10,142 18,152 30,148 C 42,158 58,160 70,154",
  },
};

export function CloudShape({
  variant = "puff",
  fill = "var(--garden-cloud-white)",
  shadowFill = "rgba(196,213,235,0.55)",
  glowFill = "rgba(255,255,255,0.65)",
  width,
  height,
  className = "cg-cloud-shape",
  style,
  ...rest
}: CloudShapeProps) {
  const { vb, body, highlight, shadow } = PATHS[variant];
  const [vbW, , vbH] = vb.split(" ").slice(2).map(Number);

  return (
    <svg
      viewBox={vb}
      width={width ?? vbW}
      height={height ?? vbH}
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...rest}
    >
      {/* Drop shadow layer */}
      <path d={body} fill={shadowFill} transform="translate(0, 6)" />
      {/* Main body */}
      <path d={body} fill={fill} />
      {/* Inner shadow at bottom */}
      <path d={shadow} stroke="rgba(0,0,0,0.06)" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Highlight at top */}
      <path d={highlight} stroke={glowFill} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}
