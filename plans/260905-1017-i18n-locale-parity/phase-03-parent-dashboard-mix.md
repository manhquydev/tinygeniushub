---
title: "Phase 3: Parent dashboard mix"
status: todo
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 3: Parent dashboard mix

## Overview
User-reported `/parent/dashboard` MIXED: i18n chrome + EN feed/goal/referral form.

## Requirements
- Functional: owned components follow locale.
- Non-functional: keep client fetch; dates use locale.

## Architecture
`useTranslations`: `parent.dashboard.activity`, `parent.dashboard.goal`, `parent.referralClaim`.
`dashboard-referral-section.tsx`: pass `welcomeOffer` / `rewardVouchers` as values into `t.rich("description")`.
Dates: `useLocale()` instead of hardcoded `"vi-VN"`.
`{n}minute` → t("minutesLabel", { n }).

## Related Code Files
- Modify: `src/components/daily-activity-feed.tsx`
- Modify: `src/components/daily-goal-setter.tsx`
- Modify: `src/components/referral-claim-form.tsx`
- Modify: `src/components/parent/dashboard-referral-section.tsx`

## Implementation Steps
1. Replace every user-visible literal with t().
2. Locale-aware date/time formatters.
3. API `error.message` display as-is (phase 09); client fallback `unknownError`.
4. Split feed if still >200 lines after i18n.

## Todo
- [ ] Wire activity feed
- [ ] Wire goal setter
- [ ] Wire referral claim form
- [ ] Fix referral section ICU values

## Success Criteria
- [ ] `/parent/dashboard` + cookie vi: no English islands in feed/goal/referral form/referral description
- [ ] Nickname/lesson titles from DB unchanged

## Risk Assessment
Missed string stays EN. Signal: visual grep. Response: coordinator-only phase 01 key add.
