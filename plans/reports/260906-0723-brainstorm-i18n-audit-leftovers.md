---
type: brainstorm
date: 2026-09-06
---

# Brainstorm: i18n audit leftovers (nghiệm thu nốt)

## Summary

Leftover-mix + residual-close shipped. Three nghiệm thu items still open. This delivery closes those only. No SEO prefixes, email, CMS, admin CRUD, or `generated.*` homepage rewrite.

## Contract

- **Outcome:** Curriculum daily-plan user chrome follows `tgh_locale`. Homepage JSON-LD `inLanguage` and FAQ/descriptions match cookie locale. `pnpm check:i18n` exits 0 without allowing diacritics in production `src/` UI.
- **Constraints:** Cookie locale. No URL prefix. Catalog EN/VI key parity. No diacritics in production `src/`. `translate()` / `useTranslations()`. Files ≤200 lines except pre-oversize `daily-plan-view.tsx`.
- **Non-goals:** Email HTML; blog `titleVi`; admin CRUD/`vi-VN` dates; `/en` `/vi` + hreflang; homepage `generated.*` H1; whole Abeka curriculum module; rewrite `subject-icon` globally beyond daily-plan display.
- **Acceptance:**
  - `tgh_locale=vi`: daily-plan hello/progress/lesson/minutes/buttons/empty/complete are Vietnamese; subject title not `getSubjectNameVi` fake-EN.
  - `tgh_locale=en`: those strings English.
  - Homepage JSON-LD `inLanguage` is `en` or `vi` from cookie; FAQ questions from catalog, not hardcoded EN.
  - `pnpm check:i18n` exit 0. Still fails if a non-test `src/` file gains diacritics.
  - `pnpm exec vitest run src/i18n/translator.test.ts` pass.

## Evidence

| Gap | Where | Now |
|---|---|---|
| Daily-plan mix | `daily-plan-view.tsx` | `t("done")` only. Still EN: Hello, Progress today, Lesson {n}, minutes, Review/Continue/Begin, Unable to load, Rewards, Congratulations. Date `enUS`. Title uses `getSubjectNameVi` (English words: Maths/Write/Work). |
| JSON-LD EN | `src/app/(main)/page.tsx` | `generateMetadata` locale-aware. JSON-LD still `inLanguage: "en"` + EN FAQ. |
| check:i18n | `scripts/check-vietnamese-encoding.mjs` | exit 1: `site-footer.test.tsx`, `scripts/i18n/add-parent-namespace.mjs`, `scripts/seed-local-open-access.ts`. Decoder also flags `\u` VI. Fixtures cannot stay and pass. |

## Approaches

### 1. Hold

Assume: leftover-mix acceptance already met.

Fails first: user asked xử lý nốt these three. Cheap abandon, wrong outcome.

### 2. Close the three gaps (recommended)

- Catalog `curriculum.dailyPlan.*` + `curriculum.subjects.*` + `metadata.jsonLd.*`
- Wire `daily-plan-view.tsx`; date `vi-VN` vs `en-US` from `useLocale()`
- `buildHomeJsonLd(locale)` from catalog; async homepage
- check:i18n skip `*.test.*`, `scripts/i18n/`, `seed-local-open-access.ts`

Assumption: daily-plan is the curriculum surface named in audit. Fails first if other Abeka pages still mix (out of scope).

### 3. Reopen residual non-goals

Email, CMS, admin, prefixes, `generated.*`. High cost. Contradicts leftover-mix lock.

## Recommendation

**Approach 2.** Smallest that matches "xử lý nốt". Next: plan + cook.

## Unresolved questions

None blocking. Abeka subject VI labels are product copy (Phonics stays Phonics vs "Đánh vần") — catalog can keep English subject names in both locales if no real VI names exist; chrome still localizes.
