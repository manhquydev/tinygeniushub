---
title: "Phase 7: Marketing courses/blog/forms"
status: done
priority: P2
effort: "6h"
dependencies: [1]
---

# Phase 7: Marketing courses/blog/forms

## Overview
`/courses`, `/blog*` hardcoded EN. Contact/waitlist/gift forms EN. Exclusive owner of checkout banner and filter label constants.

## Related Code Files
- Modify: `src/app/(main)/courses/page.tsx`
- Modify: `src/lib/courses/course-filter-utils.ts`
- Modify: `src/components/courses/course-filter-sidebar.tsx`
- Modify: `src/components/courses/course-active-filters.tsx`
- Modify: `src/components/courses/course-sort-select.tsx`
- Modify: `src/components/courses/course-mobile-filter-trigger.tsx`
- Modify: `src/components/courses/course-checkout-status-banner.tsx`
- Modify: mounted `src/app/(main)/courses/[slug]/page.tsx` + mounted `course-detail-*.tsx` only
- Modify: `src/app/(main)/blog/page.tsx`, `blog/[slug]/page.tsx`, `blog/search/page.tsx`, `blog/category/[slug]/page.tsx`
- Modify: `src/components/blog/blog-card.tsx`, `blog-card-featured.tsx`, `blog-sidebar.tsx`
- Modify: `src/modules/blog/blog-category-labels.ts` — add locale arg; callers: blog pages + three cards/sidebar (this phase owns all)
- Modify: `src/components/contact-form.tsx`
- Modify: `src/app/(main)/waitlist/waitlist-form.tsx`
- Modify: `src/components/gift-code-form.tsx`

Do not change `post.titleVi` / `contentHtml`. Do not mount dead course-detail modules.

## Implementation Steps
1. Replace `SUBJECT_LABELS` etc. with locale-aware lookups using `courses.filter.*` keys (pass locale into helpers; grep callers — listed above).
2. Banner: `useTranslations("courses.banner")` so parent courses page (phase 04) inherits i18n without editing banner.
3. `getBlogCategoryDisplayName(category, locale)` uses `nameVi` when locale=vi else `nameEn` / slug map.
4. Forms: `useTranslations`.

## Todo
- [x] Filter utils + sidebar/sort/active/mobile
- [x] Checkout banner
- [x] Courses list + mounted detail
- [x] Blog chrome + category helper + cards/sidebar
- [x] Contact/waitlist/gift forms

## Success Criteria
- [x] `/courses` + vi: chrome and filters Vietnamese
- [x] `/blog` + vi: chrome Vietnamese; article body CMS VI
- [x] Banner on `/parent/courses` follows locale after this phase
- [x] Category names follow locale in cards and pages

## Risk Assessment
Filter helper signature change. All TS callers listed in this phase. Count: course-filter-utils consumers in `src/components/courses/*` + `src/app/(main)/courses/page.tsx`.
