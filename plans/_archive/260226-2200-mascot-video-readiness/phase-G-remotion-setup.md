---
phase: G
title: "Remotion Setup"
status: pending
priority: P1
effort: 6h
dependencies: [D]
---

# Phase G: Remotion Setup + Composition Wrappers

## Overview

Install Remotion v4, create composition wrappers for mascot components, and build a basic lesson template composition for video rendering.

## Files to Create

- `remotion/Root.tsx` -- Remotion entry point
- `remotion/remotion.config.ts` -- Remotion config
- `remotion/compositions/MascotScene.tsx` -- bridge component
- `remotion/compositions/LessonTemplate.tsx` -- lesson video template
- `remotion/index.ts` -- register compositions

## Implementation Steps

### Step 1: Install dependencies

```bash
npm install @remotion/core @remotion/cli @remotion/renderer
npm install -D @remotion/bundler
```

### Step 2: Create Remotion config

`remotion/remotion.config.ts`:
```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

### Step 3: Create MascotScene bridge component

Bridge between Remotion's frame-based rendering and mascot's motion/react animations.

```tsx
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Mascot } from "@/components/mascot/Mascot";
import type { MascotSequenceStep } from "@/components/mascot/types";

interface MascotSceneProps {
  sequence: MascotSequenceStep[];
  variant: MascotVariant;
  size?: number;
}

export function MascotScene({ sequence, variant, size = 300 }: MascotSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Resolve which step we're in based on accumulated durations
  let accumulated = 0;
  let currentStep = sequence[0];
  for (const step of sequence) {
    if (currentTimeMs < accumulated + step.duration) {
      currentStep = step;
      break;
    }
    accumulated += step.duration;
  }

  return (
    <Mascot
      variant={variant}
      state={currentStep.state}
      gesture={currentStep.gesture}
      actionProp={currentStep.actionProp}
      animationMode="once"
      size={size}
      motionLevel="full"
    />
  );
}
```

### Step 4: Create LessonTemplate composition

```tsx
import { Composition, Sequence } from "remotion";

// Basic structure: intro (3s) → content (variable) → quiz (5s) → outro (3s)
export function LessonTemplate({ title, sequence, variant }) {
  return (
    <>
      <Sequence from={0} durationInFrames={90}> {/* 3s intro */}
        <IntroScene title={title} variant={variant} />
      </Sequence>
      <Sequence from={90} durationInFrames={contentFrames}>
        <MascotScene sequence={sequence} variant={variant} />
      </Sequence>
      <Sequence from={90 + contentFrames} durationInFrames={90}>
        <OutroScene variant={variant} />
      </Sequence>
    </>
  );
}
```

### Step 5: Create Root.tsx

```tsx
import { Composition } from "remotion";
import { LessonTemplate } from "./compositions/LessonTemplate";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="LessonDemo"
        component={LessonTemplate}
        durationInFrames={900} // 30s at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Bai hoc so 1",
          variant: "big",
          sequence: [
            { state: "happy", gesture: "waving", duration: 3000 },
            { state: "thinking", gesture: "pointing", actionProp: "flashcard", duration: 5000 },
            { state: "celebrating", gesture: "clapping", duration: 3000 },
          ],
        }}
      />
    </>
  );
}
```

### Step 6: Add npm scripts

```json
{
  "scripts": {
    "remotion:preview": "remotion preview remotion/index.ts",
    "remotion:render": "remotion render remotion/index.ts LessonDemo out/lesson.mp4"
  }
}
```

### Step 7: Test motion/react compatibility

Key concern: Remotion renders frame-by-frame, motion/react uses real-time CSS springs. Need to verify:
- motion/react animations render correctly in Remotion's SSR environment
- If not, create adapter that converts motion props to Remotion's `interpolate()`

Fallback plan: for Remotion rendering, use `animationMode="once"` with CSS `animation-play-state` controlled by Remotion frame.

## Todo

- [ ] Install Remotion packages
- [ ] Create remotion/ directory structure
- [ ] Create remotion.config.ts
- [ ] Create MascotScene bridge component
- [ ] Create LessonTemplate composition
- [ ] Create Root.tsx with demo composition
- [ ] Add npm scripts
- [ ] Test Remotion preview renders mascot
- [ ] Test motion/react compatibility
- [ ] Render 30s demo video to MP4
- [ ] Build passes (both Next.js and Remotion)

## Success Criteria

- `npm run remotion:preview` shows mascot animation in Remotion studio
- `npm run remotion:render` outputs playable MP4
- Mascot expressions, gestures visible in rendered video
- No conflict between Next.js build and Remotion build

## Risk

- motion/react v12 may not work in Remotion's rendering context. Mitigation: test early, prepare CSS animation fallback.
