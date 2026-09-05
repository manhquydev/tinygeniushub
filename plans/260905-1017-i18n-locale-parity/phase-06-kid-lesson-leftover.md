---
title: "Phase 6: Kid lesson leftover"
status: todo
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 6: Kid lesson leftover + garden HUD

## Overview
Remove MIXED leftover VI tokens in lesson stack and wire live garden/today HUD (HOLD SCOPE from audit).

## Related Code Files
- Modify: `src/components/lesson-player/panels/CompletionPanel.tsx`
- Modify: `src/components/lesson-player/panels/ActivityPanel.tsx`
- Modify: `src/components/lesson-player/panels/LessonIntroPanel.tsx`
- Modify: `src/components/lesson-player/panels/VideoPlayerPanel.tsx`
- Modify: `src/components/lesson-wizard/activity-renderer.tsx`
- Modify: `src/components/lesson-wizard/lesson-wizard-flow.tsx`
- Modify: `src/components/kid-shared-garden/KidSharedGardenDashboard.tsx`
- Modify: `src/components/kid-sky-garden/KidSkyGardenScene.tsx`
- Modify: `src/components/kid-sky-garden/components/SeedPlantingCinematic.tsx`
- Modify: `src/components/kid-mission-panel.tsx`
- Modify: `src/components/kid-navigation-feedback.tsx`

Do not edit parental gates (phase 08) or daily-goal-setter (phase 03).

## Implementation Steps
1. Replace `Sai` / `Xong!` / `Xong ✓` / `trong` with `kid.lesson.*`.
2. Wire remaining lesson CTAs.
3. Wire garden/today HUD via `kid.gardenHud.*`. Fix concat `15minute` / `Floor${n}` with interpolation.
4. Keep client components.

## Todo
- [ ] Lesson panels + wizard
- [ ] Garden dashboard + sky garden + cinematic
- [ ] Mission panel + nav feedback

## Success Criteria
- [ ] No `Sai` / `Xong` / `trong` in owned lesson files
- [ ] `/kid/garden` and `/kid/today` HUD follow locale
- [ ] Lesson chrome follows locale

## Residual
Parental gates (08), daily-goal-setter (03), interactive-lesson demo data.

## Risk Assessment
Large HUD files. Split if exceeding 200 lines **after** i18n if the file was already over — do not drive a garden rewrite.
