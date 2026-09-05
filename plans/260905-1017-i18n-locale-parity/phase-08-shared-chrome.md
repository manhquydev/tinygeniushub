---
title: "Phase 8: Shared chrome"
status: todo
priority: P2
effort: "4h"
dependencies: [1]
---

# Phase 8: Shared chrome

## Overview
Nav labels already i18n. Remaining chrome: notifications, parent gates, impersonation, mascot hub MIXED Zalo, calendar always VI weekdays.

## Related Code Files
- Modify: `src/components/layout/notification-bell.tsx`
- Modify: `src/components/parent-notification-center.tsx`
- Modify: `src/components/parental-gate-modal.tsx`
- Modify: `src/components/parent-gate-dialog.tsx`
- Modify: `src/components/impersonation-banner.tsx`
- Modify: `src/components/mascot-support-hub.tsx`
- Modify: `src/components/ui/calendar.tsx` (weekday labels + date-fns locale from `useLocale`)
- Modify: `src/components/ui/dialog.tsx` / `sheet.tsx` sr-only Close → `common.actions.close` if cheap

Do not edit `app-nav.tsx` (already wired). Do not edit `daily-goal-setter.tsx`.

## Implementation Steps
1. `useTranslations` for chrome namespaces.
2. Calendar: `locale === "en"` → date-fns `enUS` + Sun/Mon; `vi` keep CN/T2.
3. Mascot hub: keep Zalo as brand; translate surrounding English; key for "Chat qua Zalo" so en can be "Chat on Zalo".
4. Notification timestamps: format with locale, space before unit.

## Todo
- [ ] Notification bell + parent notification center
- [ ] Both parent gates
- [ ] Impersonation banner
- [ ] Mascot hub MIXED
- [ ] Calendar locale

## Success Criteria
- [ ] Cookie en: calendar English weekdays
- [ ] Cookie vi: gates/notifications Vietnamese
- [ ] No `Chat qua Zalo` on en locale

## Risk Assessment
shadcn calendar used in admin. Switching locale globally is intended.
