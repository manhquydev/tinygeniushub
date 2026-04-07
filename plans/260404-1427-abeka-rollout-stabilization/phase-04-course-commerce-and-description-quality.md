# Phase 04: Course Commerce and Description Quality

## Context Links
- `docs/MASTER-ABEKA-CURRICULUM-BUSINESS-PLAN.md`
- `docs/business/abeka-course-package-design.md`
- `src/app/api/courses/route.ts`

## Overview
- Priority: High
- Status: Pending
- Goal: Ensure rollout quality includes market-ready descriptions and commerce readiness.

## Key Insights
- Descriptions exist but business-grade metadata is incomplete in multiple entities.
- Course commercial fields are not production-ready (`priceVnd` zero across current set).

## Requirements
- Description quality gates by entity type.
- Pricing, cover image, subject, ageGroup readiness for published courses.
- Policy for legacy/source courses visibility.

## Architecture
- Content QA layer + publish eligibility rule in API/admin workflow.

## Related Code Files
- Modify: `src/modules/courses/course-service.ts`
- Modify: `src/app/api/courses/route.ts`
- Modify: admin content management screens/services for publish validation
- Modify: seed/content scripts for course metadata enrichment

## Implementation Steps
1. Define publish eligibility constraints for course catalog.
2. Enrich missing commercial metadata for published courses.
3. Add description length and quality lint checks.
4. Separate source-only records from storefront-visible records.

## Todo List
- [ ] Publish validator implemented
- [ ] Price/cover taxonomy backfill complete
- [ ] Description lint report generated
- [ ] Storefront sample QA approved

## Success Criteria
- Published courses meet metadata minimums.
- No zero-price accidental public offerings unless explicitly free.

## Risk Assessment
- Risk: accidental hiding of valid catalog items.
- Mitigation: staged publish flags and preview QA before go-live.

## Security Considerations
- Admin-only mutation endpoints remain protected.

## Next Steps
- Move to controlled production rollout gates in Phase 05.
