/**
 * MagicTree — REDESIGNED central illustration for the Cloud Garden World Map.
 *
 * v2: Organic silhouette, wider canopy, layered leaf clusters using organic paths
 * instead of plain ellipses. Bark texture lines, magical sparkles, root curves.
 *
 * Pure SVG, no external assets or icon libraries.
 */

import type { ComponentPropsWithoutRef } from "react";
import "../cloud-garden.css";

interface MagicTreeProps extends ComponentPropsWithoutRef<"svg"> {
  width?: number | string;
  height?: number | string;
}

export function MagicTree({ width = 280, height = 360, style, ...svgProps }: MagicTreeProps) {
  return (
    <svg
      viewBox="0 0 320 420"
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible", ...style }}
      {...svgProps}
    >
      <defs>
        {/* Trunk gradient: rich bark brown */}
        <linearGradient id="mt-trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#6B3A1F" />
          <stop offset="35%"  stopColor="#92501E" />
          <stop offset="65%"  stopColor="#7A4220" />
          <stop offset="100%" stopColor="#5A2E10" />
        </linearGradient>

        {/* Root gradient */}
        <linearGradient id="mt-root" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7A4220" />
          <stop offset="100%" stopColor="#4A2010" />
        </linearGradient>

        {/* Canopy leaf gradients — multiple for layered look */}
        <radialGradient id="mt-leaf-top" cx="45%" cy="35%" r="58%">
          <stop offset="0%"   stopColor="#6EE7B7" />
          <stop offset="45%"  stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </radialGradient>

        <radialGradient id="mt-leaf-mid" cx="42%" cy="30%" r="55%">
          <stop offset="0%"   stopColor="#A7F3D0" />
          <stop offset="40%"  stopColor="#34D399" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>

        <radialGradient id="mt-leaf-low" cx="50%" cy="25%" r="60%">
          <stop offset="0%"   stopColor="#6EE7B7" />
          <stop offset="50%"  stopColor="#10B981" />
          <stop offset="100%" stopColor="#065F46" />
        </radialGradient>

        <radialGradient id="mt-leaf-dark" cx="40%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#34D399" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>

        {/* Highlight on top canopy */}
        <radialGradient id="mt-leaf-highlight" cx="38%" cy="22%" r="40%">
          <stop offset="0%"   stopColor="#ECFDF5" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ECFDF5" stopOpacity="0" />
        </radialGradient>

        {/* Glow filter for magic sparkle */}
        <filter id="mt-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Tree glow aura */}
        <radialGradient id="mt-aura" cx="50%" cy="60%" r="50%">
          <stop offset="0%"   stopColor="#34D399" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </radialGradient>

        {/* Shadow at base */}
        <radialGradient id="mt-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1E1B4B" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* === GROUND SHADOW === */}
      <ellipse cx="160" cy="400" rx="80" ry="16" fill="url(#mt-shadow)" />

      {/* === MAGIC AURA (atmospheric glow behind tree) === */}
      <ellipse cx="160" cy="200" rx="130" ry="150" fill="url(#mt-aura)" />

      {/* === ROOTS — organic ground-hugging buttress roots === */}
      {/* Wide base flare where trunk meets ground — like a real tree */}
      <path
        d="M 118 370 C 115 372, 105 374, 90 374 C 78 374, 66 376, 56 382 L 56 390 C 70 384, 84 380, 98 380 C 112 380, 124 376, 130 372 Z"
        fill="#5A2E10"
      />
      <path
        d="M 202 370 C 205 372, 215 374, 230 374 C 242 374, 254 376, 264 382 L 264 390 C 250 384, 236 380, 222 380 C 208 380, 196 376, 190 372 Z"
        fill="#5A2E10"
      />

      {/* Far-left surface root — starts at trunk base, sweeps LEFT and DOWN along ground */}
      <path
        d="M 130 368 C 124 370, 110 372, 90 374 C 72 376, 56 380, 42 386"
        stroke="#6B3A1F" strokeWidth="14" strokeLinecap="round" fill="none"
      />
      <path
        d="M 130 368 C 124 370, 110 372, 90 374 C 72 376, 56 380, 42 386"
        stroke="#92501E" strokeWidth="8" strokeLinecap="round" fill="none"
      />
      {/* Branch off far-left root */}
      <path d="M 80 375 C 74 378, 66 384, 60 394"
        stroke="#5A2E10" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M 80 375 C 74 378, 66 384, 60 394"
        stroke="#7A4220" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Near-left root — gentler sweep, shorter */}
      <path
        d="M 135 368 C 130 370, 118 372, 104 376 C 92 380, 82 386, 76 395"
        stroke="#6B3A1F" strokeWidth="11" strokeLinecap="round" fill="none"
      />
      <path
        d="M 135 368 C 130 370, 118 372, 104 376 C 92 380, 82 386, 76 395"
        stroke="#8B5E34" strokeWidth="6" strokeLinecap="round" fill="none"
      />

      {/* Center-left root — straight-ish down-left */}
      <path d="M 148 370 C 144 374, 138 380, 132 392"
        stroke="#6B3A1F" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M 148 370 C 144 374, 138 380, 132 392"
        stroke="#92501E" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Center-right root — straight-ish down-right */}
      <path d="M 172 370 C 176 374, 182 380, 188 392"
        stroke="#6B3A1F" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M 172 370 C 176 374, 182 380, 188 392"
        stroke="#92501E" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Near-right root */}
      <path
        d="M 185 368 C 190 370, 202 372, 216 376 C 228 380, 238 386, 244 395"
        stroke="#6B3A1F" strokeWidth="11" strokeLinecap="round" fill="none"
      />
      <path
        d="M 185 368 C 190 370, 202 372, 216 376 C 228 380, 238 386, 244 395"
        stroke="#8B5E34" strokeWidth="6" strokeLinecap="round" fill="none"
      />

      {/* Far-right surface root — sweeps RIGHT and DOWN */}
      <path
        d="M 190 368 C 196 370, 210 372, 230 374 C 248 376, 264 380, 278 386"
        stroke="#6B3A1F" strokeWidth="14" strokeLinecap="round" fill="none"
      />
      <path
        d="M 190 368 C 196 370, 210 372, 230 374 C 248 376, 264 380, 278 386"
        stroke="#92501E" strokeWidth="8" strokeLinecap="round" fill="none"
      />
      {/* Branch off far-right root */}
      <path d="M 240 375 C 246 378, 254 384, 260 394"
        stroke="#5A2E10" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M 240 375 C 246 378, 254 384, 260 394"
        stroke="#7A4220" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Light highlight on left roots */}
      <path d="M 130 368 C 122 371, 108 373, 88 375"
        stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M 190 368 C 198 371, 212 373, 232 375"
        stroke="rgba(255,255,255,0.12)" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* === TRUNK — organic taper (wider at base, narrower up) === */}
      <path
        d="
          M 130 368
          C 128 340, 127 310, 130 280
          C 133 255, 138 240, 142 220
          C 146 200, 148 185, 150 168
          C 152 150, 154 138, 155 125
          L 165 125
          C 166 138, 168 150, 170 168
          C 172 185, 174 200, 178 220
          C 182 240, 187 255, 190 280
          C 193 310, 192 340, 190 368
          Z
        "
        fill="url(#mt-trunk)"
      />

      {/* Bark texture grooves */}
      <path d="M 140 340 C 148 335, 152 338, 158 336 C 164 334, 168 337, 175 340"
        stroke="#5A2E10" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M 141 310 C 149 305, 153 308, 159 306 C 165 304, 169 307, 176 310"
        stroke="#5A2E10" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M 143 280 C 150 275, 154 278, 160 276 C 166 274, 170 277, 177 280"
        stroke="#5A2E10" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M 145 255 C 151 251, 155 253, 160 251 C 165 249, 169 252, 174 255"
        stroke="#5A2E10" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* Left highlight on trunk */}
      <path
        d="M 138 280 C 137 300, 136 330, 138 360"
        stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" fill="none"
      />

      {/* === BRANCH ARMS (5 main branches) === */}
      {/* Upper-left branch */}
      <path d="M 152 148 C 144 138, 118 122, 90 108"
        stroke="#7A4220" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M 90 108 C 80 103, 68 95, 60 88"
        stroke="#7A4220" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Upper-right branch */}
      <path d="M 168 148 C 176 138, 202 122, 230 108"
        stroke="#7A4220" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M 230 108 C 240 103, 252 95, 260 88"
        stroke="#7A4220" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Mid-left branch */}
      <path d="M 148 195 C 138 192, 108 188, 78 195"
        stroke="#7A4220" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Mid-right branch */}
      <path d="M 172 195 C 182 192, 212 188, 242 195"
        stroke="#7A4220" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Top center branch (slim) */}
      <path d="M 160 120 C 160 115, 160 105, 160 95"
        stroke="#7A4220" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* === LEAF CLUSTERS — organic blob paths, NOT circles === */}

      {/* Deep shadow/back layer (darkest green) */}
      <path
        d="M 160 145 C 140 130, 100 115, 72 118 C 48 120, 35 130, 40 145 C 44 158, 60 168, 78 172 C 92 175, 110 172, 122 168 C 118 180, 120 195, 130 202 C 140 208, 155 206, 160 200 C 165 206, 180 208, 190 202 C 200 195, 202 180, 198 168 C 210 172, 228 175, 242 172 C 260 168, 276 158, 280 145 C 285 130, 272 120, 248 118 C 220 115, 180 130, 160 145Z"
        fill="#047857"
        opacity="0.85"
      />

      {/* Mid-tone layer */}
      <path
        d="M 160 130 C 136 112, 94 100, 68 105 C 46 109, 36 122, 44 138 C 50 150, 66 160, 84 163 C 72 170, 62 182, 68 196 C 74 208, 90 214, 106 210 C 116 207, 128 200, 134 192 C 130 204, 132 220, 140 228 C 148 235, 158 234, 160 228 C 162 234, 172 235, 180 228 C 188 220, 190 204, 186 192 C 192 200, 204 207, 214 210 C 230 214, 246 208, 252 196 C 258 182, 248 170, 236 163 C 254 160, 270 150, 276 138 C 284 122, 274 109, 252 105 C 226 100, 184 112, 160 130Z"
        fill="url(#mt-leaf-mid)"
      />

      {/* Top bright layer */}
      <path
        d="M 160 118 C 142 98, 110 88, 86 93 C 64 98, 54 112, 60 128 C 64 140, 76 150, 90 154 C 80 162, 72 175, 78 188 C 84 200, 98 205, 112 200 C 122 196, 130 188, 132 180 C 130 192, 132 208, 140 215 C 148 222, 158 220, 160 214 C 162 220, 172 222, 180 215 C 188 208, 190 192, 188 180 C 190 188, 198 196, 208 200 C 222 205, 236 200, 242 188 C 248 175, 240 162, 230 154 C 244 150, 256 140, 260 128 C 266 112, 256 98, 234 93 C 210 88, 178 98, 160 118Z"
        fill="url(#mt-leaf-top)"
      />

      {/* Upper center cluster (crown) */}
      <path
        d="M 160 95 C 148 80, 130 70, 115 74 C 100 78, 92 90, 96 104 C 100 115, 112 122, 124 123 C 118 130, 118 140, 125 146 C 132 152, 144 150, 150 144 C 152 150, 156 155, 160 155 C 164 155, 168 150, 170 144 C 176 150, 188 152, 195 146 C 202 140, 202 130, 196 123 C 208 122, 220 115, 224 104 C 228 90, 220 78, 205 74 C 190 70, 172 80, 160 95Z"
        fill="url(#mt-leaf-top)"
      />

      {/* === HIGHLIGHT LAYER (top-left light source) === */}
      <path
        d="M 160 118 C 148 102, 122 93, 100 97 C 82 101, 72 114, 76 128 C 78 136, 84 143, 92 147 C 82 152, 74 162, 78 174 C 82 184, 92 189, 104 186 C 96 168, 102 152, 116 146 C 108 140, 100 128, 100 116 C 116 115, 134 112, 148 120 Z"
        fill="url(#mt-leaf-highlight)"
      />

      {/* === MAGIC SPARKLE STARS in canopy === */}
      {/* Large sparkle (cross shape) */}
      <g filter="url(#mt-glow)" style={{ animation: "gardenStarTwinkle 2.4s ease-in-out infinite" }}>
        <line x1="95" y1="118" x2="95" y2="126" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="91" y1="122" x2="99" y2="122" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="92" y1="119" x2="98" y2="125" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="98" y1="119" x2="92" y2="125" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </g>

      <g filter="url(#mt-glow)" style={{ animation: "gardenStarTwinkle 3.1s ease-in-out infinite", animationDelay: "-1.1s" }}>
        <line x1="220" y1="105" x2="220" y2="115" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="215" y1="110" x2="225" y2="110" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="216" y1="106" x2="224" y2="114" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="224" y1="106" x2="216" y2="114" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </g>

      <g filter="url(#mt-glow)" style={{ animation: "gardenStarTwinkle 2.8s ease-in-out infinite", animationDelay: "-2s" }}>
        <line x1="152" y1="85" x2="152" y2="93" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
        <line x1="148" y1="89" x2="156" y2="89" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Small floating sparkles */}
      <circle cx="76" cy="145" r="3" fill="#FDE047" opacity="0.9"
        style={{ animation: "gardenStarTwinkle 1.9s ease-in-out infinite", animationDelay: "-0.5s" }}
        filter="url(#mt-glow)"
      />
      <circle cx="244" cy="138" r="2.5" fill="#A7F3D0" opacity="0.9"
        style={{ animation: "gardenStarTwinkle 2.6s ease-in-out infinite", animationDelay: "-1.7s" }}
        filter="url(#mt-glow)"
      />
      <circle cx="180" cy="92" r="2" fill="#FDE047" opacity="0.8"
        style={{ animation: "gardenStarTwinkle 3.3s ease-in-out infinite", animationDelay: "-2.8s" }}
        filter="url(#mt-glow)"
      />
      <circle cx="130" cy="155" r="2" fill="#6EE7B7" opacity="0.7"
        style={{ animation: "gardenStarTwinkle 2.1s ease-in-out infinite", animationDelay: "-0.9s" }}
      />
      <circle cx="200" cy="165" r="2" fill="#6EE7B7" opacity="0.7"
        style={{ animation: "gardenStarTwinkle 2.9s ease-in-out infinite", animationDelay: "-1.4s" }}
      />

      {/* === 5 ZONE BRANCH INDICATOR DOTS === */}
      {/* These are subtle glowing orbs at branch tips to indicate zone connection */}
      <circle cx="62" cy="86" r="9" fill="rgba(253,224,71,0.25)"
        style={{ animation: "gardenBeaconPulse 3s ease-in-out infinite" }} />
      <circle cx="62" cy="86" r="5" fill="rgba(253,224,71,0.5)" />

      <circle cx="258" cy="86" r="9" fill="rgba(14,165,233,0.25)"
        style={{ animation: "gardenBeaconPulse 3.4s ease-in-out infinite", animationDelay: "-1s" }} />
      <circle cx="258" cy="86" r="5" fill="rgba(14,165,233,0.5)" />

      <circle cx="76" cy="196" r="8" fill="rgba(249,115,22,0.25)"
        style={{ animation: "gardenBeaconPulse 2.8s ease-in-out infinite", animationDelay: "-2s" }} />
      <circle cx="76" cy="196" r="4.5" fill="rgba(249,115,22,0.5)" />

      <circle cx="244" cy="196" r="8" fill="rgba(236,72,153,0.25)"
        style={{ animation: "gardenBeaconPulse 3.2s ease-in-out infinite", animationDelay: "-0.5s" }} />
      <circle cx="244" cy="196" r="4.5" fill="rgba(236,72,153,0.5)" />

      <circle cx="160" cy="93" r="10" fill="rgba(253,224,71,0.3)"
        style={{ animation: "gardenBeaconPulse 2.5s ease-in-out infinite", animationDelay: "-1.5s" }} />
      <circle cx="160" cy="93" r="5.5" fill="rgba(253,224,71,0.6)" />
    </svg>
  );
}
