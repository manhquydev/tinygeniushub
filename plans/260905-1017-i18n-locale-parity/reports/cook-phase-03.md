# Cook Phase 03 — Parent dashboard mix

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Files:** `src/components/daily-activity-feed.tsx`, `src/components/daily-goal-setter.tsx`, `src/components/referral-claim-form.tsx`, `src/components/parent/dashboard-referral-section.tsx`

## Outcome

Phase 03 only. Owned dashboard mix surfaces consume existing keys. No locale JSON edits. No other UI files. Nickname + lesson titles stay DB text.

## Wiring

| Surface | Namespace | Notes |
|---|---|---|
| Activity feed | `parent.dashboard.activity` | `useTranslations` + `useLocale()`. Dates `locale === "vi" ? "vi-VN" : "en-US"`. Sort `localeCompare(..., locale)`. |
| Goal setter | `parent.dashboard.goal` | `{n}minute` → `t("minutesLabel", { n })`. Unlimited via `unlimited`. |
| Referral claim form | `parent.referralClaim` | Chrome + client fallbacks. |
| Referral section | `parent.dashboard.referral` | ICU values, not rich-tag fns. |

`t.rich("description", { welcomeOffer: t("welcomeOffer"), rewardVouchers: t("rewardVouchers") })`.

API `error.message` shown as-is (phase 09). Missing-body / non-Error → `unknownError` (feed also uses `loadError` / `updateError` / generate-claim fallbacks).

## Verification

- 37 consumed keys present in EN + VI.
- `translate` smoke:
  - EN description interpolates `welcome offer` / `reward vouchers`; no leftover `{token}`.
  - VI description: `ưu đãi chào mừng` / `phiếu thưởng`.
  - `minutesLabel` n=20 → `20 minutes` / `20 phút`.
  - VI headings: `Hoạt động học hôm nay`, `Nhập mã giới thiệu`.
- No Vietnamese diacritics in the four `src/` files.
- Project-wide tests skipped per cook instruction.

## Non-goals honored

Did not edit `locales/*/translation.json`. Did not invent keys. Did not split the feed: 274 lines, still over 200; a new file would violate exclusive ownership.

## Unresolved

Feed still >200 lines. Split deferred to a later exclusive-file change if coordinator allows a new component file.
