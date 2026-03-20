---
phase: F
title: "Per-Character Prop Positioning"
status: pending
priority: P1
effort: 2h
dependencies: none
---

# Phase F: Per-Character ActionProp Positioning

## Overview

Current `resolveBaseTarget` collapses dad→big and sister/baby→small. Props appear misaligned on Sister and Baby because their wing/body positions differ from SmallOwl. Replace with per-character offset maps.

## Problem

```ts
// Current -- loses positioning info:
function resolveBaseTarget(target: ActionPropTarget): "big" | "small" {
  if (target === "dad" || target === "big") return "big";
  return "small";
}
```

Sister's wings are at different coordinates than Small's. Baby is even smaller. Props float in wrong positions.

## Files to Modify

- `src/components/mascot/props/index.tsx` -- remove resolveBaseTarget, pass full target
- All prop components: `ReadingProp.tsx`, `SpaceProp.tsx`, `MagicProp.tsx`, `HeartProp.tsx`, `MusicProp.tsx` + new Phase C props

## Implementation Steps

### Step 1: Define offset map

```ts
const PROP_OFFSETS: Record<ActionPropTarget, { x: number; y: number; scale: number }> = {
  big:    { x: 0,   y: 0,    scale: 1 },
  small:  { x: 0,   y: 0,    scale: 1 },    // reference for small-size props
  dad:    { x: -2,  y: -5,   scale: 1.15 },  // slightly larger, shifted
  sister: { x: 3,   y: -4,   scale: 0.85 },  // smaller than small
  baby:   { x: 5,   y: 2,    scale: 0.65 },  // much smaller
};
```

### Step 2: Update ActionPropLayer

```tsx
export function ActionPropLayer({ actionProp, target, reducedMotion }: ActionPropLayerProps) {
  if (actionProp === "none") return null;

  const offset = PROP_OFFSETS[target];
  const baseTarget: "big" | "small" = (target === "dad" || target === "big") ? "big" : "small";

  return (
    <g transform={`translate(${offset.x} ${offset.y}) scale(${offset.scale})`}>
      {/* render prop with baseTarget for base positioning */}
      {renderProp(actionProp, baseTarget, reducedMotion)}
    </g>
  );
}

function renderProp(actionProp: MascotActionProp, baseTarget: "big" | "small", reducedMotion: boolean) {
  if (actionProp === "reading") return <ReadingProp target={baseTarget} reducedMotion={reducedMotion} />;
  // ... etc
}
```

### Step 3: Fine-tune offsets

Test each character with each prop. Adjust x/y/scale values until props align with wing tip area.

## Todo

- [ ] Define PROP_OFFSETS map with per-character values
- [ ] Refactor ActionPropLayer to use offset wrapping
- [ ] Test all existing props on dad, sister, baby targets
- [ ] Fine-tune offset values
- [ ] Build passes

## Success Criteria

- Props visually align with each character's wing/body area
- No regression on big/small prop positioning
- Sister and Baby props no longer misaligned
