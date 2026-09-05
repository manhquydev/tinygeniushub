---
title: "Phase 1: Catalog keys"
status: todo
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Catalog keys

## Overview
Add semantic EN+VI keys for every later phase. Only this phase edits locale JSON. Later phases fail closed if a key is missing.

## Requirements
- Functional: EN and VI trees identical for new namespaces; VI is real Vietnamese; EN is natural English (not calque like "Come back" unless existing common.actions.back).
- Non-functional: no `generated.*` hashes; `{token}` interpolation only (translator.ts does not support dotted tokens).

## Architecture
Mirror `specialPages.offline` and `parent.dashboard.hero`. Add sibling objects. Do not flatten.

## Related Code Files
- Modify: `locales/en/translation.json`
- Modify: `locales/vi/translation.json`
- Modify: `src/i18n/translator.test.ts` (assert one new key pair)

## Key inventory (must exist both locales)

`specialPages.notFound` `{badge,imageAlt,title,subtitle,ctaHome,ctaBack}`
`specialPages.error` `{badge,imageAlt,title,subtitle,ctaRetry,ctaBack}`
`specialPages.globalError` `{badge,imageAlt,title,subtitle,ctaReload,ctaHome}`
`specialPages.loading` `{ariaLabel,imageAlt,title,subtitle}`

`parent.dashboard.activity` `{heading,description,timezone,emptyProfiles,today,noLessons,restHint,minutesLearned,quiz,completedAt,loadError,unknownError}`
`parent.dashboard.goal` `{heading,reached,unlimited,minutesLabel,noLimit,updateError}`
`parent.referralClaim` `{heading,yourCode,notCreated,generate,creating,placeholder,submit,processing,unknownError}`

`parent.childrenManager` — all user-visible strings currently hardcoded in `children-manager.tsx` (heading, add form, errors, list actions). Use nested objects.
`parent.caregiver` — `caregiver-manager.tsx` chrome.
`parent.reportsPanel` — `reports-panel.tsx` + `weekly-progress-chart.tsx` chrome.
`parent.coursesPage` — `/parent/courses` chrome (heading, filters, empty, buy CTA).

`auth.form` — login/signup labels, buttons, client errors currently in `auth-form.tsx`.
`auth.forgot` / `auth.reset` / `admin.login.form` — matching forms.

`kid.lesson` — Correct/Incorrect (replace `Sai`), Done (replace `Xong!`), sentenceProgress (replace `trong`), intro/video/activity/completion CTAs.
`kid.gardenHud` — **required**. All user-visible strings in KidSharedGardenDashboard, KidSkyGardenScene, SeedPlantingCinematic, kid-mission-panel, kid-navigation-feedback.
`courses.filter` — SUBJECT_LABELS, PROGRAM_LABELS, PHASE_LABELS, AGE_GROUP_LABELS, DURATION_LABELS, SORT_OPTIONS in `course-filter-utils.ts`.
`courses.banner` — checkout status banner strings.

`courses.catalog` / `courses.detail` — listing+detail chrome (not CMS body).
`blog.chrome` — listing/search/article chrome (not `titleVi`).
`contact.form` / `waitlist.form` / `giftCode.form` — form fields (hero keys already exist).

`chrome.notifications` / `chrome.parentGate` / `chrome.impersonation` / `chrome.mascotHub` / `chrome.calendar` weekday keys if calendar switches locale.
`errors.payload` / keep using `errors.unknown` etc. for API — add only missing DomainError message keys under `errors.*` that phase 09 will call via `translate()`.

## Implementation Steps
1. Add keys to EN then copy structure to VI with real translations.
2. Diff key trees (script or `jq` paths) — must match.
3. Extend `translator.test.ts` for `specialPages.notFound.title` en vs vi.

## Todo
- [ ] Add specialPages notFound/error/globalError/loading
- [ ] Add parent nested namespaces listed above
- [ ] Add auth/kid/courses/blog/form/chrome/errors keys
- [ ] EN/VI key-tree parity check
- [ ] translator.test.ts new assertion

## Success Criteria
- [ ] Every key later phases cite exists in both files
- [ ] `translate("specialPages.notFound.title", undefined, "vi")` is Vietnamese
- [ ] No phase 02–09 needs to edit JSON

## Risk Assessment
Incomplete inventory → parallel cook blocked. Mitigation: grep hardcoded strings in owned files before finishing this phase; add leftovers here, not later.

Signal it broke: cook agent reports missing key returned as literal `parent.foo.bar`. Response: reopen phase 01 only.
