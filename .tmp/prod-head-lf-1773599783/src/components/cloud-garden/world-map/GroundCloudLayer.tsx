/**
 * GroundCloudLayer — Three-layer fluffy cloud SVG wave at the bottom of the world map.
 *
 * REDESIGNED: proper puff clouds using organic SVG paths instead of flat ovals.
 * Layers create parallax depth:  back (slow) → mid → front (fast, opaque)
 */

import "../cloud-garden.css";

/** 
 * Organic cloud path generator — creates a fluffy multi-puff cloud silhouette.
 * Returns an SVG path `d` string for the top edge of a cloud bank.
 */
function buildCloudBankPath(
  w: number,
  h: number,
  puffSeed: number,
): string {
  // Bottom-left → right along bottom → up the left side with curves
  const bottom = h;
  const segments: string[] = [];

  // Start at bottom-left
  segments.push(`M 0 ${bottom}`);
  segments.push(`L 0 ${h * 0.55}`);

  // Generate organic puff curves across the width
  const puffCount = 8 + (puffSeed % 4);
  const puffW = w / puffCount;

  for (let i = 0; i < puffCount; i++) {
    const x = puffW * i;
    const nextX = puffW * (i + 1);
    const midX = (x + nextX) / 2;

    // Vary puff height based on seed + position
    const variance = ((puffSeed * 13 + i * 7) % 100) / 100;
    const puffH = h * (0.35 + variance * 0.35);
    const topY = h - puffH;

    // Cubic bezier: rise from left, peak at middle, descend to right
    const cp1x = x + puffW * 0.2;
    const cp1y = h * 0.5;
    const cp2x = midX - puffW * 0.15;
    const cp2y = topY;
    const cp3x = midX + puffW * 0.15;
    const cp3y = topY;
    const cp4x = nextX - puffW * 0.2;
    const cp4y = h * 0.5;

    segments.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${midX} ${topY}`);
    segments.push(`C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${nextX} ${h * 0.55}`);
  }

  segments.push(`L ${w} ${bottom} Z`);
  return segments.join(" ");
}

interface GroundCloudLayerProps {
  /** Width of the SVG viewport (defaults to 1600) */
  width?: number;
  /** Height of the SVG viewport (defaults to 200) */
  height?: number;
}

export function GroundCloudLayer({ width = 1600, height = 320 }: GroundCloudLayerProps) {
  const backPath  = buildCloudBankPath(width, height, 31);
  const midPath   = buildCloudBankPath(width, height - 20, 47);
  const frontPath = buildCloudBankPath(width, height - 10, 19);

  return (
    <div className="cg-ground-clouds" aria-hidden="true">
      {/* Back layer — slow drift, translucent */}
      <svg
        className="cg-ground-cloud-back"
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: "block", position: "absolute", bottom: 0 }}
      >
        <defs>
          <linearGradient id="cgCloudGradBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8E4FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F5F0FF" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {/* Solid fill rect in lower 55% to block any sky showing through gaps */}
        <rect x="0" y={height * 0.45} width={width} height={height * 0.55}
          fill="#EDE9FE" opacity="0.85" />
        <path d={backPath} fill="url(#cgCloudGradBack)" />
      </svg>

      {/* Mid layer */}
      <svg
        className="cg-ground-cloud-mid"
        width="100%"
        height={height - 20}
        viewBox={`0 0 ${width} ${height - 20}`}
        preserveAspectRatio="none"
        style={{ display: "block", position: "absolute", bottom: 0 }}
      >
        <defs>
          <linearGradient id="cgCloudGradMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <path d={midPath} fill="url(#cgCloudGradMid)" />
      </svg>

      {/* Front layer — fast, mostly opaque white */}
      <svg
        className="cg-ground-cloud-front"
        width="100%"
        height={height - 10}
        viewBox={`0 0 ${width} ${height - 10}`}
        preserveAspectRatio="none"
        style={{ display: "block", position: "absolute", bottom: 0 }}
      >
        <defs>
          <linearGradient id="cgCloudGradFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5F3FF" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#FAF9FF" stopOpacity="0.97" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>
          <filter id="cgCloudBlur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* Soft shadow behind front clouds */}
        <path d={frontPath} fill="rgba(139,92,246,0.15)" filter="url(#cgCloudBlur)"
          transform="translate(0, 8)" />
        <path d={frontPath} fill="url(#cgCloudGradFront)" />
      </svg>
    </div>
  );
}
