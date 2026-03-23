---
phase: B
title: "Add Gesture System"
status: pending
priority: P0
effort: 6h
dependencies: none
---

# Phase B: Add Gesture System

## Overview

Add 7 educational gestures (pointing, waving, nodding, head-shake, clapping, thinking-scratch, raise-hand) as a new prop layer independent of emotional state. Gestures override wing SVG paths and add head transforms.

## Architecture

Gesture is orthogonal to state: `state` controls face/body mood, `gesture` controls limb/head action.

```
MascotProps.gesture → Mascot.tsx → CharacterOwl.tsx
                                      ├── wing paths overridden by gesture
                                      └── head <g> wrapped with gesture transform
```

## Files to Modify

- `src/components/mascot/types.ts` -- add MascotGesture type, gesture prop
- `src/components/mascot/Mascot.tsx` -- thread gesture prop to characters

## Files to Create

- `src/components/mascot/gestures/gesture-types.ts` -- gesture config per character
- `src/components/mascot/gestures/GestureLayer.tsx` -- component applying gesture transforms
- `src/components/mascot/gestures/index.ts` -- barrel export

## Implementation Steps

### Step 1: Add types

In `types.ts`:
```ts
export type MascotGesture =
  | "none" | "pointing" | "waving" | "nodding"
  | "head-shake" | "clapping" | "thinking-scratch" | "raise-hand";
```

Add to MascotProps:
```ts
gesture?: MascotGesture;
```

### Step 2: Create gesture config

`gestures/gesture-types.ts`:
```ts
export interface GestureConfig {
  leftWing?: {
    d: string;           // override SVG path
    animate?: object;    // motion/react animate
    transition?: object;
  };
  rightWing?: {
    d: string;
    animate?: object;
    transition?: object;
  };
  headTransform?: {
    animate: object;     // { rotate: [...], x: [...], y: [...] }
    transition: object;
  };
}
```

### Step 3: Define gesture wing paths + head transforms

#### pointing (right wing extends forward)
```ts
pointing: {
  rightWing: {
    // BigOwl: wing extends right and slightly up, "pointing" pose
    d: "M 275,125 C 310,110 330,105 340,108",
    animate: { rotate: [0, -3, 0] },
    transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
  },
  // left wing stays normal (no override)
}
```

#### waving (right wing raised, oscillating)
```ts
waving: {
  rightWing: {
    d: "M 275,125 C 290,100 295,80 285,70",
    animate: { rotate: [-15, 15, -15] },
    transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity },
  },
}
```

#### nodding (head bobs up-down)
```ts
nodding: {
  headTransform: {
    animate: { y: [0, 4, 0, 4, 0] },
    transition: { duration: 1.2, ease: "easeInOut", repeat: Infinity },
  },
}
```

#### head-shake (head rotates left-right)
```ts
"head-shake": {
  headTransform: {
    animate: { rotate: [-6, 6, -6, 6, 0], x: [-2, 2, -2, 2, 0] },
    transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
  },
}
```

#### clapping (both wings come together in front)
```ts
clapping: {
  leftWing: {
    d: "M 125,125 C 140,130 160,135 180,140",
    animate: { rotate: [0, 20, 0] },
    transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
  },
  rightWing: {
    d: "M 275,125 C 260,130 240,135 220,140",
    animate: { rotate: [0, -20, 0] },
    transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
  },
}
```

#### thinking-scratch (right wing touches head)
```ts
"thinking-scratch": {
  rightWing: {
    d: "M 275,125 C 270,100 255,75 240,65",
    animate: { x: [-2, 2, -2] },
    transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
  },
  headTransform: {
    animate: { rotate: [-3, 0, -3] },
    transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
  },
}
```

#### raise-hand (right wing straight up)
```ts
"raise-hand": {
  rightWing: {
    d: "M 275,125 C 285,100 283,75 280,55",
    animate: { y: [-2, 2, -2] },
    transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
  },
}
```

### Step 4: Per-character path scaling

Each gesture needs scaled wing paths for all 5 characters. Store as:
```ts
export const GESTURE_CONFIGS: Record<MascotVariant, Record<MascotGesture, GestureConfig>> = { ... }
```

Use BigOwl as reference, scale proportionally:
- SmallOwl: ~0.6x, shifted to (186,158) center
- DadOwl: ~1.15x
- SisterOwl: ~0.75x
- BabyOwl: ~0.45x

### Step 5: Create GestureLayer component

`gestures/GestureLayer.tsx`:
```tsx
interface GestureLayerProps {
  gesture: MascotGesture;
  variant: MascotVariant;
  reducedMotion: boolean;
  children: ReactNode; // the character's head group
}

export function GestureLayer({ gesture, variant, reducedMotion, children }: GestureLayerProps) {
  if (gesture === "none") return <>{children}</>;
  const config = GESTURE_CONFIGS[variant]?.[gesture];
  if (!config) return <>{children}</>;

  // Wrap children (head) with headTransform if present
  const head = config.headTransform ? (
    <m.g
      animate={reducedMotion ? undefined : config.headTransform.animate}
      transition={reducedMotion ? undefined : config.headTransform.transition}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      {children}
    </m.g>
  ) : children;

  return <>{head}</>;
}
```

### Step 6: Update character components

Each character component receives `gesture` prop. When gesture has wing overrides, replace wing `<m.path>` d attribute and animation. Wrap head elements in GestureLayer.

### Step 7: Thread gesture through Mascot.tsx

Pass `gesture` prop to each character and to duo/family sub-renders.

## Todo

- [ ] Add MascotGesture type to types.ts
- [ ] Add gesture prop to MascotProps
- [ ] Create gestures/ directory
- [ ] Create gesture-types.ts with GestureConfig interface
- [ ] Define BigOwl gesture configs (7 gestures)
- [ ] Scale configs for SmallOwl, DadOwl, SisterOwl, BabyOwl
- [ ] Create GestureLayer.tsx component
- [ ] Create gestures/index.ts barrel
- [ ] Update BigOwl.tsx to accept gesture, override wings
- [ ] Update SmallOwl.tsx
- [ ] Update DadOwl.tsx
- [ ] Update SisterOwl.tsx
- [ ] Update BabyOwl.tsx
- [ ] Update Mascot.tsx to thread gesture prop
- [ ] Test all 7 gestures on BigOwl
- [ ] Build passes with no errors

## Success Criteria

- All 7 gestures visually distinct
- Gestures work independently of state (any state + any gesture combo)
- Wing overrides smooth, no SVG glitches
- Head transforms natural-looking
- Backward compatible: gesture defaults to "none"
