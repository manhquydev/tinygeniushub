# Quick Reference: Abeka Schema Fix

**Plan Location:** `plans/260404-fix-abeka-schema/`  
**Status:** Ready for Implementation  
**Total Effort:** 6 hours

---

## Files Created

| File | Purpose |
|------|---------|
| `plan.md` | Master plan with full context |
| `phase-01-schema-update.md` | Add 12 missing models to Prisma schema |
| `phase-02-code-migration.md` | Update code references from abekaProgress to abekaWatchProgress |
| `phase-03-prisma-generate.md` | Generate Prisma Client and fix type errors |
| `phase-04-database-verification.md` | Verify schema matches database |
| `phase-05-testing-validation.md` | Build test and final validation |

---

## Models to Add (12)

1. ✅ **AbekaWatchProgress** (rename from AbekaProgress + add fields)
2. ✅ **AbekaBadge** - badge definitions
3. ✅ **ChildEarnedBadge** - badges earned by children
4. ✅ **AbekaWeeklyPlan** - weekly learning plans
5. ✅ **AbekaDailyPlan** - daily learning schedules
6. ✅ **AbekaStreak** - streak tracking
7. ✅ **AbekaStreakHistory** - streak history records
8. ✅ **AbekaSkillNode** - skill tree nodes
9. ✅ **AbekaSkillPrerequisite** - skill dependencies
10. ✅ **ChildSkillProgress** - child's skill progress
11. ✅ **ChildGradeProgress** - grade-level progress
12. ✅ **AbekaParentPreferences** - parent settings

---

## Key Changes

### Schema Changes
- Rename `AbekaProgress` → `AbekaWatchProgress`
- Add fields: `watchPercent`, `watchSeconds`, `durationSeconds`, `lastPosition`
- Remove fields: `watchedMinutes`, `watchCount`, `gradeId`, `lessonId`, `subjectCode`
- Add 12 new complete models with relations

### Code Changes
- `app/api/abeka/progress/watch/route.ts` - 4 references
- `app/api/curriculum/complete/route.ts` - field name updates
- Verify other files already use correct names

### Relation Updates
- ChildProfile → add 5 new relation fields
- ParentAccount → add 1 relation field
- AbekaGrade → add 2 relation fields
- AbekaLearningJourney → add 1 relation field
- AbekaVideo → rename relation field

---

## Implementation Order

1. **Phase 1** (2h) - Update schema.prisma
2. **Phase 2** (1.5h) - Update code references
3. **Phase 3** (1h) - Generate Prisma, fix types
4. **Phase 4** (0.5h) - Verify database
5. **Phase 5** (1h) - Build & test

---

## Critical Commands

```bash
# Validate schema
npx prisma validate

# Generate client
npx prisma generate

# Type check
npx tsc --noEmit

# Build
npm run build

# Check migration status
npx prisma migrate status
```

---

## Risk: HIGH

This fix blocks production deployment of the Abeka curriculum system with 20,195 videos. Immediate implementation required.

---

## Unresolved Questions

1. Are there any other files referencing `abekaProgress` not in the affected list?
2. Should the `activityMinutes` field in streak history be populated with actual data?
3. Do any existing rows in AbekaProgress table need data migration?

---

**Created:** 2026-04-04  
**Ready for:** Implementation
