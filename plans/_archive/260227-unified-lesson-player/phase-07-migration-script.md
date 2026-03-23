# Phase 7: Migration Script

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- **Depends on:** Phase 1

Script to verify existing lessons work as VIDEO_ONLY with 0 segments.

## Context Links
- [Brainstorm: migration strategy](../reports/brainstorm-260227-unified-lesson-player.md) — "Big bang" approach

## Key Insights
- Existing lessons have 0 segments -> auto-detected as VIDEO_ONLY (no data migration needed)
- Script purpose: validate all lessons, optionally create segments for select lessons to test HYBRID mode
- No destructive changes — additive only

## Related Code Files

### Create
- `scripts/migrate-lessons-to-segments.ts`

## Implementation Steps

1. Create `scripts/migrate-lessons-to-segments.ts`
   - Connect to database via Prisma
   - List all lessons
   - For each lesson: verify it has videoSource or bunnyVideoId
   - Report: lessons with video (will be VIDEO_ONLY), lessons without video (no player change)
   - Optional `--create-sample-hybrid` flag: pick 1 lesson, create sample segments for testing
   - Optional `--verify` flag: for each lesson, simulate mode detection and report

2. Run script on staging database
3. Verify all existing lessons detected as VIDEO_ONLY
4. Test one lesson with sample segments -> detected as HYBRID

## TODO

- [ ] Create migration script
- [ ] Run on staging DB
- [ ] Verify all existing lessons = VIDEO_ONLY mode
- [ ] Test sample HYBRID lesson creation
- [ ] Document rollback (just delete LessonSegment rows)

## Success Criteria
- Script runs without errors
- All existing lessons correctly identified as VIDEO_ONLY
- Sample HYBRID lesson works in UnifiedLessonFlow
- No data loss or corruption

## Risk Assessment
- **Risk:** Script accidentally modifies existing data — Mitigation: read-only by default, --create-sample-hybrid requires explicit flag
