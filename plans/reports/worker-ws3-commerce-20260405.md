# WS3 Commerce Policy Update

## Decisions
- `0 VND` courses are now publishable.
- `resolveCourseDisplayPricing()` now marks zero-priced courses as `freeTemporary`.
- Admin publish checks now block only invalid sale windows, not non-purchasable zero-price courses.
- Checkout remains blocked for zero-amount courses, so no paid gateway transaction is created.

## Verification
- `pnpm type-check`
- `pnpm exec vitest run 'src/modules/courses/course-pricing.test.ts' 'src/app/api/admin/courses/[id]/publish/route.test.ts' 'src/app/api/admin/courses/[id]/route.test.ts'`

## Files Modified
- `src/modules/courses/course-pricing.ts`
- `src/modules/courses/course-pricing.test.ts`
- `src/app/api/admin/courses/[id]/publish/route.ts`
- `src/app/api/admin/courses/[id]/publish/route.test.ts`
- `src/app/api/admin/courses/[id]/route.ts`
- `src/app/api/admin/courses/[id]/route.test.ts`

## Unresolved Questions
- Do you want the storefront/admin copy surfaces outside this owned file set updated next, so `freeTemporary` is shown directly in the UI instead of only in pricing data and publish behavior?
