# Cook Phase 08 — Shared chrome

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Files:** `src/components/layout/notification-bell.tsx`, `src/components/parent-notification-center.tsx`, `src/components/parental-gate-modal.tsx`, `src/components/parent-gate-dialog.tsx`, `src/components/impersonation-banner.tsx`, `src/components/mascot-support-hub.tsx`, `src/components/ui/calendar.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`

## Outcome

Phase 08 only. Shared chrome consumes existing `chrome.*` keys. No locale JSON edits. No `app-nav` / `daily-goal-setter`.

## Wiring

| Surface | Namespace | Notes |
|---|---|---|
| Notification bell | `chrome.notifications.bell` | Loading via `common.actions.loading`. Dates `locale === "vi" ? "vi-VN" : "en-US"`. Overflow `{count}+`. |
| Parent notification center | `chrome.notifications.center` + `.relative` | Relative `{count} minutes/hours ago` (space in catalog). Older dates locale-aware. Client fallbacks `loadError` / `unknownError` / `updateError` / `partialReadError`. |
| Parental gate modal | `chrome.parentGate.modal` | X via `common.actions.close`. |
| Parent gate dialog | `chrome.parentGate.dialog` | Prompt interpolates `{left}` `{right}`. |
| Impersonation banner | `chrome.impersonation` | `viewingAs` `{email}`. Fallback `stopError` / `unknownError`. |
| Mascot hub | `chrome.mascotHub` | Personas from catalog. EN `chatZalo` = `Chat on Zalo`. |
| Calendar | `chrome.calendar.weekdays` | `en` → date-fns `enUS` + Sun/Mon. `vi` → `vi` + CN/T2. Month header uses same locale. |
| Dialog / sheet Close | `common.actions.close` | sr-only. |

API `error.message` shown as-is (phase 09).

## Verification

- 61 `chrome.*` keys + `common.actions.close` / `loading` present in EN + VI. No missing-key fallbacks.
- `translate` smoke:
  - EN `chatZalo` = `Chat on Zalo`; VI = `Chat qua Zalo`.
  - EN weekdays `Sun`/`Mon`; VI `CN`/`T2`.
  - `minutesAgo` count=5 → `5 minutes ago`; `hoursAgo` count=2 VI → `2 giờ trước`.
  - Gate prompt 3×7 interpolates both locales; no leftover `{token}`.
  - Impersonation `Viewing as a@b.c` / `Đang xem với tư cách a@b.c`.
- No Vietnamese diacritics in exclusive `src/` files.
- ESLint on exclusive files: 0 errors. Pre-existing unused-var warnings (`isAdminRoute`, calendar `isBefore`/`startOfDay`/`mode`) unchanged.
- Project-wide tests skipped per cook instruction.

## Non-goals honored

Did not edit `locales/*/translation.json`. Did not invent keys. Did not edit `app-nav.tsx` or `daily-goal-setter.tsx`. Did not split mascot hub / notification center (already over 200 lines; new file would violate exclusive ownership).

## Unresolved

- `mascot-support-hub.tsx` 433 lines, `parent-notification-center.tsx` 356 lines. Split deferred.
- `chrome.mascotHub.tooltipFallback` unused; tooltip uses active persona message.
- `pnpm check:i18n` still warns on pre-existing `site-footer.test.tsx` / translator test / seed scripts — not phase 08 files.
- User-visible API `error.message` remains phase 09.
