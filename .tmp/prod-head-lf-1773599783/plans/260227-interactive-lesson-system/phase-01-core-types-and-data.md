# Phase 1: Core Types & Data

## Context

- [Brainstorm](../reports/brainstorm-260227-interactive-lesson-no-video.md)
- [Mascot Types](../../src/components/mascot/types.ts)
- [Activity Types](../../src/modules/content/activity-types.ts)

## Overview

- **Priority:** P1 (foundation for all other phases)
- **Status:** complete
- **Effort:** 30 min

Define TypeScript types for interactive lesson steps and create 7 demo lesson data files with step definitions.

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/interactive-lesson/interactive-lesson-types.ts` | Step types, lesson data schema | ~80 |
| `src/components/interactive-lesson/data/demo-lesson-am-a.ts` | Lesson: Âm /a/ | ~60 |
| `src/components/interactive-lesson/data/demo-lesson-am-e.ts` | Lesson: Âm /e/ | ~60 |
| `src/components/interactive-lesson/data/demo-lesson-am-o.ts` | Lesson: Âm /o/ | ~60 |
| `src/components/interactive-lesson/data/demo-lesson-so-1-5.ts` | Lesson: Số 1-5 | ~60 |
| `src/components/interactive-lesson/data/demo-lesson-hinh-tron.ts` | Lesson: Hình tròn | ~60 |
| `src/components/interactive-lesson/data/demo-lesson-mau-sac.ts` | Lesson: Màu sắc | ~60 |
| `src/components/interactive-lesson/data/demo-lesson-dong-vat.ts` | Lesson: Động vật | ~60 |
| `src/components/interactive-lesson/data/index.ts` | Re-export all demo lessons | ~15 |

## Key Insights

- Reuse `MascotVariant`, `MascotState`, `MascotGesture`, `MascotActionProp` from mascot types
- Reuse `ActivitySpec`, `ActivityType` from activity-types
- Each lesson = array of 6 steps (hook, concept, demonstrate, activity, reinforce, celebrate)
- `reinforce` step is conditional (only shown if first activity attempt wrong), but still defined in data
- Audio URLs are placeholders: `/audio/lessons/{id}/step-{n}.mp3`

## Implementation Steps

1. Create `interactive-lesson-types.ts`:
   ```ts
   import type { MascotVariant, MascotState, MascotGesture, MascotActionProp } from "@/components/mascot/types";
   import type { ActivitySpec, ActivityType } from "@/modules/content/activity-types";

   export type InteractiveStepType = "hook" | "concept" | "demonstrate" | "activity" | "reinforce" | "celebrate";

   export interface InteractiveLessonMascotConfig {
     variant: MascotVariant;
     state: MascotState;
     gesture?: MascotGesture;
     actionProp?: MascotActionProp;
   }

   export interface InteractiveLessonStep {
     type: InteractiveStepType;
     mascot: InteractiveLessonMascotConfig;
     speech?: string;         // speech bubble text (max 4 words)
     keyword?: string;        // large keyword display
     keywords?: string[];     // example cards (demonstrate step)
     subtext?: string;        // supporting text
     audioUrl?: string;       // TTS audio file
     activity?: {
       type: ActivityType;
       prompt: string;
       spec: ActivitySpec;
       passCriteria: number;
     };
     autoAdvanceMs?: number;  // ms after audio ends (default: wait for tap)
   }

   export interface InteractiveLessonData {
     id: string;
     title: string;
     mascotVariant: MascotVariant;
     steps: InteractiveLessonStep[];
   }
   ```

2. Create 7 demo lesson data files. Each follows same pattern:
   - Step 0 (hook): mascot=small/happy, speech="Chào con!", no audio
   - Step 1 (concept): mascot=small/thinking+pointing, keyword=main concept, speech=instruction, audioUrl placeholder
   - Step 2 (demonstrate): mascot=small/curious>happy>proud, keywords=3 examples, audioUrl placeholder
   - Step 3 (activity): mascot=small/idle, activity spec (MCQ or FILL_BLANK), no audio
   - Step 4 (reinforce): mascot=small/thinking, re-show keyword, speech="Nhớ lại nào!", audioUrl placeholder
   - Step 5 (celebrate): mascot=small/celebrating, speech="Giỏi lắm!", autoAdvanceMs=3000

3. Create `data/index.ts` that re-exports all 7 lessons as `DEMO_LESSONS: InteractiveLessonData[]`

## Todo

- [x] Create `interactive-lesson-types.ts`
- [x] Create 7 demo lesson data files
- [x] Create `data/index.ts` barrel export
- [x] Verify TypeScript compiles

## Success Criteria

- All types compile without errors
- 7 demo lessons defined with valid step data
- Activity specs match existing `ActivitySpec` union type
