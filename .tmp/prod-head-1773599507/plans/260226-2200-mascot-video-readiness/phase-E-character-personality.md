---
phase: E
title: "Character Personality Animations"
status: pending
priority: P2
effort: 4h
dependencies: [A]
---

# Phase E: Character-Specific Personality Animations

## Overview

Add unique personality animations per character, making each owl distinguishable beyond color/size.

## Character Animations

### DadOwl
- **peer-over-glasses**: pupils shift down, glasses tilt slightly (rotate 3deg). Used during "hmm, let me see" moments
- **authoritative-nod**: slow deliberate nod with slight forward lean. Used when confirming/approving

### SisterOwl
- **spin-360**: full rotation when celebrating. CSS animation `rotate(0deg)` to `rotate(360deg)` over 0.8s
- **ear-tuft-wiggle**: ear tufts oscillate left-right. Animated transform on ear tuft paths
- **bow-wobble**: hair bow tilts side to side. Transform on bow accessory path

### BabyOwl
- **stumble-toddle**: body sways side to side with slight forward lean. Used during walking scenes
- **beanie-fall**: beanie slides to one side when surprised. Transform translateX on beanie group
- **napping-curl**: body scaleY shrinks, eyes close, slight rotate. Compact sleeping pose

### BigOwl
- **teacher-lean-forward**: slight scaleX increase + translateY forward. "Let me explain" pose

### SmallOwl
- **raise-hand-bounce**: body bounces up while right wing raises. Eager student energy
- **curious-head-tilt**: head rotates 8-10deg to one side. "Hmm?" expression

## Files to Modify

- `src/components/mascot/characters/DadOwl.tsx`
- `src/components/mascot/characters/SisterOwl.tsx`
- `src/components/mascot/characters/BabyOwl.tsx`
- `src/components/mascot/characters/BigOwl.tsx`
- `src/components/mascot/characters/SmallOwl.tsx`

## Files to Create

- `src/components/mascot/personality/personality-types.ts` -- PersonalityAnimation type
- `src/components/mascot/personality/personality-configs.ts` -- animation configs per character

## Implementation Steps

### Step 1: Define personality type

```ts
export type PersonalityAnimation =
  // DadOwl
  | "peer-over-glasses" | "authoritative-nod"
  // SisterOwl
  | "spin-360" | "ear-tuft-wiggle" | "bow-wobble"
  // BabyOwl
  | "stumble-toddle" | "beanie-fall" | "napping-curl"
  // BigOwl
  | "teacher-lean-forward"
  // SmallOwl
  | "raise-hand-bounce" | "curious-head-tilt"
  | "none";
```

### Step 2: Add personality prop

Add `personality?: PersonalityAnimation` to character-level props (not MascotProps -- personality is per-character, controlled by sequence steps or explicit prop).

### Step 3: Implement per-character

Each character adds conditional animation blocks based on `personality` prop. E.g. DadOwl:

```tsx
// In DadOwl.tsx, wrap glasses group:
{personality === "peer-over-glasses" ? (
  <m.g
    animate={{ rotate: [0, 3, 0], y: [0, 2, 0] }}
    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
    style={{ transformOrigin: "center" }}
  >
    {/* glasses paths */}
  </m.g>
) : (/* normal glasses */)}
```

### Step 4: Wire to sequence system

In Phase D's MascotSequenceStep, optionally add `personality` field so video sequences can trigger personality animations per step.

## Todo

- [ ] Create personality-types.ts
- [ ] Create personality-configs.ts
- [ ] Add DadOwl peer-over-glasses animation
- [ ] Add DadOwl authoritative-nod animation
- [ ] Add SisterOwl spin-360 animation
- [ ] Add SisterOwl ear-tuft-wiggle
- [ ] Add SisterOwl bow-wobble
- [ ] Add BabyOwl stumble-toddle
- [ ] Add BabyOwl beanie-fall
- [ ] Add BabyOwl napping-curl
- [ ] Add BigOwl teacher-lean-forward
- [ ] Add SmallOwl raise-hand-bounce
- [ ] Add SmallOwl curious-head-tilt
- [ ] Test each personality animation
- [ ] Build passes

## Success Criteria

- Each character has at least 2 unique personality animations
- Animations are visually distinctive and match character personality
- Personality animations composable with state + gesture
- No regression on existing character rendering
