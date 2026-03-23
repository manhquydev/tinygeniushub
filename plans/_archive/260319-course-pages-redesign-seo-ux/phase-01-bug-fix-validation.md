---
status: completed
priority: P1
effort: 1h
---

# Phase 1: Bug Fix + Validation

## Context
- Fix already applied in `src/modules/courses/legacy-bundle-routes.ts`
- Removed `entryCourseSlugs` from legacy set so `/courses/littlefox` and `/courses/littlefoxcn` resolve correctly

## Completed
- [x] `legacy-bundle-routes.ts` now only contains explicit legacy slugs: `["abeka", "little-fox-en", "little-fox-cn"]`
- [x] Entry course slugs (`littlefox`, `littlefoxcn`) no longer redirect to `/courses`

## Remaining: Regression Test

### File to Create
- `src/modules/courses/__tests__/legacy-bundle-routes.test.ts`

### Test Cases
1. `isLegacyBundleRouteSlug("abeka")` returns `true`
2. `isLegacyBundleRouteSlug("little-fox-en")` returns `true`
3. `isLegacyBundleRouteSlug("little-fox-cn")` returns `true`
4. `isLegacyBundleRouteSlug("littlefox")` returns `false` (entry course, not legacy)
5. `isLegacyBundleRouteSlug("littlefoxcn")` returns `false`
6. `isLegacyBundleRouteSlug("lfen-level-1")` returns `false` (canonical split)
7. `isLegacyBundleRouteSlug("random-slug")` returns `false`

## Success Criteria
- All 7 test cases pass
- No regressions in `/courses/[slug]` routing
