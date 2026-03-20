# CODEX TASK: Phase A2 — 4 Missing Follow-up Items

## Context

Continuing from the previous sprint. Stack: Next.js 16 + React 19 + TypeScript, Prisma/PostgreSQL, Redis/BullMQ, Better Auth.

**Study these files before starting — mandatory:**
- `src/app/api/cron/weekly-reports/route.ts` — copy this exact cron auth + error handling pattern
- `src/lib/cron.ts` — `isCronRequestAuthorized()` function
- `src/lib/http.ts` — `ok()` and `fail()` helpers
- `src/lib/route-error.ts` — `handleRouteError()` helper
- `src/app/api/evidence/media/upload-url/route.ts` — existing upload URL route (auth pattern)
- `src/lib/auth/session.ts` — session extraction pattern for API routes
- `prisma/schema.prisma` → `EvidenceMedia` model (already has `uploadStatus String @default("PENDING")` and `uploadedAt DateTime?`)
- `src/modules/platform/storage/providers/types.ts` — storage provider interface
- `src/modules/platform/storage/providers/mock-r2-provider.ts` — mock implementation
- `vercel.json` — existing cron entries to add alongside

---

## CRITICAL RULES

1. **Zero breaking changes** — all existing tests must continue to pass
2. **Pass `pnpm type-check` after EVERY task** before next task
3. **Follow existing patterns exactly** — copy cron auth from `weekly-reports/route.ts`
4. **Do NOT re-run migrations** — `EvidenceMedia.uploadStatus` and `uploadedAt` fields already exist in schema

---

## TASK 1 — EvidenceMedia Upload Confirm API

Create `src/app/api/evidence/media/[mediaId]/confirm/route.ts` — POST (auth required):

```typescript
import { prisma } from '@/lib/db'
import { fail, ok } from '@/lib/http'
import { handleRouteError } from '@/lib/route-error'
import { getAuthenticatedParent } from '@/lib/auth/session'  // or equivalent — check existing upload-url route
import { storageAdapter } from '@/modules/platform/storage'  // or however storage is imported in other routes
import type { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params

    // 1. Auth — get current parent (copy pattern from upload-url route)
    const parent = await getAuthenticatedParent(request)
    if (!parent) return fail('Unauthorized', 401)

    // 2. Find media record — must belong to this parent
    const media = await prisma.evidenceMedia.findUnique({
      where: { id: mediaId },
      select: { id: true, objectPath: true, uploadStatus: true, uploadedByParentId: true }
    })
    if (!media) return fail('Not found', 404)
    if (media.uploadedByParentId !== parent.id) return fail('Forbidden', 403)
    if (media.uploadStatus === 'UPLOADED') return ok({ ok: true, mediaId, alreadyConfirmed: true })

    // 3. Check object exists in storage (mock always returns true)
    const exists = await storageAdapter.objectExists(media.objectPath)
    if (!exists) return fail('Upload not found in storage', 422)

    // 4. Mark as UPLOADED
    await prisma.evidenceMedia.update({
      where: { id: mediaId },
      data: { uploadStatus: 'UPLOADED', uploadedAt: new Date() }
    })

    return ok({ ok: true, mediaId })
  } catch (error) {
    return handleRouteError(error)
  }
}
```

**Storage adapter `objectExists` method:** Check `src/modules/platform/storage/providers/types.ts`. If `objectExists` is not in the interface, add it:
```typescript
// In StorageProvider interface:
objectExists(objectPath: string): Promise<boolean>

// In mock-r2-provider.ts:
async objectExists(_objectPath: string): Promise<boolean> {
  return true  // Mock: always confirm
}

// In cloudflare-r2-provider.ts — add stub (throws helpful error if called in mock mode):
async objectExists(objectPath: string): Promise<boolean> {
  // Uses HeadObject — only relevant for real R2
  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3')
    await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectPath }))
    return true
  } catch {
    return false
  }
}
```

**Verify:**
```bash
pnpm type-check
pnpm lint
```

---

## TASK 2 — EvidenceMedia Cleanup Cron

Create `src/app/api/cron/cleanup-pending-media/route.ts` — GET:

Copy the EXACT structure from `src/app/api/cron/weekly-reports/route.ts`. Pattern:
1. `isCronRequestAuthorized(request)` → `fail('Unauthorized', 401)` if false
2. Business logic
3. `ok({...})` response
4. `handleRouteError(error)` in catch

```typescript
import { isCronRequestAuthorized } from '@/lib/cron'
import { prisma } from '@/lib/db'
import { fail, ok } from '@/lib/http'
import { handleRouteError } from '@/lib/route-error'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return fail('Unauthorized', 401)
    }

    // Delete PENDING records older than 2 hours (upload was never confirmed)
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const deleted = await prisma.evidenceMedia.deleteMany({
      where: {
        uploadStatus: 'PENDING',
        createdAt: { lt: cutoff }
      }
    })

    return ok({ deleted: deleted.count, cutoffIso: cutoff.toISOString() })
  } catch (error) {
    return handleRouteError(error)
  }
}
```

**Add to `vercel.json`** crons array (alongside existing entries, do NOT remove any existing cron):
```json
{ "path": "/api/cron/cleanup-pending-media", "schedule": "0 * * * *" }
```

**Verify:**
```bash
pnpm type-check
pnpm lint
```

---

## TASK 3 — Publish Scheduled Blog Posts Cron

Create `src/app/api/cron/publish-scheduled-posts/route.ts` — GET:

Same cron pattern as above:

```typescript
import { isCronRequestAuthorized } from '@/lib/cron'
import { prisma } from '@/lib/db'
import { fail, ok } from '@/lib/http'
import { handleRouteError } from '@/lib/route-error'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return fail('Unauthorized', 401)
    }

    // Find blog posts with status SCHEDULED that are due
    const due = await prisma.blogPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() }
      },
      select: { id: true, slug: true }
    })

    if (due.length === 0) {
      return ok({ published: 0, slugs: [] })
    }

    await prisma.blogPost.updateMany({
      where: { id: { in: due.map(p => p.id) } },
      data: { status: 'PUBLISHED', publishedAt: new Date() }
    })

    return ok({ published: due.length, slugs: due.map(p => p.slug) })
  } catch (error) {
    return handleRouteError(error)
  }
}
```

**Add to `vercel.json`** crons array:
```json
{ "path": "/api/cron/publish-scheduled-posts", "schedule": "*/15 * * * *" }
```

**Verify:**
```bash
pnpm type-check
pnpm lint
```

---

## TASK 4 — Fix BlogAuthor Role Default Encoding

Open `prisma/schema.prisma`. Find the `BlogAuthor` model. Look for this line:

```prisma
role String @default("Bien tap vien")
```

Change it to:
```prisma
role String @default("Biên tập viên")
```

**If the schema already shows `"Biên tập viên"` with correct diacritics, SKIP this task.**

After editing schema, run:
```bash
pnpm db:migrate --name fix-blog-author-role-encoding
pnpm db:generate
pnpm type-check
```

---

## FINAL VERIFICATION (run all in order)

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm test:e2e:p0
pnpm security:baseline
pnpm release:check
```

All must pass. Fix any errors before finishing.

**Manual spot-checks:**
```
GET /api/cron/cleanup-pending-media?secret=<CRON_SECRET>   → { deleted: 0, cutoffIso: "..." }
GET /api/cron/publish-scheduled-posts?secret=<CRON_SECRET> → { published: 0, slugs: [] }
```

---

## Priority Order

```
Task 1 → Task 2 → Task 3 → Task 4
```

Do them in order. Pass `pnpm type-check` after each task before moving to the next.
