# Phase 02: Unify Package Source of Truth

## Context Links
- `prisma/seeders/curriculum-packages.ts`
- `scripts/abeka/production-import.ts`
- `scripts/abeka/validate-import.ts`

## Overview
- Priority: Critical
- Status: Pending
- Goal: Make package data deterministic between docs, DB, API, and UI.

## Key Insights
- Existing package values in docs and seeder do not fully align.
- Allocation mismatch is currently severe on production.

## Requirements
- Exact 8 package codes.
- Exact grade/subject scope per package.
- Approved `videoCount` calculation rule.
- Approved pricing and display order.

## Architecture
- Canonical TS config -> seeder -> DB -> `/api/abeka/packages` response contract.

## Related Code Files
- Modify: `prisma/seeders/curriculum-packages.ts`
- Modify: `src/app/api/abeka/packages/route.ts`
- Modify: `docs/business/abeka-course-package-design.md`

## Implementation Steps
1. Refactor package seed to consume canonical constant.
2. Add strict validation for missing/duplicate package codes.
3. Add post-seed verification command to assert package parity.
4. Align API response fields with canonical data model.

## Todo List
- [ ] Canonical constant implemented
- [ ] Seeder idempotency verified
- [ ] API contract assertions added
- [ ] Documentation synced

## Success Criteria
- DB package rows and API package payload match canonical spec exactly.

## Risk Assessment
- Risk: accidental reset of subscriptions.
- Mitigation: no destructive reset in production without explicit migration strategy.

## Security Considerations
- Mutation scripts run with least-privilege DB user where possible.

## Next Steps
- Move to hierarchy repair and allocation recomputation in Phase 03.
