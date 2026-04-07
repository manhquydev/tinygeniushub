# Phase 03: Fix Abeka Hierarchy and Allocation

## Context Links
- `prisma/schema.prisma`
- `scripts/abeka/production-import.ts`
- `scripts/abeka/validate-import.ts`

## Overview
- Priority: Critical
- Status: Pending
- Goal: Rebuild missing hierarchy (grade/subject/lesson/package) and correct package allocation math.

## Key Insights
- Production currently has `AbekaVideo` data but `AbekaLesson` is empty.
- This breaks pedagogical grouping and package count correctness.

## Requirements
- Complete hierarchy: Grade -> Subject -> Lesson -> LessonPackage -> Video.
- Deterministic allocation query per package.
- Quality checks for orphan rows and invalid grade levels.

## Architecture
- Import pipeline must produce relational completeness, not only raw video ingestion.

## Related Code Files
- Modify: `scripts/abeka/production-import.ts`
- Modify: `src/lib/abeka/import/service.ts`
- Modify: `src/lib/abeka/import/parser.ts`
- Add/Modify: verification SQL script under `scripts/abeka/`

## Implementation Steps
1. Audit current import path to identify dropped lesson/package creation.
2. Implement repair import mode for hierarchy backfill.
3. Recompute and persist package allocation counts from canonical rules.
4. Execute verification: no orphans, no invalid grade sentinel, counts within policy.

## Todo List
- [ ] Root cause in import pipeline confirmed
- [ ] Backfill mode implemented
- [ ] Allocation query validated
- [ ] Integrity checks pass on staging-like dry-run

## Success Criteria
- `AbekaLesson` and related tables populated as expected.
- Package declared counts match computed allocation.

## Risk Assessment
- Risk: long-running import in production.
- Mitigation: checkpoint + resume + bounded batch size + rollback point.

## Security Considerations
- Data mutation window controlled and logged.
- Backup verification required before execution.

## Next Steps
- Proceed to content/commerce quality remediation in Phase 04.
