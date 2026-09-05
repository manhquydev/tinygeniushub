# Cook Phase 01 — Catalog keys

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Files:** `locales/en/translation.json`, `locales/vi/translation.json`, `src/i18n/translator.test.ts`

## Outcome

Phase 01 only. Locale JSON now holds every semantic namespace later phases cite. EN/VI key trees match. No `src/` UI edits. No `generated.*` hashes. Interpolation is `{token}` only.

`translate("specialPages.notFound.title", undefined, "vi")` → `Không tìm thấy trang bạn cần`.

## Namespaces added

| Namespace | Notes |
|---|---|
| `specialPages.notFound` / `.error` / `.globalError` / `.loading` | Inventory leaves; `ctaBack` is "Go back" / "Quay lại", not "Come back" |
| `parent.dashboard.activity` / `.goal` | Inventory + `goal.unknownError` |
| `parent.referralClaim` | Inventory + generate/claim leftovers |
| `parent.childrenManager` | Nested add/list/errors/deleteModal |
| `parent.caregiver` | Invite chrome |
| `parent.reportsPanel` | Includes `chart` (weekly progress) |
| `parent.coursesPage` | Heading, filters, empty, buy CTA |
| `auth.form` / `auth.forgot` / `auth.reset` | Form bodies; page chrome `auth.login` unchanged |
| `admin.login.form` | Nested under existing `admin.login.metadataTitle` |
| `kid.lesson` | Correct/Incorrect/Done/sentenceProgress + intro/video/activity/completion/wizard |
| `kid.gardenHud` | **Required.** sharedGarden, skyGarden, cinematic, mission, navFeedback |
| `courses.filter` | SUBJECT/PROGRAM/PHASE/AGE/DURATION/SORT ids |
| `courses.banner` | Checkout status copy |
| `courses.catalog` / `courses.detail` | Listing + mounted detail chrome |
| `blog.chrome` | Listing/search/article/category; not CMS `titleVi` |
| `contact.form` / `giftCode.form` | New under existing hero |
| `waitlist.form` | Extended existing `sectionTitle` |
| `chrome.notifications` / `.parentGate` / `.impersonation` / `.mascotHub` / `.calendar` | Weekdays sun–sat; EN "Chat on Zalo" |
| `errors.*` | `payload` + `invalidPayload` + DomainError messages for phase 09 |

New leaves: **827**. Catalog totals: **6017** each locale.

## Parity method

1. In-memory Python leaf-path walk on additions (EN vs VI) before splice — 827/827, token sets equal.
2. Surgical JSON splice (unique markers). Did **not** `json.dump` the whole file (would expand compact `admin.nav`).
3. Post-write: `jq -r '[paths(scalars)|join(".")] \| sort'` on both files → **6017 / 6017**, `comm -3` empty.
4. Node walker: same path sets; required inventory keys present; no dotted `{tokens}`; no `generated.*` in new keys.
5. Focused test only: `pnpm exec vitest run src/i18n/translator.test.ts` — 5 passed, including `specialPages.notFound.title` en vs vi.

## Test assertion

`src/i18n/translator.test.ts`: EN title `The page you needed was not found`; VI `Không tìm thấy trang bạn cần`; not equal.

## Non-goals honored

No UI wiring. Existing `generated`, compact admin nav, and prior `specialPages.offline` / `parent.dashboard.hero` untouched.

## Unresolved

None blocking Phase 02–09. Residual avatar names (`kid-avatar-options`) stay out of catalog per phase 04.
