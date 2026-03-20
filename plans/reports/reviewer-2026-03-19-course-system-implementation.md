# Code Review: Course System Implementation

**Date:** 2026-03-19
**Scope:** 6 files — course detail page, storefront tracking, course-service, analytics, blog types, blog form

---

## Code Review Summary

### Scope
- Files reviewed: 6
- Lines of code analyzed: ~900
- Review focus: TypeScript correctness, null handling, security, logic errors, import correctness

### Overall Assessment
One **critical bug** that will cause a runtime crash: `Course` model in Prisma schema is missing `subject` and `ageGroup` fields, but both `page.tsx` and `course-service.ts` read and query against them. There is also a **high-severity mismatch** between the `AgeGroup` union in `blog-types.ts` / `admin-blog-post-form.tsx` and the Prisma schema enum. Remaining issues are medium/low.

---

## Critical Issues

### 1. `Course` model missing `subject` and `ageGroup` columns — runtime crash

**Files:** `prisma/schema.prisma` lines 902–918, `course-service.ts` lines 566–608, `page.tsx` line 185

The `Course` model in schema.prisma has **no `subject` field and no `ageGroup` field**. However:

- `page.tsx` line 185 reads `course.subject` and `course.ageGroup` from the loaded course record.
- `page.tsx` line 40–52 `select` block references `subject` and `ageGroup` fields on `prisma.course.findUnique()`.
- `course-service.ts` `getRelatedCourses()` at lines 577–583 queries `{ subject: subject as never }` and `{ ageGroup: ageGroup as never }` against `Course`.
- `course-service.ts` `getStorefrontCourses()` at line 117 reads `row.ageGroup`.
- `StorefrontCourse` type (line 30) exposes `ageGroup: string | null` — relies on a non-existent DB column.

The `as never` cast in `getRelatedCourses` is a deliberate type suppression to silence the TS error, confirming the developer was aware of the mismatch but shipped it anyway. At runtime Prisma will throw because the columns do not exist in the database.

**Fix required:** Either add `subject String?` and `ageGroup String?` columns to the `Course` model and run a migration, OR remove the subject/ageGroup filter from `getRelatedCourses` and the page-level select/read until the migration lands. The `as never` casts must be removed.

---

## High Priority Findings

### 2. `AgeGroup` union in TypeScript diverges from Prisma enum

**Files:** `blog-types.ts` line 3, `admin-blog-post-form.tsx` line 32, `prisma/schema.prisma` lines 702–708

Prisma enum has 5 values:
```
UNDER_3 | AGE_3_5 | AGE_6_8 | AGE_9_12 | ALL_AGES
```

`blog-types.ts` `AgeGroup` union has 8 values:
```
UNDER_3 | AGE_3_5 | AGE_4_6 | AGE_6_8 | AGE_7_9 | AGE_9_12 | AGE_10_12 | ALL_AGES
```

The form in `admin-blog-post-form.tsx` renders `SelectItem` for all 8 values. Submitting `AGE_4_6`, `AGE_7_9`, or `AGE_10_12` will cause a Prisma validation error because those values are not in the DB enum. This is a data integrity bug that will surface as a save failure with no user-facing diagnostic.

Additionally `getAgeGroupLabel()` in the form only has cases for the 5 DB values — the 3 new values fall through to `default: return ageGroup` which returns the raw enum key as the displayed label.

**Fix required:** Either update the Prisma `AgeGroup` enum and run a migration to include the new values, OR revert `blog-types.ts` and the form to the 5-value set.

### 3. `getRelatedCourses` fallback behavior when both `subject` and `ageGroup` are null

**File:** `course-service.ts` lines 576–597

When both `subject` and `ageGroup` are null (which is always currently since the columns don't exist), the query becomes:
```ts
where: { isPublished: true, id: { not: courseId } }
```
This returns any 4 published courses ordered by `createdAt desc` — effectively unrelated courses. The result is silently wrong rather than returning an empty array. Acceptable only if `getRelatedCourses` is intentionally a best-effort fallback, but callers have no way to distinguish "related" from "random" results.

---

## Medium Priority Improvements

### 4. `BundleDetailViewTracker` passed hardcoded `tracks={1}` from page.tsx

**File:** `page.tsx` line 218
```tsx
<BundleDetailViewTracker variant={coursesVariant} bundleSlug={course.slug} tracks={1} lessons={course._count.lessons} />
```
`tracks` is always `1` regardless of how many tracks the bundle has. If analytics consumers rely on this field for funnel analysis, the data will be wrong for multi-track bundles. The actual track count is computable from `trackTotal` which is already available by line 154.

### 5. `tagIds` always sent as empty array

**File:** `admin-blog-post-form.tsx` lines 207–211, 231
```ts
const tagValues = tagsInput.split(",")...
void tagValues;
...
tagIds: [],
```
The parsed `tagValues` is immediately discarded with `void` and `tagIds: []` is hardcoded in the payload. Tags entered in the form are silently ignored on save. This is a known stub but represents data loss with no user warning.

### 6. `loadPublishedCourse` is React `cache()`-wrapped but `generateMetadata` and the page component both call it

**File:** `page.tsx` lines 37–75, 99, 129
The `cache()` wrapper deduplicates within a single request, which is correct. No bug here — just confirming this is intentional and working correctly.

### 7. `course-storefront-tracking.tsx` — tracker components fire on every render cycle change

**File:** `course-storefront-tracking.tsx` lines 61–68
All `useEffect` view tracker hooks list their props in the dependency array. This is correct — they re-fire only when props change. No bug, noted positively.

---

## Low Priority Suggestions

### 8. `as never` casts hide type errors instead of fixing them

**File:** `course-service.ts` lines 581–582
```ts
...(subject ? { subject: subject as never } : {}),
...(ageGroup ? { ageGroup: ageGroup as never } : {}),
```
Using `as never` to bypass TS type checking is a code smell that masked the schema mismatch in item #1. When the columns are added via migration, replace with properly typed filter.

### 9. `blog-types.ts` `AgeGroup` is a plain string union, not derived from Prisma

If Prisma enum is the source of truth, `AgeGroup` should be imported from `@prisma/client` rather than redeclared. Redeclaration means future schema changes won't surface as compile errors in the application layer.

---

## Positive Observations

- `loadPublishedCourse` correctly uses React `cache()` to avoid duplicate DB calls between `generateMetadata` and the page component.
- `track-event.ts` is well-typed with a discriminated `EventMap` that enforces correct params per event name.
- `buildStorefrontVisibilitySet()` is a clean functional approach to the monolith/split course visibility logic.
- `admin-blog-post-form.tsx` uses a `active` flag in `useEffect` to prevent state updates after unmount — correct pattern.
- Privacy: no secrets, credentials, or PII in any reviewed file.

---

## Recommended Actions

1. **[Blocking]** Add `subject String?` and `ageGroup String?` to the `Course` model in `schema.prisma` and generate + apply migration. Remove the `as never` casts once Prisma types are updated.
2. **[Blocking]** Align `AgeGroup` — either update the Prisma enum to include `AGE_4_6`, `AGE_7_9`, `AGE_10_12` and migrate, OR revert `blog-types.ts` and the form to match the current 5-value DB enum.
3. **[Medium]** Fix `tagIds: []` stub — either implement tag parsing from `tagsInput` or hide the tags input from the form until it is implemented.
4. **[Low]** Pass actual track count to `BundleDetailViewTracker` instead of hardcoded `1`.
5. **[Low]** Import `AgeGroup` from `@prisma/client` in `blog-types.ts` rather than redeclaring it.

---

## Metrics

- Type Coverage: Not measured; TypeScript errors actively suppressed with `as never`
- Test Coverage: Not assessed in this review
- Linting Issues: 0 style issues; 2 semantic suppressions (`as never`) masking schema gaps

---

## Unresolved Questions

1. Were `subject` and `ageGroup` fields intended to be added to `Course` in this PR but the schema migration was omitted, or are they placeholders for a future sprint?
2. Are the 3 new `AgeGroup` values (`AGE_4_6`, `AGE_7_9`, `AGE_10_12`) intentional additions requiring a migration, or were they added by mistake?
3. Is the `tagIds: []` stub intentional (tags deferred to a follow-up) or an accidental regression?
