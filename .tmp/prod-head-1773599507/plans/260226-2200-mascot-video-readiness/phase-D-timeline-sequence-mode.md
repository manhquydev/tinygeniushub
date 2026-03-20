---
phase: D
title: "Timeline/Sequence Animation Mode"
status: pending
priority: P1
effort: 5h
dependencies: [A, B, C]
---

# Phase D: Timeline/Sequence Animation Mode

## Overview

Add animation mode system: `loop` (default/web), `once` (single play), `sequence` (chain of steps). Essential for video rendering where animations must play deterministically.

## Architecture

```
MascotProps
  ├── animationMode: "loop" | "once" | "sequence"
  ├── sequence?: MascotSequenceStep[]
  ├── onSequenceComplete?: () => void
  └── entryPreset? / exitPreset?

useMascotTimeline(sequence, fps)
  → currentStep: { state, gesture, actionProp }
  → progress: number (0-1 within step)
  → isComplete: boolean
```

## Files to Modify

- `src/components/mascot/types.ts` -- add animation mode types
- `src/components/mascot/Mascot.tsx` -- consume mode, drive state from timeline

## Files to Create

- `src/components/mascot/hooks/use-mascot-timeline.ts`
- `src/components/mascot/presets/entry-exit-presets.ts`

## Implementation Steps

### Step 1: Add types

```ts
export type MascotAnimationMode = "loop" | "once" | "sequence";

export interface MascotSequenceStep {
  state: MascotState;
  gesture?: MascotGesture;
  actionProp?: MascotActionProp;
  duration: number; // milliseconds
  entry?: EntryPreset;
  exit?: ExitPreset;
}

export type EntryPreset = "fly-in" | "bounce-in" | "fade-in" | "slide-in";
export type ExitPreset = "wave-out" | "fade-out" | "fly-out" | "slide-out";
```

Add to MascotProps:
```ts
animationMode?: MascotAnimationMode; // default "loop"
sequence?: MascotSequenceStep[];
onSequenceComplete?: () => void;
```

### Step 2: Create useMascotTimeline hook

```ts
export function useMascotTimeline(
  sequence: MascotSequenceStep[] | undefined,
  mode: MascotAnimationMode,
) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (mode !== "sequence" || !sequence?.length) return;
    if (stepIndex >= sequence.length) {
      setIsComplete(true);
      return;
    }

    const step = sequence[stepIndex];
    const timer = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, step.duration);

    return () => clearTimeout(timer);
  }, [mode, sequence, stepIndex]);

  if (mode !== "sequence" || !sequence?.length) {
    return { currentStep: null, stepIndex: 0, isComplete: false };
  }

  const currentStep = sequence[Math.min(stepIndex, sequence.length - 1)];
  return { currentStep, stepIndex, isComplete };
}
```

### Step 3: Create entry/exit presets

`presets/entry-exit-presets.ts`:
```ts
export const ENTRY_PRESETS = {
  "fly-in": {
    initial: { y: -200, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  "bounce-in": {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },
  "slide-in": {
    initial: { x: -150, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const EXIT_PRESETS = {
  "wave-out": {
    animate: { x: 150, opacity: 0 },
    transition: { duration: 0.6, ease: "easeIn" },
  },
  "fade-out": {
    animate: { opacity: 0 },
    transition: { duration: 0.5 },
  },
  "fly-out": {
    animate: { y: -200, opacity: 0 },
    transition: { duration: 0.5, ease: "easeIn" },
  },
  "slide-out": {
    animate: { x: 200, opacity: 0 },
    transition: { duration: 0.4, ease: "easeIn" },
  },
};
```

### Step 4: Update Mascot.tsx

When `animationMode === "once"`: remove `repeat: Infinity` from all transitions. Set `repeatCount: 0`.

When `animationMode === "sequence"`: use `useMascotTimeline` to drive `state`, `gesture`, `actionProp` from current step. Override props passed to character components.

```tsx
const { currentStep, isComplete } = useMascotTimeline(sequence, animationMode ?? "loop");

// Override state/gesture/actionProp when in sequence mode
const effectiveState = currentStep?.state ?? state;
const effectiveGesture = currentStep?.gesture ?? gesture ?? "none";
const effectiveActionProp = currentStep?.actionProp ?? actionProp;

// Call onSequenceComplete when done
useEffect(() => {
  if (isComplete && onSequenceComplete) onSequenceComplete();
}, [isComplete, onSequenceComplete]);
```

### Step 5: Modify getMainPose for non-loop modes

```ts
function getMainPose(state, motionLevel, mode = "loop") {
  // ... existing logic ...
  // If mode === "once", set repeat: 0 instead of Infinity
  if (mode === "once" && transition) {
    transition = { ...transition, repeat: 0 };
  }
  return { animate, transition };
}
```

## Todo

- [ ] Add MascotAnimationMode, MascotSequenceStep types
- [ ] Add EntryPreset, ExitPreset types
- [ ] Add animationMode, sequence, onSequenceComplete to MascotProps
- [ ] Create hooks/ directory
- [ ] Create use-mascot-timeline.ts
- [ ] Create presets/ directory
- [ ] Create entry-exit-presets.ts
- [ ] Update Mascot.tsx to consume timeline
- [ ] Update getMainPose for once/sequence modes
- [ ] Test: sequence of 3 steps plays through correctly
- [ ] Test: loop mode unchanged (backward compat)
- [ ] Test: once mode plays single cycle
- [ ] Build passes

## Success Criteria

- `loop` mode identical to current behavior
- `once` mode: animation plays once then holds final frame
- `sequence` mode: steps play in order, correct timing
- `onSequenceComplete` fires at end
- Entry/exit presets apply smooth transitions between steps
