# Kids Educational Video Design Specs
**Research Report** — 2026-02-27
**Target:** Vietnamese children ages 5–8, learning English phonics + math
**Mascots:** Owl family (Cú Mẹ, Cú Bố, Cú Chị, Cú Con, Cú Em)
**Implementation:** Remotion (React/CSS/SVG, no video assets)

---

## 1. Color Palette

### Primary Brand Colors
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary warm | Sunny Yellow | `#FFD93D` | Titles, highlights, owl accents |
| Primary cool | Sky Blue | `#4D96FF` | Backgrounds, calm scenes |
| Accent | Coral Red | `#FF6B6B` | Alerts, incorrect answers, CTAs |
| Accent | Mint Green | `#6BCB77` | Correct answers, progress, success |
| Accent | Soft Purple | `#C77DFF` | Section markers, decorative |
| Accent | Warm Orange | `#FF9F1C` | Energy moments, bounces |
| Neutral light | Cream White | `#FFFBF0` | Content area background |
| Neutral | Soft Gray | `#F2F2F2` | Cards, containers |

### Background Gradients (by lesson mood)
```css
/* Default lesson */
background: linear-gradient(160deg, #E8F4FD 0%, #FFF8E1 100%);

/* Phonics/letters */
background: linear-gradient(160deg, #F3E5F5 0%, #E8F5E9 100%);

/* Math/numbers */
background: linear-gradient(160deg, #E3F2FD 0%, #FFF9C4 100%);

/* Celebration */
background: linear-gradient(160deg, #FFF176 0%, #FFD54F 50%, #FF8A65 100%);

/* Night/calm */
background: linear-gradient(160deg, #1A237E 0%, #283593 50%, #3949AB 100%);
```

### Color Rules
- Text on light bg: `#2D2D2D` (not pure black — softer)
- Text on dark bg: `#FFFBF0`
- Never use > 4 saturated colors simultaneously
- Cool colors (blue/green) for instructional content zones
- Warm colors (yellow/orange/red) for engagement/reward zones
- Minimum contrast ratio: 4.5:1 for all text

---

## 2. Typography

### Font Stack
```css
/* Primary: Nunito (rounded, friendly, excellent for early readers) */
font-family: 'Nunito', 'Varela Round', 'Comic Neue', sans-serif;

/* Display/titles: Fredoka One (bold, playful) */
font-family: 'Fredoka One', 'Bubblegum Sans', cursive;

/* Letter/phonics display: very large, one character at a time */
font-family: 'Nunito', sans-serif;
font-weight: 800;
```

### Size Scale (1080p baseline, 1920×1080)
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Main title / letter display | 120–160px | 800 | Primary brand color |
| Section header | 72–90px | 700 | `#2D2D2D` |
| Instruction text | 52–64px | 600 | `#2D2D2D` |
| Word on screen | 80–96px | 700 | Varies by context |
| Answer choice | 56–72px | 600 | `#2D2D2D` |
| Caption/subtitle | 40–48px | 500 | `#555555` |
| Progress label | 32–36px | 600 | `#777777` |

Scale down 50% for 960×540 previews.

### Typography Rules
- Letter-spacing: `0.02em` to `0.05em` — slightly open for early readers
- Line-height: `1.3` minimum
- Max words per line: 6 (early readers need short lines)
- Never use italics for main content
- Bold to emphasize phoneme, not italic
- Highlighted letter: larger scale (1.3×) + bright fill + drop shadow

---

## 3. Screen Layout (1920×1080)

### Zone Map
```
┌─────────────────────────────────────────┐
│  TOP BAR (80px): lesson title + progress│
├──────────────┬──────────────────────────┤
│              │                          │
│  CHARACTER   │   CONTENT AREA           │
│  ZONE        │   (letters/words/math)   │
│  30% width   │   60% width              │
│  full height │                          │
│              │                          │
├──────────────┴──────────────────────────┤
│  BOTTOM BAR (100px): prompt / next cue  │
└─────────────────────────────────────────┘
```

### Exact Pixel Measurements
| Zone | X | Y | Width | Height |
|------|---|---|-------|--------|
| Top bar | 0 | 0 | 1920 | 80 |
| Character zone | 0 | 80 | 576 | 900 |
| Content area | 576 | 80 | 1152 | 900 |
| Bottom bar | 0 | 980 | 1920 | 100 |
| Safe margin (all sides) | 40px |

### Character Zone Rules
- Owl character: max 480px wide, vertically centered
- Character sits at bottom of zone, head at ~60% screen height
- Speech bubble: appears top-right of character, max 400px wide
- Character always on LEFT (reading direction left→right is maintained)

### Content Area Rules
- Letter/number display: centered, 60% of content area width
- Answer choices: grid 2×2 or row of 3, centered
- Each choice card: min 240×180px, 24px border-radius
- Padding inside card: 32px
- Gap between cards: 24px

### Decorative Zones
- Clouds: top corners, 10–15% screen width, opacity 0.6
- Ground/grass: bottom 8% of screen (below character feet), optional
- Stars/sparkles: scattered, never in center 60% of screen

---

## 4. Visual Elements & Assets (CSS/SVG only)

### Stars (SVG clip-path polygon)
```css
/* 5-point star */
clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
                   50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
```
| Size class | px | Color |
|---|---|---|
| small | 20×20 | `#FFD93D` |
| medium | 36×36 | `#FFD93D` with `#FF9F1C` shadow |
| large | 60×60 | gradient `#FFD93D` → `#FF9F1C` |
| hero (reward) | 100×100 | animated gradient |

### Clouds (SVG border-radius trick)
```css
.cloud {
  background: white;
  border-radius: 50px;
  width: 180px; height: 60px;
  opacity: 0.75;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.08));
}
.cloud::before {
  content: '';
  position: absolute;
  width: 80px; height: 80px;
  background: white;
  border-radius: 50%;
  top: -40px; left: 20px;
}
.cloud::after {
  content: '';
  position: absolute;
  width: 60px; height: 60px;
  background: white;
  border-radius: 50%;
  top: -30px; left: 80px;
}
```

### Bubbles
- Circle, 40–80px diameter
- Colors: `rgba(77,150,255,0.3)`, `rgba(108,203,119,0.3)`, `rgba(255,217,61,0.3)`
- Stroke: 2px solid with 0.5 opacity
- Float animation: translateY(-20px) over 3–5s, infinite

### Progress Bar
```css
.progress-track {
  width: 400px; height: 20px;
  background: rgba(255,255,255,0.4);
  border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.6);
}
.progress-fill {
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg, #6BCB77, #4CAF50);
  box-shadow: 0 0 8px rgba(108,203,119,0.6);
  transition: width 600ms cubic-bezier(0.34,1.56,0.64,1); /* spring-like */
}
```

### Section Dot Indicators
- Row of circles, 16px diameter each, 12px gap
- Inactive: `rgba(255,255,255,0.4)`
- Active: `#FFD93D` with `box-shadow: 0 0 0 3px rgba(255,217,61,0.4)`
- Completed: `#6BCB77`

---

## 5. Animations (Remotion spring/interpolate specs)

### Spring Config Presets
```ts
// Bouncy entry (character pop-in, choice cards)
const SPRING_BOUNCY = { damping: 6, stiffness: 80, mass: 1 };

// Smooth entry (text, titles)
const SPRING_SMOOTH = { damping: 14, stiffness: 100, mass: 1 };

// Snappy (button presses, correct answer pulse)
const SPRING_SNAPPY = { damping: 10, stiffness: 200, mass: 0.8 };

// Gentle float (clouds, decorative elements)
const SPRING_GENTLE = { damping: 20, stiffness: 60, mass: 1.2 };
```

### Standard Entry Animations
| Element | Type | Duration | Config |
|---------|------|----------|--------|
| Title text | scale 0→1 + translateY -30→0 | 20 frames | SPRING_SMOOTH |
| Character | scale 0→1 from bottom | 25 frames | SPRING_BOUNCY |
| Choice cards | staggered scale 0→1 | 8 frames each, 6 frame offset | SPRING_BOUNCY |
| Letter/number hero | scale 0→1.2→1 | 20 frames | SPRING_SNAPPY |
| Correct highlight | scale 1→1.15→1 | 12 frames | SPRING_SNAPPY |
| Speech bubble | scale 0→1 origin bottom-left | 15 frames | SPRING_BOUNCY |

### Highlight Animation (phonics/answer cue)
```tsx
// Pulsing glow on correct letter/word
const highlightScale = interpolate(
  (frame % 30), [0, 15, 30], [1, 1.08, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);
const glowOpacity = interpolate(
  (frame % 30), [0, 15, 30], [0.4, 0.9, 0.4]
);
// Apply: box-shadow with glowOpacity, transform scale
```

### Circle/Underline Answer Cue
```tsx
// Draw-on circle using SVG strokeDashoffset
// Circle circumference: 2πr. For r=60: ~377px
const drawProgress = interpolate(frame, [0, 20], [377, 0], { extrapolateRight: 'clamp' });
// SVG: <circle r={60} strokeDasharray={377} strokeDashoffset={drawProgress} />
// Color: #FF6B6B stroke, 4px width, no fill
```

### Character Idle Animation (loop)
```tsx
// Gentle breathing bob: translateY 0 → -8px → 0, period 90 frames at 30fps
const bob = Math.sin((frame / 90) * Math.PI * 2) * 8;
// Wing flutter: rotate -5 → 5 → -5, period 60 frames, offset timing
const wingAngle = Math.sin((frame / 60) * Math.PI * 2) * 5;
```

---

## 6. Transitions

### Scene Change Types
| Transition | Duration (frames@30fps) | Use case |
|---|---|---|
| Fade white flash | 15 frames | Standard lesson step |
| Slide left wipe | 20 frames | Moving to next topic |
| Scale zoom-in | 18 frames | Zooming into letter/object |
| Bounce drop | 22 frames | Character entrance to new scene |
| Dissolve crossfade | 24 frames | Calm/story transitions |

### White Flash (most common for kids)
```tsx
// Frame 0–7: opacity 0→1, Frame 7–15: opacity 1→0
const flashOpacity = interpolate(
  frame, [0, 7, 15], [0, 1, 0],
  { extrapolateRight: 'clamp' }
);
// <div style={{ position:'absolute', inset:0, background:'white', opacity:flashOpacity }} />
```

### Slide Wipe
```tsx
const slideX = interpolate(
  frame, [0, 20], [1920, 0],
  { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }
);
```

### Celebration Zoom
```tsx
// Scene scales from 1 → 1.05 → 1 (subtle zoom pulse on correct answer)
const celebZoom = spring({ frame, fps, from: 1, to: 1.05,
  config: { damping: 4, stiffness: 120 } });
```

---

## 7. Reward/Celebration Visuals

### Confetti System (pure CSS/React)
- 30–50 pieces per burst
- Colors: `#FF6B6B`, `#FFD93D`, `#6BCB77`, `#4D96FF`, `#C77DFF`, `#FF9F1C`
- Shapes: squares (40%), rectangles (30%), circles (30%)
- Size: 8–16px
- Fall duration: 2.5–4s, randomized per piece
- Entry: burst from bottom center (70%) and top (30%)
- Exit: fade opacity to 0 in last 20% of fall

### Star Burst (correct answer)
```tsx
// 8–12 stars burst outward from answer center
// Each star: scale 0→1.5→0 over 600ms, translate outward 100–180px at random angle
// Colors alternate: #FFD93D, #FF9F1C
// Rotation: 0 → 360deg during burst
```

### Trophy/Badge Pop
```tsx
// scale: 0 → 1.3 → 1.0 over 30 frames, SPRING_SNAPPY
// Followed by: gentle bob animation (see idle)
// Size: 160×160px centered
// Background: radial gradient gold #FFD700 → #FF8F00
```

### Fireworks (section complete)
- 3–5 burst points at different screen positions
- Each burst: 12–16 lines (SVG) radiating from center, then fade
- Colors per burst match section color coding
- Stagger bursts: 8 frames apart

---

## 8. Section Indicators & Lesson Structure

### Lesson Template Structure (Remotion composition)
```
[INTRO - 3s]        Owl character enters + title
[HOOK - 5s]         Question or visual teaser
[TEACH - 15-30s]    Core content, letter/number display
[PRACTICE - 20-30s] 3–4 interactive choice moments
[CELEBRATE - 5s]    Reward animation
[REVIEW - 10s]      Summary, repeat key sound
[OUTRO - 3s]        Owl wave + "See you next time!"
```

### Section Header Card
```css
/* Appears for 2s at section transitions */
.section-card {
  background: var(--section-color);  /* per section */
  border-radius: 24px;
  padding: 20px 48px;
  font-size: 56px;
  font-weight: 700;
  color: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  /* Entry: scale 0→1 bounce, 20 frames */
  /* Exit: scale 1→0 shrink, 12 frames */
}
```

### Section Colors
| Section | Color | Hex |
|---------|-------|-----|
| Intro/Warm up | Yellow | `#FFD93D` |
| Letters/Phonics | Purple | `#C77DFF` |
| Words | Blue | `#4D96FF` |
| Numbers/Math | Green | `#6BCB77` |
| Practice/Quiz | Orange | `#FF9F1C` |
| Celebrate | Multi | confetti colors |
| Review/Outro | Soft teal | `#26C6DA` |

---

## 9. Phonics-Specific Visual Cues

### Letter Highlight System (for Alphablocks-style phonics)
- Target phoneme letter: 160px, `#C77DFF`, white text
- Silent letters: 60% opacity, strikethrough visual
- Vowel letters: always `#FF6B6B` (red — consistent with UK phonics standard)
- Consonant letters: `#4D96FF`
- Digraph pair (e.g., "sh"): bracket underline, `#FF9F1C`, drawn on via SVG

### Word Reveal (blending animation)
```
Step 1: Show individual letters separately (60px gap between)
Step 2: Animate letters sliding together (translateX spring)
Step 3: Word appears whole — scale pulse + highlight flash
Duration: 8 frames per letter, 15 frames merge, 10 frames reveal
```

### Phoneme Sound Wave (visual feedback when sound plays)
```css
/* 3 animated bars like audio equalizer, 30px wide each */
@keyframes sound-wave {
  0%, 100% { height: 20px; }
  50% { height: 48px; }
}
/* Bars staggered: delay 0ms, 100ms, 200ms */
/* Color: matches current section color */
```

---

## 10. Owl Character Integration Guidelines

### Character Size on Screen
| Scene type | Owl width | Screen % |
|---|---|---|
| Full teaching scene | 420px | 22% |
| Reaction/emotion | 520px | 27% |
| Background/ambient | 200px | 10% |
| Close-up face | 640px | 33% |

### Character Expressions → Animation Triggers
| Trigger | Expression | Animation |
|---------|-----------|-----------|
| Correct answer | Happy/excited | Jump +40px, wing flap 3× |
| Wrong answer | Gentle encourage | Head shake 2× (±10deg) |
| Introducing concept | Curious | Head tilt 15deg, eye widen |
| Celebration | Overjoyed | Full bounce + spin 360deg |
| Quiet moment | Calm | Breathing bob only |
| Asking question | Thinking | Scratch head gesture |

### Speech Bubble Positioning
```css
.speech-bubble {
  position: absolute;
  left: calc(character-right + 20px);
  bottom: calc(character-head-top + 40px);
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 20px 24px;
  font-size: 40px;
  font-weight: 600;
  border: 3px solid #FFD93D;
  /* Tail triangle pointing left-bottom toward character */
}
```

---

## 11. Background Style System

### Sky Background (default)
```css
background: linear-gradient(180deg, #87CEEB 0%, #E0F4FF 50%, #FFFBF0 100%);
/* Add: 2–3 animated clouds (see section 4) */
/* Optional: hills/grass strip at bottom 12% */
```

### Indoor Classroom
```css
background: linear-gradient(180deg, #FFF8E1 0%, #FFFDE7 100%);
/* Add: subtle grid lines (opacity 0.05), chalkboard element top 30% */
```

### Night Scene (calm/story)
```css
background: linear-gradient(180deg, #0D1B4B 0%, #1A2980 60%, #26296C 100%);
/* Add: 15–20 star dots (2–6px, white, opacity 0.6–1.0, twinkle animation) */
```

### Forest/Nature
```css
background: linear-gradient(180deg, #C8E6C9 0%, #A5D6A7 100%);
/* Add: stylized tree silhouettes at edges (SVG paths, #388E3C) */
```

---

## 12. Implementation Priorities for Remotion

### Phase 1: Core template
1. 1920×1080 base composition
2. Background gradient system (prop-driven)
3. Character zone + content area layout (CSS Grid)
4. Nunito + Fredoka One fonts via `@remotion/google-fonts`
5. Spring entry animations for titles/cards

### Phase 2: Content components
6. LetterDisplay component (large, colored, with highlight state)
7. WordDisplay component (blending animation)
8. AnswerCard component (4-up grid, correct/wrong states)
9. SpeechBubble component (positioned relative to character)
10. ProgressBar + SectionDots components

### Phase 3: Reward system
11. Confetti burst (React-rendered, frame-driven random positions)
12. StarBurst component
13. CelebrationOverlay composition
14. Section transition cards

### Phase 4: Polish
15. Cloud/bubble ambient decorations
16. Sound wave visual feedback
17. Character animation states (idle/react/celebrate)
18. Scene transition system (white flash, slide wipe)

---

## Unresolved Questions

1. **Aspect ratio**: 1920×1080 (16:9) confirmed for YouTube? Or also 1080×1920 (9:16 for TikTok/Reels)? Layout zones shift significantly for portrait.
2. **Font licensing**: Nunito + Fredoka One are Google Fonts (free). Any custom Vietnamese font needed for UI text in Vietnamese?
3. **Character art**: Are owl SVG assets already available or still being produced? Remotion integration depends on SVG vs PNG format.
4. **FPS**: 30fps assumed. 24fps would reduce render cost but affects spring animation feel.
5. **Audio sync**: Visual highlight timing (letter glow on phoneme) requires frame-accurate audio timestamps — how will those be provided?
6. **Answer interactivity**: Videos are MP4 (passive) not interactive. Circling/highlighting answers must be pre-scripted per lesson — no user input during playback.
