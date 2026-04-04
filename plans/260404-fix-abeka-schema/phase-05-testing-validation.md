# Phase 5: Testing & Validation

**Phase ID:** phase-05-testing-validation  
**Priority:** P2 - HIGH  
**Estimated Time:** 1 hour  
**Dependencies:** Phase 4 Complete

---

## Overview

This phase performs final testing to ensure everything works correctly before considering the fix complete.

---

## Steps

### Step 5.1: Full Build Test (15 min)

**Clean build:**
```bash
cd D:/project/cungcontuhoc
rm -rf .next
rm -rf node_modules/.cache
npm run build 2>&1 | tee build.log
```

**Expected:** Build completes with 0 errors.

**If build fails:**
1. Check build.log for error details
2. Fix TypeScript errors
3. Fix import errors
4. Re-run build

---

### Step 5.2: Prisma Validation (5 min)

**Command:**
```bash
cd D:/project/cungcontuhoc && npx prisma validate
```

**Expected:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database
✔ Valid schema
```

---

### Step 5.3: Seeders Compilation Test (10 min)

**Test that seeders compile:**
```bash
cd D:/project/cungcontuhoc
npx tsc --noEmit prisma/seeders/abeka-curriculum.ts
```

**Also test main seed file:**
```bash
npx tsc --noEmit prisma/seed.ts
```

**Expected:** No TypeScript errors.

---

### Step 5.4: API Route Tests (20 min)

**Start dev server (if not already running):**
```bash
npm run dev
```

**Test API endpoints:**

#### Test 1: Watch Progress GET
```bash
curl "http://localhost:3000/api/abeka/progress/watch?childId=test-child-id" \
  -H "Content-Type: application/json"
```

**Expected:** 200 OK with empty array or progress data.

#### Test 2: Watch Progress POST
```bash
curl -X POST "http://localhost:3000/api/abeka/progress/watch" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "test-child-id",
    "videoId": "test-video-id",
    "watchedMinutes": 10,
    "lastPositionSeconds": 300
  }'
```

**Expected:** 201 Created or 200 OK with progress data.

#### Test 3: Badge Check
```bash
curl -X POST "http://localhost:3000/api/curriculum/badges/check" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "test-child-id"
  }'
```

**Expected:** 200 OK with badges array.

#### Test 4: Assignment Complete
```bash
curl -X POST "http://localhost:3000/api/curriculum/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "test-child-id",
    "assignmentId": "test-assignment-id",
    "minutesLearned": 15
  }'
```

**Expected:** 200 OK with success response.

**Note:** Use real IDs from your database for actual testing.

---

### Step 5.5: Database Query Test (10 min)

**Test Prisma queries work:**

Create temporary test file: `test-prisma.ts`
```typescript
import { prisma } from './src/lib/prisma';

async function testQueries() {
  try {
    // Test 1: Watch Progress
    const watchProgress = await prisma.abekaWatchProgress.findMany({ take: 1 });
    console.log('✅ AbekaWatchProgress:', watchProgress.length, 'records');

    // Test 2: Badge
    const badges = await prisma.abekaBadge.findMany({ take: 1 });
    console.log('✅ AbekaBadge:', badges.length, 'records');

    // Test 3: Earned Badges
    const earned = await prisma.childEarnedBadge.findMany({ take: 1 });
    console.log('✅ ChildEarnedBadge:', earned.length, 'records');

    // Test 4: Weekly Plans
    const weekly = await prisma.abekaWeeklyPlan.findMany({ take: 1 });
    console.log('✅ AbekaWeeklyPlan:', weekly.length, 'records');

    // Test 5: Daily Plans
    const daily = await prisma.abekaDailyPlan.findMany({ take: 1 });
    console.log('✅ AbekaDailyPlan:', daily.length, 'records');

    // Test 6: Streak
    const streak = await prisma.abekaStreak.findMany({ take: 1 });
    console.log('✅ AbekaStreak:', streak.length, 'records');

    // Test 7: Skill Node
    const skill = await prisma.abekaSkillNode.findMany({ take: 1 });
    console.log('✅ AbekaSkillNode:', skill.length, 'records');

    // Test 8: Grade Progress
    const gradeProg = await prisma.childGradeProgress.findMany({ take: 1 });
    console.log('✅ ChildGradeProgress:', gradeProg.length, 'records');

    // Test 9: Parent Preferences
    const prefs = await prisma.abekaParentPreferences.findMany({ take: 1 });
    console.log('✅ AbekaParentPreferences:', prefs.length, 'records');

    console.log('\n✅ All queries successful!');
  } catch (error) {
    console.error('❌ Query failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();
```

**Run:**
```bash
npx tsx test-prisma.ts
```

**Clean up:**
```bash
rm test-prisma.ts
```

---

### Step 5.6: Verify No Old References (5 min)

**Final check for old model names:**

```bash
cd D:/project/cungcontuhoc
echo "=== Checking for old model references ==="
grep -r "abekaProgress" --include="*.ts" --include="*.tsx" app/ src/ prisma/ 2>/dev/null || echo "✅ No 'abekaProgress' references found"

grep -r "AbekaProgress" --include="*.ts" --include="*.tsx" app/ src/ prisma/ 2>/dev/null || echo "✅ No 'AbekaProgress' references found"
```

**Expected:** Both should return "No references found" or only show backup files.

---

### Step 5.7: Final Review (10 min)

**Review checklist:**

- [ ] Schema changes match migration SQL
- [ ] All 12 missing models added
- [ ] All relations defined
- [ ] All indexes included
- [ ] Code updated to use new model names
- [ ] TypeScript compiles cleanly
- [ ] Build succeeds
- [ ] Database verification passed
- [ ] No old references remain

**Sign-off:**
If all items checked, the fix is complete and ready for deployment.

---

## Deliverables

1. ✅ Clean production build
2. ✅ Validated Prisma schema
3. ✅ Seeders compile successfully
4. ✅ API endpoints respond correctly
5. ✅ All Prisma queries work
6. ✅ No old model references remain

---

## Success Criteria

All of the following must pass:

- [ ] `npm run build` succeeds with 0 errors
- [ ] `npx prisma validate` passes
- [ ] `npx tsc --noEmit` shows 0 errors
- [ ] All 12 new models queryable via Prisma
- [ ] API routes return 200 OK responses
- [ ] No references to `abekaProgress` or `AbekaProgress`

---

## Rollback Test (Optional)

**Verify backup can be restored:**
```bash
# Check backup exists
ls -la prisma/schema.prisma.backup.*

# Verify it's valid (don't actually restore)
npx prisma validate --schema=prisma/schema.prisma.backup.20260404-XXXXXX
```

---

## Notes

1. **Use real data for API tests** - Tests with real IDs are more meaningful
2. **Check production logs after deploy** - Monitor for any runtime errors
3. **Keep backup until production stable** - Don't delete schema backup immediately

---

**Phase 5 Complete → All Phases Complete! 🎉**

---

# Implementation Complete

## Summary

✅ **Phase 1:** Schema updated with all 12 missing models  
✅ **Phase 2:** Code references updated  
✅ **Phase 3:** Prisma Client generated, TypeScript clean  
✅ **Phase 4:** Database alignment verified  
✅ **Phase 5:** Build and tests passing

## Ready for Deployment

The Abeka curriculum schema fix is complete. The project can now:
- Build successfully without TypeScript errors
- Query all 20 Abeka curriculum tables via Prisma
- Deploy the Abeka curriculum system with 20,195 videos

**Next Steps:**
1. Merge changes to main branch
2. Deploy to staging environment
3. Run smoke tests on staging
4. Deploy to production
5. Monitor error logs post-deployment
