---
title: "Phase 4: Parent managers + courses"
status: completed
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 4: Parent managers + courses

## Overview
Children/reports MIXED (i18n header + EN panels). `/parent/courses` hardcoded EN.

## Requirements
Wire listed files to `parent.childrenManager`, `parent.caregiver`, `parent.reportsPanel`, `parent.coursesPage`.
Dates/currency: `useLocale()`; VND amount formatting with locale.

## Related Code Files
- Modify: `src/components/children-manager.tsx`
- Modify: `src/components/caregiver-manager.tsx`
- Modify: `src/components/reports-panel.tsx`
- Modify: `src/components/weekly-progress-chart.tsx`
- Modify: `src/app/(main)/parent/courses/page.tsx`

Do not edit `course-checkout-status-banner.tsx` (phase 07 exclusive). Do not edit children/reports page headers (already translate).

## Implementation Steps
1. Client managers: `useTranslations`.
2. Parent courses server page: `getLocale` + `translate(..., locale)` like billing.
3. Replace search placeholder and filter labels.
4. Do not split the existing 512-line courses page; string replace only.

## Todo
- [x] children-manager
- [x] caregiver-manager
- [x] reports-panel + weekly chart
- [x] parent courses page chrome (not banner)

## Success Criteria
- [x] `/parent/children` + vi: manager body Vietnamese
- [x] `/parent/reports` + vi: panel Vietnamese
- [x] `/parent/courses` + vi: heading/filters Vietnamese
- [x] Avatar labels from `kid-avatar-options.tsx` remain residual

## Residual accepted
`Basic Fox Cub` avatar names. Checkout banner language after phase 07.
