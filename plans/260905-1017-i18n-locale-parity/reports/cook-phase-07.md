# Cook Phase 07 — Marketing courses/blog/forms

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Mode:** code (accepted plan). Project-wide tests skipped (user). Locale JSON not edited.

## Outcome

Phase 07 only. Public `/courses`, mounted course-detail chrome, filter helpers/UI, checkout banner, blog chrome/cards/sidebar/category helper, contact/waitlist/gift forms consume existing catalog keys via `translate` / `useTranslations`. `tgh_locale=vi` drives Vietnamese chrome. CMS `titleVi` / `contentHtml` untouched. `parent/courses/page.tsx` untouched; banner i18n inherited.

## Contract changes

- `getCourseFilterLabel(group, key, locale)` — `courses.filter.*`. `SUBJECT_LABELS` / `SORT_OPTIONS` etc. removed. Key arrays remain for validation.
- `getBlogCategoryDisplayName(category, locale)` — `nameVi` when `vi`, else `nameEn`, else `blog.chrome.categories.{slug}`, else titleized slug.
- `CourseCheckoutStatusBanner` — `useTranslations("courses.banner")`.
- Contact subject **values** stay English (`Technical support`, …) for `/api/contact` `z.enum`. Labels translated.

## Files

- `src/lib/courses/course-filter-utils.ts`
- `src/components/courses/course-filter-sidebar.tsx`
- `src/components/courses/course-active-filters.tsx`
- `src/components/courses/course-sort-select.tsx`
- `src/components/courses/course-mobile-filter-trigger.tsx`
- `src/components/courses/course-checkout-status-banner.tsx`
- `src/app/(main)/courses/page.tsx`
- `src/app/(main)/courses/[slug]/page.tsx`
- `src/app/(main)/courses/[slug]/course-detail-hero.tsx` (async)
- `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx`
- `src/app/(main)/courses/[slug]/course-detail-faq.tsx` (async)
- `src/modules/blog/blog-category-labels.ts`
- `src/components/blog/blog-card.tsx`
- `src/components/blog/blog-card-featured.tsx`
- `src/components/blog/blog-sidebar.tsx`
- `src/app/(main)/blog/page.tsx`
- `src/app/(main)/blog/[slug]/page.tsx`
- `src/app/(main)/blog/search/page.tsx`
- `src/app/(main)/blog/category/[slug]/page.tsx`
- `src/components/contact-form.tsx`
- `src/app/(main)/waitlist/waitlist-form.tsx`
- `src/components/gift-code-form.tsx`

Forbidden untouched: `locales/*/translation.json`, `src/app/(main)/parent/courses/page.tsx`, dead unmounted `course-detail-*` modules, CMS body fields.

## Verification

- Helper smoke: `getCourseFilterLabel("subject","MATH","en"|"vi")` → `Math` / `Toán`.
- `getBlogCategoryDisplayName` vi → `nameVi`; empty `nameVi` → catalog `Phát triển trẻ`; en → `nameEn`.
- `parseFilterParams` still drops invalid keys.
- Exclusive-file `tsc` hits: 0.
- Diacritics grep on exclusive `src/` files: empty.
- Catalog smoke: 29 consumed keys present in EN and VI.

## Review

`code-reviewer` (Opus) rate-limited. Fallback `reviewer`: **8/10**. Critical: none. Applied warning: restored `/blog` `openGraph` on exclusive `generateMetadata`.

## Leftover EN (out of exclusive ownership)

- `course-card.tsx`, `course-pagination.tsx`, `course-breadcrumb.tsx`, `course-detail-sidebar.tsx`, `course-lesson-preview-modal.tsx`
- `blog-category-filter.tsx` sort chrome
- API `error.message` on contact/gift redeem (phase 09)

## Unresolved

None blocking Phase 07. Card/sidebar/preview leftover EN is other-file ownership, not this cook.
