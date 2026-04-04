# Phase 3: Prisma Generate & Type Check

**Phase ID:** phase-03-prisma-generate  
**Priority:** P1 - CRITICAL  
**Estimated Time:** 1 hour  
**Dependencies:** Phase 2 Complete

---

## Overview

This phase generates the Prisma Client with the updated schema and runs TypeScript validation to catch any remaining type errors.

---

## Steps

### Step 3.1: Generate Prisma Client (5 min)

**Command:**
```bash
cd D:/project/cungcontuhoc && npx prisma generate
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client in 2.34s

✔ Prisma Client has been generated!
```

**If errors occur:**
- Check schema syntax
- Verify all models are properly closed with `}`
- Check for missing commas or semicolons

---

### Step 3.2: Initial TypeScript Check (10 min)

**Command:**
```bash
cd D:/project/cungcontuhoc && npx tsc --noEmit 2>&1 | head -50
```

**Expected:** No errors or only expected errors.

**If errors, categorize them:**

#### Error Type A: Missing Model Errors
```
error TS2339: Property 'abekaWatchProgress' does not exist on type...
```
→ Regenerate Prisma Client

#### Error Type B: Field Name Errors  
```
error TS2339: Property 'watchedMinutes' does not exist on type...
```
→ Update code to use correct field name

#### Error Type C: Type Import Errors
```
error TS2304: Cannot find name 'AbekaProgress'
```
→ Update type imports to use new model names

---

### Step 3.3: Fix Type Errors (30 min)

For each error:

**Example 1: Field Name Mismatch**
```typescript
// Error: Property 'watchedMinutes' does not exist
await prisma.abekaWatchProgress.create({
  data: {
    watchedMinutes: 15, // ❌ Wrong field name
  },
});
```

**Fix:**
```typescript
await prisma.abekaWatchProgress.create({
  data: {
    watchSeconds: 15 * 60, // ✅ Convert to seconds
  },
});
```

**Example 2: Missing Relation Field**
```typescript
// Error: Unknown field 'dailyPlan'
await prisma.abekaAssignment.create({
  data: {
    dailyPlanId: planId,
    dailyPlan: { connect: { id: planId } }, // ❌ May not need both
  },
});
```

**Fix:**
```typescript
await prisma.abekaAssignment.create({
  data: {
    dailyPlanId: planId, // ✅ Just the ID field
  },
});
```

**Example 3: Type Import**
```typescript
// Error: Cannot find name 'AbekaProgress'
import type { AbekaProgress } from '@prisma/client'; // ❌ Old name
```

**Fix:**
```typescript
import type { AbekaWatchProgress } from '@prisma/client'; // ✅ New name
```

---

### Step 3.4: Re-run Type Check (10 min)

**Command:**
```bash
cd D:/project/cungcontuhoc && npx tsc --noEmit
```

**Repeat Step 3.3 until clean.**

**Target:** Zero TypeScript errors

---

### Step 3.5: Verify Import Paths (5 min)

**Check Prisma Client imports:**

Files that import from Prisma:
```bash
grep -r "from '@prisma/client'" --include="*.ts" app/ src/ | head -20
```

Verify these imports include types that exist:
- ❌ `AbekaProgress` should not be imported
- ✅ `AbekaWatchProgress` should be available
- ✅ `AbekaBadge` should be available
- ✅ `ChildEarnedBadge` should be available
- ✅ All other new models should be available

---

## Deliverables

1. ✅ Prisma Client generated successfully
2. ✅ Zero TypeScript errors
3. ✅ All type imports working correctly
4. ✅ No references to old model types

---

## Verification Checklist

- [ ] `npx prisma generate` completed successfully
- [ ] Prisma Client generated in node_modules/@prisma/client
- [ ] `npx tsc --noEmit` shows zero errors
- [ ] All type imports from @prisma/client are valid
- [ ] No lingering references to `AbekaProgress` type

---

## Common TypeScript Errors & Solutions

### Error: Property does not exist
```
error TS2339: Property 'X' does not exist on type 'Y'
```
**Solution:** Check schema - field may have been renamed or removed.

### Error: Type not found
```
error TS2304: Cannot find name 'X'
```
**Solution:** Update import or type reference to use correct model name.

### Error: Argument type mismatch
```
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```
**Solution:** Check field types - may need type conversion (e.g., String() vs number).

---

## Notes

1. **Prisma generate must succeed first** - No point running TypeScript check if Prisma Client wasn't generated
2. **Fix errors iteratively** - Don't try to fix all at once, tackle them one by one
3. **Use IDE** - VS Code/IntelliJ will show red squiggles for type errors
4. **Check generated types** - Look in `node_modules/@prisma/client/index.d.ts` if unsure about field names

---

**Phase 3 Complete → Proceed to Phase 4: Database Verification**
