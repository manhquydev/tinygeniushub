# CODEX TASK: Phase B1 — Content Seeding + Missing Pages + Test Coverage

## Context

Cung Con Tu Hoc — EdTech platform for Vietnamese parents, children aged 2-6. Stack: Next.js 16 + React 19 + TypeScript, Prisma/PostgreSQL, Better Auth, Tailwind CSS v4.

**Study these files before starting — mandatory:**
- `README.md` — project overview and all commands
- `prisma/schema.prisma` — full DB schema (Track/Level/Unit/Lesson/Activity hierarchy)
- `prisma/seed.ts` — current seed (4 lessons only, need to expand)
- `src/modules/content/activity-types.ts` — ActivitySpec typed union (use this!)
- `src/app/(main)/` — existing page routes
- `plans/missing-pages/CODEX-MISSING-PAGES-PROMPT.md` — read this file fully before starting Task 2

---

## CRITICAL RULES

1. **Zero breaking changes** — all existing tests must pass
2. **Pass `pnpm type-check` after every task**
3. **All seed operations use `upsert`** — idempotent, safe to re-run
4. **UI copy: Vietnamese** — code/docs: English
5. **All activities use typed `ActivitySpec`** from `src/modules/content/activity-types.ts`

---

## TASK 1 — Expand Content Seed (English + Math Tracks)

**Goal:** Expand `prisma/seed.ts` — `seedContent()` function — from 4 lessons to a full learning structure with real, child-appropriate content.

### Structure to create:

```
ENGLISH track
└── Level 1: "Khám Phá Từ Đầu Tiên" (Discovery Words)
    ├── Unit 1: "Lời Chào & Gia Đình" (Hello & Family)
    │   ├── Lesson 1: "Hello & Bye Bye" (trial)
    │   ├── Lesson 2: "Mum, Dad, Baby" (trial)
    │   └── Lesson 3: "How Are You?" (paid)
    └── Unit 2: "Màu Sắc & Hình Dạng" (Colors & Shapes)
        ├── Lesson 4: "Red, Blue, Yellow" (trial)
        ├── Lesson 5: "Circle and Square" (paid)
        └── Lesson 6: "Big and Small" (paid)

MATH track
└── Level 1: "Những Con Số Kỳ Diệu" (Amazing Numbers)
    ├── Unit 1: "Đếm 1-5" (Count 1-5)
    │   ├── Lesson 1: "Count to 3" (trial)
    │   ├── Lesson 2: "Count to 5" (trial)
    │   └── Lesson 3: "Which is More?" (paid)
    └── Unit 2: "Hình Khối & Không Gian" (Shapes & Space)
        ├── Lesson 4: "Hình tròn & Hình vuông" (trial)
        ├── Lesson 5: "Lớn hơn & Nhỏ hơn" (paid)
        └── Lesson 6: "Cao hơn & Ngắn hơn" (paid)
```

### For each lesson, create:
- Lesson itself (with `offlineCardMarkdown` and `parentScriptMarkdown`)
- 1 activity per lesson using proper `ActivitySpec` types from `activity-types.ts`

### Activity specs — use these real patterns:

**English Lesson 1 "Hello & Bye Bye":**
```typescript
type: 'MULTIPLE_CHOICE',
spec: {
  type: 'MULTIPLE_CHOICE',
  question: 'Nghe và chọn đúng: Khi gặp bạn ta nói gì?',
  options: ['Hello!', 'Goodbye!', 'Thank you!', 'Sorry!'],
  correctIndex: 0,
  explanation: '"Hello" có nghĩa là "Xin chào" — dùng khi gặp bạn!'
}
```

**English Lesson 2 "Mum, Dad, Baby":**
```typescript
type: 'MATCH_PAIRS',
spec: {
  type: 'MATCH_PAIRS',
  pairs: [
    { left: 'Mum', right: 'Mẹ' },
    { left: 'Dad', right: 'Bố' },
    { left: 'Baby', right: 'Em bé' }
  ]
}
```

**English Lesson 3 "How Are You?":**
```typescript
type: 'FILL_BLANK',
spec: {
  type: 'FILL_BLANK',
  sentence: 'How ___ you?',
  answer: 'are',
  hint: 'Điền vào chỗ trống để hoàn thành câu hỏi!'
}
```

**English Lesson 4 "Red, Blue, Yellow":**
```typescript
type: 'MULTIPLE_CHOICE',
spec: {
  type: 'MULTIPLE_CHOICE',
  question: 'Màu của bầu trời là màu gì?',
  options: ['Red', 'Blue', 'Yellow', 'Green'],
  correctIndex: 1,
  explanation: 'Bầu trời màu xanh — "Blue" nghĩa là màu xanh dương!'
}
```

**Math Lesson 1 "Count to 3":**
```typescript
type: 'SORT_ORDER',
spec: {
  type: 'SORT_ORDER',
  items: ['Ba', 'Một', 'Hai'],
  correctOrder: [1, 2, 0]  // One, Two, Three
}
```

**Math Lesson 3 "Which is More?":**
```typescript
type: 'TRUE_FALSE',
spec: {
  type: 'TRUE_FALSE',
  statement: '5 nhiều hơn 3',
  isTrue: true,
  explanation: 'Đúng! 5 > 3. Năm kẹo nhiều hơn ba kẹo!'
}
```

For remaining lessons, create appropriate activities using the `ActivitySpec` types. **Do NOT use the old untyped `{ mode: "tap_choose", questions: 3 }` format.**

### Lesson content fields:

Each lesson should have:
```typescript
offlineCardMarkdown: `## ${title}\n\n**Mục tiêu:** ${objective}\n\n**Hoạt động offline:**\n- Dùng thẻ hình ảnh hoặc đồ vật thật\n- Lặp lại 3 lần cùng con\n- Khen khi con trả lời đúng`,
parentScriptMarkdown: `## Hướng Dẫn Ba Mẹ\n\n1. Ngồi cùng con, tắt TV/điện thoại\n2. Xem video bài ${title} cùng con\n3. Hỏi lại: "Con vừa học được gì?"\n4. Làm hoạt động offline với con`,
```

### After expanding seed, run:
```bash
pnpm db:seed
pnpm type-check
```

Verify seed ran without errors. `pnpm db:seed` must complete without throwing.

---

## TASK 2 — Missing Pages

**Read `plans/missing-pages/CODEX-MISSING-PAGES-PROMPT.md` fully before starting this task.**

Implement everything described in that file. The file contains the full spec for pages that are defined in the sitemap/nav but don't have proper implementations yet.

After implementing:
```bash
pnpm type-check
pnpm lint
```

---

## TASK 3 — Weekly Report Service Unit Tests

**Read these files first:**
- `src/modules/reports/weekly-report-service.ts`
- `src/modules/reports/__tests__/weekly-report-service.test.ts` (existing, may be partial)
- `src/modules/billing/__tests__/webhook-service.test.ts` — follow this mock pattern exactly

Add/complete these test cases in `src/modules/reports/__tests__/weekly-report-service.test.ts`:

```
Test cases required:

1. "no completions in week → minutesLearned: 0, lessonsCompleted: 0, streakDays: 0"
   - Mock: prisma.lessonCompletion.findMany returns []
   - Assert: report fields are all zero

2. "3 completions of 10 minutes each → minutesLearned: 30, lessonsCompleted: 3"  
   - Mock: 3 completions with minutesLearned: 10 each
   - Assert: report.minutesLearned === 30, report.lessonsCompleted === 3

3. "duplicate call for same childId + weekStart → returns existing, no duplicate insert"
   - Mock: prisma.weeklyReport.findUnique returns existing record on second call
   - Assert: prisma.weeklyReport.create called only once total (not twice)

4. "streakDays counts consecutive days, gap breaks streak"
   - Mock: completions on Monday/Tuesday/Thursday (gap on Wednesday)
   - Assert: streakDays === 2 (Tuesday streak breaks at Wednesday gap)
```

Pattern: use `vi.mock` for `@/lib/db` → mock prisma. Follow the exact same structure as `webhook-service.test.ts`.

After tests:
```bash
pnpm test
```

All tests must pass.

---

## TASK 4 — Caregiver Flow E2E Smoke Test

There is a new caregiver invite/accept flow implemented but with no E2E coverage.

Add to `scripts/e2e-smoke.mjs` (or create `scripts/e2e-caregiver.mjs` if cleaner):

```javascript
// Caregiver invite smoke test
// 1. Login as demo.parent@cungcontuhoc.vn
// 2. POST /api/caregivers/invite with { email: 'test.caregiver@example.com' }
// 3. Assert response 200 and has { inviteId, token }
// 4. GET /api/caregivers → assert the pending invite appears
// 5. Cleanup: DELETE or just assert count > 0

// Use the same fetch pattern as existing e2e scripts
// Do NOT use browser automation — pure API calls
```

Study `scripts/e2e-smoke.mjs` first. Match the exact style (auth headers, base URL from env, console output format).

After writing, run:
```bash
pnpm test:e2e (the smoke test file)
pnpm type-check
```

---

## FINAL VERIFICATION (run all in order)

```bash
pnpm db:seed          # Must complete without error
pnpm type-check       # Zero errors
pnpm lint             # Zero errors  
pnpm test             # All unit tests pass
pnpm test:e2e         # Smoke tests pass
pnpm security:baseline
pnpm release:check
```

---

## Priority Order

```
Task 1 (content seed) → Task 3 (report tests) → Task 2 (missing pages) → Task 4 (caregiver e2e)
```

Task 1 first — it's P0 for the product. Pass `pnpm type-check` after each task.
