# CODEX TASK: Phase A — Development Completeness Sprint

## Context

You are working on **Cung Con Tu Hoc** — an EdTech platform for Vietnamese parents helping children aged 2-6 learn at home. Stack: Next.js 16 + React 19 + TypeScript, Prisma/PostgreSQL, Redis/BullMQ, Better Auth, Tailwind CSS v4.

**Study these files before starting — mandatory:**
- `README.md` — full project overview, all existing endpoints, all quality commands
- `prisma/schema.prisma` — full DB schema (818 lines, 35+ models)
- `src/modules/` — all existing service/repository patterns (follow exactly)
- `src/app/api/` — existing API route patterns (follow exactly)
- `src/lib/rate-limit.ts` — rate limiting foundation
- `src/lib/security/csrf.ts` — CSRF pattern
- `src/app/globals.css` — design tokens and CSS variables
- `plans/2026-02-21-consistency-hardening-phase2.md` — current in-progress workstreams

**All providers stay in mock mode** — do NOT wire Stripe, Resend, or R2 real credentials. Focus on development completeness only.

---

## CRITICAL RULES (apply to ALL phases)

1. **Zero breaking changes** — all existing tests and endpoints must continue to pass
2. **Pass `pnpm type-check` after EVERY phase** before proceeding
3. **Follow existing code patterns** — study existing modules before writing anything new
4. **Use `'use client'` ONLY when necessary** — default to Server Components
5. **Do NOT modify existing Prisma models** — only add fields or new models if needed
6. **All UI copy in Vietnamese** — docs/code comments in English

---

## WORKSTREAM 1 — Watch Session Hardening (WS1.6) — COMPLETE THE IN-PROGRESS TASK

Status: In Progress (partially done). Study existing code first.

**Read these files:**
- `src/app/api/lessons/[lessonId]/watch/session/route.ts`
- `src/app/api/lessons/[lessonId]/watch/heartbeat/route.ts`
- `src/modules/learning/video-watch-service.ts`
- `src/modules/learning/__tests__/video-watch-service.test.ts`

**Remaining tasks:**

### 1.1 — Verify Rate Limits on Watch Endpoints

Check if `src/app/api/lessons/[lessonId]/watch/session/route.ts` and `src/app/api/lessons/[lessonId]/watch/heartbeat/route.ts` call `enforceRateLimit`. If missing, add:

```typescript
// In session route — per-parent limit: 20 new sessions/hour
await enforceRateLimit(request, { key: `watch-session:${parentId}`, limit: 20, windowMs: 60 * 60 * 1000, storeFailureMode: 'deny' })

// In heartbeat route — per-child limit: 120 heartbeats/hour (every 30s = 120/hr)
await enforceRateLimit(request, { key: `watch-hb:${childId}`, limit: 120, windowMs: 60 * 60 * 1000 })
```

Follow the exact `enforceRateLimit` call pattern from `src/app/api/auth/login/route.ts` or similar.

### 1.2 — Anti-Replay TTL enforcement

In `video-watch-service.ts`, verify the watch-session token:
- Has a TTL of `WATCH_SESSION_TTL_SECONDS` (from env, default 3600)
- Is validated for context match: `lessonId`, `childId`, `parentId` must all match the token claims
- Anti-replay: after token use (on `watch` completion), the token must be invalidated in Redis

If the above is not implemented, implement it now following the existing `jose` + Redis pattern in the file.

### 1.3 — Unit Tests

In `src/modules/learning/__tests__/video-watch-service.test.ts`, add tests for:
- TTL expiry scenario (expired token returns 401)
- Context mismatch (wrong childId returns 403)
- Replay attack (same token used twice returns 409)

**After WS1:** `pnpm type-check && pnpm test`

---

## WORKSTREAM 2 — EvidenceMedia Upload Lifecycle (WS2)

Status: Planned. Schema exists, lifecycle tracking is missing.

**Read these files:**
- `prisma/schema.prisma` — `EvidenceMedia` model
- `src/app/api/evidence/media/upload-url/route.ts`
- `src/modules/platform/` — storage adapter pattern
- `src/components/evidence-upload-panel.tsx`

### 2.1 — Add Upload Status to Schema

Add to `EvidenceMedia` model in `prisma/schema.prisma`:

```prisma
model EvidenceMedia {
  // ... existing fields ...
  uploadStatus   String   @default("PENDING")  // PENDING | UPLOADED | FAILED
  uploadedAt     DateTime?
  // ... rest of existing fields ...
}
```

Run migration:
```bash
pnpm db:migrate --name add-evidence-media-upload-status
pnpm db:generate
```

### 2.2 — Upload Completion API

Create `src/app/api/evidence/media/[mediaId]/confirm/route.ts` — POST (auth required):
1. Authenticate parent via Better Auth session
2. Find `EvidenceMedia` by `mediaId` — verify `uploadedByParentId` matches current parent
3. Check object exists in storage using `storageAdapter.objectExists(objectPath)` (add method to storage adapter if missing — mock implementation returns `true`)
4. Update `EvidenceMedia`: `{ uploadStatus: 'UPLOADED', uploadedAt: new Date() }`
5. Return `{ ok: true, mediaId }`

Storage adapter mock — add to `src/modules/platform/storage-adapter.ts` (or equivalent):
```typescript
async objectExists(objectPath: string): Promise<boolean> {
  if (provider === 'mock_r2') return true  // Mock always confirms
  // Real R2: use HeadObject request
}
```

### 2.3 — Cleanup Cron for Stale PENDING Records

Create `src/app/api/cron/cleanup-pending-media/route.ts` — GET:
1. Verify `CRON_SECRET` (copy pattern from `src/app/api/cron/weekly-reports/route.ts`)
2. Delete `EvidenceMedia` where `uploadStatus = 'PENDING'` AND `createdAt < now() - 2 hours`:
   ```typescript
   const deleted = await prisma.evidenceMedia.deleteMany({
     where: {
       uploadStatus: 'PENDING',
       createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
     }
   })
   ```
3. Return `{ deleted: deleted.count }`

Add to `vercel.json` crons array:
```json
{ "path": "/api/cron/cleanup-pending-media", "schedule": "0 * * * *" }
```

### 2.4 — Wire Frontend

In `src/components/evidence-upload-panel.tsx`, after the S3 PUT upload completes, call:
```typescript
await fetch(`/api/evidence/media/${mediaId}/confirm`, { method: 'POST' })
```

**After WS2:** `pnpm type-check && pnpm lint`

---

## WORKSTREAM 3 — Activity Type System (Technical Debt Fix)

Status: Technical debt — `Activity.type` is untyped `String` and `spec` is untyped `Json`.

**Read:** `prisma/schema.prisma` — `Activity` model, `src/modules/content/service.ts`

### 3.1 — TypeScript Activity Spec Types

Create `src/modules/content/activity-types.ts`:

```typescript
export type ActivityType = 
  | 'MULTIPLE_CHOICE'   // Pick one correct answer
  | 'TRUE_FALSE'         // Boolean question
  | 'FILL_BLANK'         // Fill in the missing word
  | 'MATCH_PAIRS'        // Match left to right
  | 'SORT_ORDER'         // Sort items in correct order
  | 'LISTEN_IDENTIFY'    // Listen audio, identify answer

export interface MultipleChoiceSpec {
  type: 'MULTIPLE_CHOICE'
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export interface TrueFalseSpec {
  type: 'TRUE_FALSE'
  statement: string
  isTrue: boolean
  explanation?: string
}

export interface FillBlankSpec {
  type: 'FILL_BLANK'
  sentence: string  // Use ___ for blank
  answer: string
  hint?: string
}

export interface MatchPairsSpec {
  type: 'MATCH_PAIRS'
  pairs: { left: string; right: string }[]
}

export interface SortOrderSpec {
  type: 'SORT_ORDER'
  items: string[]
  correctOrder: number[]
}

export interface ListenIdentifySpec {
  type: 'LISTEN_IDENTIFY'
  audioUrl: string
  question: string
  options: string[]
  correctIndex: number
}

export type ActivitySpec =
  | MultipleChoiceSpec
  | TrueFalseSpec
  | FillBlankSpec
  | MatchPairsSpec
  | SortOrderSpec
  | ListenIdentifySpec

export function parseActivitySpec(raw: unknown): ActivitySpec {
  const spec = raw as Record<string, unknown>
  if (!spec || typeof spec.type !== 'string') {
    throw new Error('Invalid activity spec: missing type')
  }
  // Type narrowing by discriminant
  return spec as ActivitySpec
}
```

### 3.2 — Wire Types into Content Service

In `src/modules/content/service.ts` (or wherever activities are returned from DB), import `parseActivitySpec` and cast the `spec` JSON through it before returning to callers.

Ensure `kid-mission-panel.tsx` and any quiz rendering components use `ActivitySpec` type properly.

**After WS3:** `pnpm type-check`

---

## WORKSTREAM 4 — Parent Progress Visualization

Status: `reports-panel.tsx` shows text data. Missing visual charts.

**Read:**
- `src/components/reports-panel.tsx` — current weekly reports display
- `src/app/api/reports/weekly/route.ts` — data shape
- `src/app/globals.css` — CSS variables to use

### 4.1 — Weekly Progress Chart (Pure CSS/SVG — NO external chart library)

Create `src/components/weekly-progress-chart.tsx` — Client component:

Props:
```typescript
interface WeeklyProgressChartProps {
  weeks: {
    weekStart: string
    minutesLearned: number
    lessonsCompleted: number
    streakDays: number
  }[]
  childNickname: string
}
```

Implement a **bar chart using SVG** (no external library needed):
- X-axis: last 6 weeks, label as "T1", "T2", etc.
- Y-axis: minutes learned (0 to max, 4 gridlines)
- Bars: colored with CSS variable `--color-primary` with opacity
- Labels above each bar showing exact minutes
- Responsive: use `viewBox` with fixed aspect ratio, `width="100%"`

Below bars, add a legend row per week showing: 🔥 streakDays ngày · 📖 lessonsCompleted bài

Add CSS to `src/app/globals.css`:
```css
.weekly-chart-container { padding: 1.5rem; background: var(--color-surface, #f8fafc); border-radius: 12px; margin-bottom: 1.5rem; }
.chart-bar { transition: opacity 0.15s; }
.chart-bar:hover { opacity: 1; }
.chart-legend { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; justify-content: space-around; }
.chart-legend-item { display: flex; flex-direction: column; font-size: 0.7rem; color: var(--color-text-muted, #64748b); text-align: center; }
```

### 4.2 — Wire into Reports Panel

In `src/components/reports-panel.tsx`:
1. Fetch the last 6 weekly reports (the API already supports this)
2. Transform into the `WeeklyProgressChartProps.weeks` format
3. Render `<WeeklyProgressChart>` as the first element inside the reports section, above the individual report cards

**After WS4:** `pnpm type-check`

---

## WORKSTREAM 5 — Blog System Completions

Blog schema exists and base implementation is in place. Study existing code before adding anything.

**Read:**
- `src/modules/blog/` — all existing service files
- `src/app/(main)/blog/` — existing pages
- `src/app/api/blog/` — existing routes
- `src/app/sitemap.ts` — current sitemap

### 5.1 — RSS Feed Endpoint

Create `src/app/rss.xml/route.ts` — GET (no auth, public):

```typescript
import { blogRepository } from '@/modules/blog/blog-repository'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cungcontuhoc.vn'
  
  try {
    const { posts } = await blogRepository.findPosts({ limit: 20, page: 1 })
    
    const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.titleVi}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerptVi}]]></description>
      <pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate>
    </item>`).join('')
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cùng Con Tự Học — Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Kiến thức nuôi dạy con và phát triển toàn diện cho trẻ 2-6 tuổi</description>
    <language>vi</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch {
    return new Response('<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' }
    })
  }
}
```

### 5.2 — Blog Posts in Sitemap

In `src/app/sitemap.ts`, add blog posts and categories. Wrap all blog fetches in try/catch so sitemap never fails to build:

```typescript
// Add blog homepage
{ url: `${siteUrl}/blog`, changeFrequency: 'daily' as const, priority: 0.9 }

// Add blog posts (fetch top 100 published)
// Wrap in try/catch — if blog table empty, skip gracefully

// Add blog category URLs
```

Import `blogRepository` at the top. Use `try/catch` around all DB calls. If DB throws (e.g., empty table), return empty array for that section.

### 5.3 — Scheduled Post Automation Cron

Create `src/app/api/cron/publish-scheduled-posts/route.ts` — GET:
1. Verify `CRON_SECRET` — copy EXACTLY the verification pattern from `src/app/api/cron/weekly-reports/route.ts`
2. Find posts due for publishing:
   ```typescript
   const due = await prisma.blogPost.findMany({
     where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
     select: { id: true, slug: true }
   })
   ```
3. Publish each:
   ```typescript
   if (due.length > 0) {
     await prisma.blogPost.updateMany({
       where: { id: { in: due.map(p => p.id) } },
       data: { status: 'PUBLISHED', publishedAt: new Date() }
     })
   }
   ```
4. Return `{ published: due.length, slugs: due.map(p => p.slug) }`

Add to `vercel.json` crons array (alongside existing crons):
```json
{ "path": "/api/cron/publish-scheduled-posts", "schedule": "*/15 * * * *" }
```

### 5.4 — Fix BlogAuthor Default Role Encoding

In `prisma/schema.prisma`, find the line:
```prisma
role String @default("Bien tap vien")
```

Change to:
```prisma
role String @default("Biên tập viên")
```

This is a default value change only — run:
```bash
pnpm db:migrate --name fix-blog-author-role-encoding
pnpm db:generate
pnpm type-check
```

**After WS5:** `pnpm type-check && pnpm lint`

---

## WORKSTREAM 6 — Unit Test Coverage Improvement

Current coverage: ~35-40%. Target: 60%+ for core domain services.

**Read existing tests first:**
- `src/components/kid-mission-panel.test.tsx`
- `src/modules/learning/__tests__/video-watch-service.test.ts`
- `src/lib/__tests__/rate-limit.test.ts`
- `src/test/mocks/` — mock patterns

### 6.1 — Billing Webhook Service Tests

Create `src/modules/billing/__tests__/webhook-service.test.ts`:

Test cases (use vi.mock for Prisma and dependencies):
- Valid webhook event with correct signature → `status: 'PROCESSED'`
- Duplicate `eventId` for same `provider` → returns existing record, no additional DB write (idempotency)
- Invalid/missing signature → throws before any DB write
- Payment succeeded event → subscription status transitions correctly (mock the subscription update)

### 6.2 — Weekly Report Service Tests

Create `src/modules/reports/__tests__/weekly-report-service.test.ts`:

Test cases:
- No completions in week → report has `minutesLearned: 0, lessonsCompleted: 0`
- 3 completions of 10 minutes each → `minutesLearned: 30, lessonsCompleted: 3`
- `generateWeeklyReport` called twice for same `childId + weekStart` → second call returns existing, does not insert duplicate (check `@@unique([childId, weekStart])`)
- `streakDays` counts consecutive days correctly (day gap breaks streak)

### 6.3 — Rate Limit Edge Case Tests

In existing `src/lib/__tests__/rate-limit.test.ts`, add:
- `storeFailureMode: 'deny'` — when Redis throws, request is rejected (returns 429 or 503)
- `storeFailureMode: 'allow'` — when Redis throws, request passes through
- IP in blocked CIDR → request returns 403 before rate-limit check
- `RATE_LIMIT_TRUST_PROXY=false` — `x-forwarded-for` is ignored

**After WS6:** `pnpm test` — all pass, check coverage: `pnpm test -- --coverage`

---

## WORKSTREAM 7 — API Response Type Contracts

Status: Frontend fetch calls have no type safety.

**Read:** `src/components/children-manager.tsx`, `src/components/kid-mission-panel.tsx`, `src/components/reports-panel.tsx`, `src/components/parent-notification-center.tsx`

### 7.1 — Create Shared API Types

Create `src/lib/api-types.ts`:

```typescript
// Child Profile
export interface ChildProfileDTO {
  id: string
  nickname: string
  ageBand: string
  avatarId: string | null
  dailyGoalMinutes: number
  dailyMinutesLimit: number
  progressSnapshot: Record<string, unknown> | null
  createdAt: string
}

// Today's Mission
export interface LessonCardDTO {
  id: string
  slug: string
  title: string
  objective: string
  estimatedMinutes: number
  trialEnabled: boolean
  isCompleted: boolean
  trackCode: 'ENGLISH' | 'MATH' | 'HABIT'
  unitTitle: string
}

export interface TodayMissionDTO {
  child: ChildProfileDTO
  lessons: LessonCardDTO[]
  streakCount: number
  dailyMinutesUsed: number
  dailyGoalMinutes: number
  goalReached: boolean
}

// Weekly Report
export interface WeeklyReportDTO {
  id: string
  weekStart: string
  weekEnd: string
  minutesLearned: number
  lessonsCompleted: number
  streakDays: number
  skillsSummary: Record<string, unknown> | null
  recommendations: string[] | null
  generatedAt: string
}

// Notification
export interface NotificationDTO {
  id: string
  type: 'ACHIEVEMENT' | 'REPORT' | 'TIP' | 'STREAK'
  title: string
  message: string
  href: string
  read: boolean
  createdAt: string
}

// Standard API envelope
export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: string
  code?: string
}
```

### 7.2 — Apply Types at Fetch Call Sites

For each relevant component, add type assertions on `fetch` responses:
```typescript
import type { TodayMissionDTO, ApiSuccess } from '@/lib/api-types'
// ...
const json = await res.json() as ApiSuccess<TodayMissionDTO>
```

Apply to the fetch calls in:
- `kid-mission-panel.tsx` → `TodayMissionDTO`
- `children-manager.tsx` → `ChildProfileDTO[]`
- `reports-panel.tsx` → `WeeklyReportDTO[]`
- `parent-notification-center.tsx` → `NotificationDTO[]`

For the API routes themselves, add explicit return type annotations where missing (optional but recommended).

**After WS7:** `pnpm type-check` — zero errors

---

## FINAL VERIFICATION (mandatory — run in this order)

```bash
# Type safety
pnpm type-check

# Lint
pnpm lint

# Unit tests
pnpm test

# E2E P0 journey (requires dev server + DB running)
pnpm test:e2e:p0

# Security baseline
pnpm security:baseline

# Full release check
pnpm release:check
```

All commands must pass. Fix any errors before marking workstream complete.

**Manual spot-checks (run dev server first: `pnpm dev`):**
```
GET  http://localhost:3000/rss.xml                          → Valid RSS XML with blog posts
GET  http://localhost:3000/sitemap.xml                      → Includes /blog/* URLs
GET  http://localhost:3000/blog                             → Blog homepage loads  
GET  http://localhost:3000/parent/reports                   → WeeklyProgressChart visible
GET  http://localhost:3000/api/cron/cleanup-pending-media?secret=TEST   → { deleted: 0 }
GET  http://localhost:3000/api/cron/publish-scheduled-posts?secret=TEST → { published: 0 }
```

---

## Execution Order (recommended by priority)

| Order | Workstream | Why first |
|---|---|---|
| 1 | WS1 — Watch Session Hardening | Security, already in-progress |
| 2 | WS3 — Activity Type System | Quick fix, prevents future runtime bugs |
| 3 | WS5.4 — BlogAuthor typo fix | DB migration, best done early |
| 4 | WS2 — EvidenceMedia lifecycle | Data integrity, has migration |
| 5 | WS5 — Blog completions (RSS, sitemap, cron) | Content discoverability |
| 6 | WS4 — Parent progress chart | UX improvement |
| 7 | WS7 — API type contracts | Developer safety |
| 8 | WS6 — Unit tests | Coverage improvements last |
