# Cook Phase 06 — Kid lesson leftover + garden HUD

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Mode:** code, phase 06 only. No locale JSON. No parental gates. No daily-goal-setter. Project-wide tests skipped.

## Outcome

`tgh_locale` now drives leftover lesson chrome and live garden/today HUD. `Sai` / `Xong` / `trong` gone from owned lesson files. Concat `Floor${n}` / `15minute` / `N/Mpost` replaced with `kid.gardenHud.*` `{token}` interpolation.

## Files

| File | Namespace |
|---|---|
| `src/components/lesson-player/panels/CompletionPanel.tsx` | `kid.lesson` / `.completion` |
| `src/components/lesson-player/panels/ActivityPanel.tsx` | `kid.lesson` / `.activity` |
| `src/components/lesson-player/panels/LessonIntroPanel.tsx` | `kid.lesson` / `.intro` / `.track` / `.minutes` |
| `src/components/lesson-player/panels/VideoPlayerPanel.tsx` | `kid.lesson.video` |
| `src/components/lesson-wizard/activity-renderer.tsx` | `kid.lesson.renderer` (`falseLabel` replaces `Sai`) |
| `src/components/lesson-wizard/lesson-wizard-flow.tsx` | `kid.lesson.wizard` + `kid.lesson.minutes` |
| `src/components/kid-shared-garden/KidSharedGardenDashboard.tsx` | `kid.gardenHud.sharedGarden` |
| `src/components/kid-sky-garden/KidSkyGardenScene.tsx` | `kid.gardenHud.skyGarden` |
| `src/components/kid-sky-garden/components/SeedPlantingCinematic.tsx` | `kid.gardenHud.cinematic` |
| `src/components/kid-mission-panel.tsx` | `kid.gardenHud.mission` |
| `src/components/kid-navigation-feedback.tsx` | `kid.gardenHud.navFeedback` |

Client components stay `"use client"`. Public props unchanged. Plot/journey helpers now return keys (`kind` / `labelKey` / `titleKey`); labels resolved at render.

## Interpolation

`{title}`, `{current}`, `{total}`, `{xp}`, `{coins}`, `{minutes}`, `{floor}`, `{percent}`, `{name}`, `{course}`, `{completed}`, `{count}`, `{objective}`, `{hint}`, `{lesson}` via `t(key, { token })`. No dotted tokens. No `generated.*`.

`tierLabel` is display-ready (`kid.gardenHud.skyGarden.floorLabel`). Completion subtitle is `${tierLabel} · ${t("completion.subtitle")}`; progress bar uses `tierLabel ?? t("completion.progress")` — does not wrap `subtitleWithFloor` / `progressFloor` (would double "Floor"/"Tầng").

## Verification

- Grep owned files: no `Sai` / `Xong` / `trong` / `Floor${` / `15minute`.
- `pnpm check:i18n`: no warnings on owned files. Command still fails on pre-existing `site-footer.test.tsx` / `translator.test.ts` / scripts (out of scope).
- `pnpm type-check`: no errors in owned files. Failures in `auth-form.tsx`, `course-checkout-status-banner.tsx`, `course-filter-sidebar.tsx` (other phases).
- Project-wide tests skipped per cook instruction.

## Review

`code-reviewer` (Opus) rate-limited. `reviewer` score **8/10**. Critical: none. Warning (doubled floor prefix) fixed as above.

Side effects called out, not regressions: BOM stripped on SeedPlantingCinematic; `EvidenceUploadLoading` extracted for wizard dynamic import. Existing `kid-mission-panel` / `kid-navigation-feedback` tests have no NextIntlClientProvider (pre-existing; tests skipped this cook).

## Non-goals honored

Did not edit `locales/*/translation.json`, parental gates (phase 08), daily-goal-setter (phase 03), `drawing-activity.tsx`, `LessonPlayerScene.tsx`. Did not split garden HUD files.

## Residual

Interactive-lesson demo data. LessonStartCard copy (not exclusive). ParentGateDialog internals.

## Unresolved

None blocking. `completion.subtitleWithFloor` / `completion.progressFloor` unused after display-ready `tierLabel`; leave catalog (phase 01).
