---
phase: C
title: "Add Educational Action Props"
status: pending
priority: P1
effort: 5h
dependencies: none
---

# Phase C: Add Educational Action Props

## Overview

Add 6 new action props for educational video scenes: writing, drawing, flashcard, pointing-stick, trophy, magnifying-glass.

## Files to Modify

- `src/components/mascot/types.ts` -- extend MascotActionProp union
- `src/components/mascot/props/index.tsx` -- add routing to new props

## Files to Create

- `src/components/mascot/props/WritingProp.tsx`
- `src/components/mascot/props/DrawingProp.tsx`
- `src/components/mascot/props/FlashcardProp.tsx`
- `src/components/mascot/props/PointingStickProp.tsx`
- `src/components/mascot/props/TrophyProp.tsx`
- `src/components/mascot/props/MagnifyingGlassProp.tsx`

## Implementation Steps

### Step 1: Extend MascotActionProp type

```ts
export type MascotActionProp =
  | "reading" | "space" | "magic" | "heart" | "music"
  | "writing" | "drawing" | "flashcard" | "pointing-stick"
  | "trophy" | "magnifying-glass" | "none";
```

### Step 2: Create prop components

Each prop follows existing pattern: receives `target` ("big"|"small") and `reducedMotion`. Positioned relative to character's right wing area.

#### WritingProp.tsx
```tsx
// Pencil held in right wing, with writing motion line
// SVG: angled pencil shape + animated squiggle trail
// Big target: pencil at (280, 170), angled -30deg
// Small target: pencil at (225, 178), scaled 0.6x
const pencilBody = "M 0 0 L 3 -30 L 9 -30 L 12 0 Z"; // pencil shape
const pencilTip = "M 3 -30 L 6 -38 L 9 -30 Z";        // triangle tip
const eraser = "M 0 0 L 12 0 L 12 4 L 0 4 Z";          // pink eraser
// Animated: small squiggle line below tip, opacity pulses
```

#### DrawingProp.tsx
```tsx
// Paintbrush + colorful paint splash
// SVG: brush handle + bristle tip + 3 small color dots
// Animated: brush tilts slightly, color dots pulse in/out
const brushHandle = "M 0 0 L 2 -25 L 6 -25 L 8 0 Z";
const bristles = "M 1 -25 Q 4 -32 7 -25";
// Color dots: circle r=3 in red, blue, yellow near brush tip
```

#### FlashcardProp.tsx
```tsx
// Rectangular card with rounded corners, slight tilt
// SVG: rect 40x28 with rx=3, white fill, blue border
// Center area left empty (for content overlay in video)
// Animated: gentle float up-down
const card = "M 0 0 H 40 V 28 H 0 Z"; // rx=3
// Optional: "ABC" or "123" placeholder text
```

#### PointingStickProp.tsx
```tsx
// Long thin stick angled upward-right
// SVG: thin rect rotated, small tip circle
// Big: from (275, 140) extending to (330, 80)
// Animated: slight tap motion (rotate -2 to 2 deg)
const stick = "M 0 0 L 55 -60";  // strokeWidth=3
const tip = "M 55 -60"; // small circle r=3
```

#### TrophyProp.tsx
```tsx
// Gold trophy cup with star
// SVG: cup shape + handles + base + star decoration
const cup = "M -12 0 C -14 -18 14 -18 12 0 Z";
const base = "M -8 0 H 8 V 4 H -8 Z";
const pedestal = "M -12 4 H 12 V 8 H -12 Z";
const star = "M 0 -12 L 2 -7 L 7 -7 L 3 -4 L 4.5 1 L 0 -2 L -4.5 1 L -3 -4 L -7 -7 L -2 -7 Z";
// Animated: gentle shine (opacity sweep), slight scale pulse
// Fill: #fbbf24 (gold), star fill: #fde047
```

#### MagnifyingGlassProp.tsx
```tsx
// Circle lens + handle
// SVG: circle r=14, strokeWidth=3, line for handle
const lens = "M 0 0"; // circle cx=0 cy=0 r=14
const handle = "M 10 10 L 22 22"; // diagonal handle
const glint = "M -4 -8 C -2 -10 2 -10 4 -8"; // shine arc
// Animated: slight hover/scan movement (x oscillation)
// Lens: fill white opacity 0.2, stroke #1e3a8a
// Handle: stroke #92400e strokeWidth=4
```

### Step 3: Update ActionPropLayer

```tsx
// In props/index.tsx, add cases:
if (actionProp === "writing") return <WritingProp target={baseTarget} reducedMotion={reducedMotion} />;
if (actionProp === "drawing") return <DrawingProp target={baseTarget} reducedMotion={reducedMotion} />;
if (actionProp === "flashcard") return <FlashcardProp target={baseTarget} reducedMotion={reducedMotion} />;
if (actionProp === "pointing-stick") return <PointingStickProp target={baseTarget} reducedMotion={reducedMotion} />;
if (actionProp === "trophy") return <TrophyProp target={baseTarget} reducedMotion={reducedMotion} />;
if (actionProp === "magnifying-glass") return <MagnifyingGlassProp target={baseTarget} reducedMotion={reducedMotion} />;
```

### Step 4: Position tuning

Each prop needs big/small position offsets. Follow existing prop pattern (e.g., ReadingProp) for `target === "big"` vs `target === "small"` translation values.

## Todo

- [ ] Extend MascotActionProp type with 6 new values
- [ ] Create WritingProp.tsx
- [ ] Create DrawingProp.tsx
- [ ] Create FlashcardProp.tsx
- [ ] Create PointingStickProp.tsx
- [ ] Create TrophyProp.tsx
- [ ] Create MagnifyingGlassProp.tsx
- [ ] Update ActionPropLayer routing
- [ ] Test each prop on big and small targets
- [ ] Build passes

## Success Criteria

- All 6 props render correctly on big and small targets
- Props have subtle idle animation (not static SVG)
- Each prop visually recognizable at 160px mascot size
- No regression on existing 5 props
