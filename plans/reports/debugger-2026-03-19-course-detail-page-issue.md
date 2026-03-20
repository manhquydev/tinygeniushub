# Debugger Report: Course Detail Page Cannot Be Viewed

**Date:** 2026-03-19
**Route:** `/courses/[slug]`
**File:** `src/app/(main)/courses/[slug]/page.tsx`

---

## Executive Summary

Course detail pages for `littlefox` and `littlefoxcn` are **broken** in Docker. Users clicking "Xem chi tiết khóa" from the courses listing page are permanently redirected to `/courses` instead of seeing the course detail. Root cause: `isLegacyBundleRouteSlug()` incorrectly includes `entryCourseSlug` values (`"littlefox"`, `"littlefoxcn"`) which ARE valid published standalone courses — causing them to be treated as legacy bundle URLs and redirected away.

---

## Docker Container Status

All containers healthy:

| Service | Status | Ports |
|---------|--------|-------|
| `cungcontuhoc-web-1` | Up, healthy | 3000->3000 |
| `cungcontuhoc-postgres-1` | Up, healthy | 5432->5432 |
| `cungcontuhoc-redis-1` | Up, healthy | 6379->6379 |
| `cungcontuhoc-worker-1` | Up | 3000 |

No crash loops. No OOM. No compile errors in logs.

---

## Error Logs

No server-side errors (500s) in logs. All requests return HTTP 200, including broken ones — because Next.js `permanentRedirect()` renders a redirect page with status 200 in dev/Docker mode.

Confirmed redirect behavior via response body:

```
GET /courses/littlefox  -> title: "Danh sách khóa học - Cùng Con Tự Học"  (wrong - should be course detail)
GET /courses/littlefoxcn -> title: "Danh sách khóa học - Cùng Con Tự Học" (wrong - should be course detail)
GET /courses/little-fox-en-level-1 -> 200 OK, title: "Little Fox EN Level 1" (correct)
GET /courses/abeka-g1 -> 200 OK, course detail (correct)
```

Courses listing page generates these broken links:

```html
href="/courses/littlefox"    <!-- permanently redirects to /courses -->
href="/courses/littlefoxcn"  <!-- permanently redirects to /courses -->
```

---

## Root Cause

### Chain of events

1. **`course-bundles.ts`** defines three bundles with `entryCourseSlug`:
   - `abeka` bundle → `entryCourseSlug: "abeka"`
   - `little-fox-en` bundle → `entryCourseSlug: "littlefox"`
   - `little-fox-cn` bundle → `entryCourseSlug: "littlefoxcn"`

2. **`legacy-bundle-routes.ts`** builds the legacy slug set:
   ```ts
   const explicitLegacyRouteSlugs = ["abeka", "little-fox-en", "little-fox-cn"];
   const entryCourseSlugs = listCourseBundles().map((bundle) => bundle.entryCourseSlug);
   // entryCourseSlugs = ["abeka", "littlefox", "littlefoxcn"]
   const legacyBundleRouteSlugSet = new Set([...explicitLegacyRouteSlugs, ...entryCourseSlugs]);
   // = {"abeka", "little-fox-en", "little-fox-cn", "littlefox", "littlefoxcn"}
   ```

3. **`/courses/[slug]/page.tsx`** checks:
   ```ts
   if (isLegacyBundleRouteSlug(slug)) {
     permanentRedirect("/courses");
   }
   ```
   `"littlefox"` and `"littlefoxcn"` match → redirected to `/courses`.

4. **`buildStorefrontVisibilitySet()`** determines visibility:
   - `little-fox-en` bundle: `canonicalSplitCourseSlugPrefixes = ["lfen-"]` — no `lfen-*` are published → `hasCanonicalSplitByBundleSlug.get("little-fox-en") = false` → `"littlefox"` is **visible** in the listing.
   - `little-fox-cn` bundle: `canonicalSplitCourseSlugPrefixes = ["lfcn-"]` — no `lfcn-*` are published → `"littlefoxcn"` is **visible** in the listing.

5. **Result:** Both `littlefox` and `littlefoxcn` appear on the courses listing page with links to `/courses/littlefox` and `/courses/littlefoxcn`, but those URLs redirect back to `/courses`. Users cannot view the detail pages.

### Why `abeka` is not broken

`abeka` bundle has `canonicalSplitCourseSlugPrefixes = ["abeka-"]`. Published courses `abeka-g1`, `abeka-g2`... exist → `hasCanonicalSplitByBundleSlug.get("abeka") = true` → `"abeka"` is **hidden** from the listing. So no listing link points to `/courses/abeka`. Redirect is never triggered from the UI for abeka.

---

## Database State (Relevant Slugs)

| slug | isPublished | Note |
|------|-------------|------|
| `littlefox` | `true` | Published, shown in listing, detail page broken |
| `littlefoxcn` | `true` | Published, shown in listing, detail page broken |
| `little-fox-en-level-1..9` | `true` | Working fine |
| `little-fox-cn-level-1..5` | `true` | Working fine |
| `abeka` | `true` | Hidden from listing (canonical splits exist), redirect OK |
| `abeka-g1..g12, k4, k5` | `true` | Working fine |
| `lfen-l1-*`, `lfcn-l1-*` | `false` | Correctly returns "not found" page |

---

## Recommended Fix

**File:** `src/modules/courses/legacy-bundle-routes.ts`

**Problem:** `entryCourseSlug` values are included in `legacyBundleRouteSlugSet` unconditionally. For `little-fox-en` and `little-fox-cn` bundles, the `entryCourseSlug` (`"littlefox"`, `"littlefoxcn"`) are real published courses — not legacy bundle route placeholders.

**Fix option A (minimal, safe):** Remove `entryCourseSlugs` from the legacy set entirely. The explicit list `["abeka", "little-fox-en", "little-fox-cn"]` already covers the true legacy bundle route slugs (the bundle-slug-based URLs). The `entryCourseSlug` addition appears to have been redundant.

```ts
// Before
const legacyBundleRouteSlugSet = new Set([...explicitLegacyRouteSlugs, ...entryCourseSlugs]);

// After
const legacyBundleRouteSlugSet = new Set(explicitLegacyRouteSlugs);
```

**Fix option B (precise):** Only add `entryCourseSlug` to the legacy set if it IS the same as one of the `explicitLegacyRouteSlugs` (i.e., for abeka where entryCourseSlug="abeka" which matches the bundle slug pattern).

Option A is recommended — simpler, no new logic, and the explicit list `["abeka", "little-fox-en", "little-fox-cn"]` is already correctly scoped to legacy bundle-level URLs.

**After fix:** `/courses/littlefox` and `/courses/littlefoxcn` will render full course detail pages instead of redirecting.

---

## Unresolved Questions

1. Was adding `entryCourseSlugs` to the legacy set intentional for `abeka` redirect? If so, only `"abeka"` should be included (not `"littlefox"` / `"littlefoxcn"`), and option B should be used instead.
2. Should `little-fox-en-level-1..9` be associated with `lfen-*` canonical split slugs, or are they independently managed? If `little-fox-en-level-*` are the canonical splits, the `canonicalSplitCourseSlugPrefixes` should include `"little-fox-en-level-"` to prevent double-listing with `littlefox`.
