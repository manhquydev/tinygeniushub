---
title: "Blog 5-item hardening plan"
description: "Short prioritized implementation plan for newsletter, like, bookmark, and bulk moderation fixes."
status: pending
priority: P1
effort: 3d
branch: main
tags: [blog, newsletter, worker, likes, bookmarks, moderation]
created: 2026-03-24
---

## Scope
Implement 5 blog fixes without scope creep:
1) newsletter subscribe sends verify email
2) newsletter dispatch worker no longer stub
3) like flow dedupe by user/session + UI trigger
4) bookmark total/count correct when post unpublish/archive
5) bulk moderate comments is transactional

## Priority Order
1. **P1** Newsletter E2E reliability: (1) + (2)
2. **P1** Bulk moderation transactional integrity: (5)
3. **P2** Like anti-duplicate + UI trigger: (3)
4. **P2** Bookmark total/count correctness on unpublish/archive: (4)

## Implementation Plan (Concise)
### Phase 1 - Newsletter E2E (items 1,2)
- Add concrete email send path for verify + dispatch jobs (reuse existing email provider pattern `mock_email|resend`, no provider rewrite).
- On subscribe: persist token then enqueue/send verify email with `/api/blog/newsletter/verify?token=...` link.
- In newsletter worker: replace TODO stub with real provider call, update `lastEmailAt` only on success, keep structured logs for success/fail.
- Keep weekly cron route enqueue-only; worker handles send + retries/failure visibility.
- Add/update tests for subscribe route + worker processor behavior.

Likely files:
- `src/modules/blog/newsletter-service.ts`
- `src/app/api/blog/newsletter/subscribe/route.ts`
- `src/worker/jobs/dispatch-blog-newsletter-emails.ts`
- `src/worker/queue.ts`
- `src/app/api/cron/newsletter-weekly/route.ts`
- `src/lib/env.ts`, `.env.example`
- `src/app/api/blog/newsletter/subscribe/route.test.ts`

### Phase 2 - Moderation transaction safety (item 5)
- Move bulk moderation from `Promise.all` per-comment mutation to one transactional service method.
- Validate all ids upfront in transaction, update statuses atomically, return `updatedCount`.
- Queue side effects after commit (reply notifications), avoid network calls inside transaction.
- Update bulk route test cases for transactional path.

Likely files:
- `src/modules/blog/comment-service.ts`
- `src/app/api/admin/blog/comments/bulk/route.ts`
- `src/app/api/admin/blog/comments/bulk/route.test.ts`

### Phase 3 - Like dedupe + UI trigger (item 3)
- Add like actor persistence model (user/session fingerprint) and unique constraint per `(postId, actorKey)`.
- API `/api/blog/posts/[slug]/like`: identify actor by logged reader or anonymous session cookie; idempotent like.
- Increment `BlogPost.likeCount` only on first like for actor.
- Add client UI trigger on post page (button/state), display immediate count from API response.

Likely files:
- `prisma/schema.prisma` + migration
- `src/modules/blog/blog-repository.ts`
- `src/app/api/blog/posts/[slug]/like/route.ts`
- `src/components/blog/blog-like-button.tsx` (new)
- `src/app/(main)/blog/[slug]/page.tsx`
- route/component tests for idempotency + cookie/session behavior

### Phase 4 - Bookmark count correctness (item 4)
- Ensure bookmark list and `total` are based on published posts only (DB-level filter, not post-query array filtering).
- Align pagination math with filtered total.
- Ensure archived/unpublished bookmarks do not inflate reader visible counts.

Likely files:
- `src/modules/reader/reader-repository.ts`
- `src/modules/reader/reader-service.ts` (if limit logic must align)
- `src/app/api/reader/bookmarks/route.ts` (if shape/paging impacted)
- `src/app/(main)/reader/bookmarks/page.tsx` (display stays aligned)
- `src/app/api/reader/bookmarks/route.test.ts`

## Parallel Split for 2 Workers (no file overlap)
### Worker A - Newsletter lane (Phase 1)
File ownership:
- `src/modules/blog/newsletter-service.ts`
- `src/app/api/blog/newsletter/**`
- `src/app/api/cron/newsletter-weekly/route.ts`
- `src/worker/jobs/dispatch-blog-newsletter-emails.ts`
- `src/worker/queue.ts`
- `src/lib/env.ts`, `.env.example`
- `src/**/newsletter*.test.ts`

Deliverable:
- Verify mail sent from subscribe flow
- Newsletter worker sends real emails (not stub)

### Worker B - Engagement + moderation lane (Phases 2,3,4)
File ownership:
- `prisma/schema.prisma`
- `prisma/migrations/**` (new migration for likes)
- `src/modules/blog/blog-repository.ts`
- `src/app/api/blog/posts/[slug]/like/route.ts`
- `src/components/blog/blog-like-button.tsx`
- `src/app/(main)/blog/[slug]/page.tsx`
- `src/modules/reader/**`
- `src/app/api/reader/bookmarks/**`
- `src/modules/blog/comment-service.ts`
- `src/app/api/admin/blog/comments/bulk/route.ts`
- related tests for like/bookmark/comments bulk

Deliverable:
- Idempotent like by user/session + UI trigger
- Correct bookmark total/count under unpublish/archive
- Transactional bulk moderation

## Suggested Execution Sequence
1. Worker A + Worker B start in parallel immediately.
2. Worker B runs Phase 2 first (no DB migration dependency), then Phase 3 (migration), then Phase 4.
3. Merge gate: run focused tests first, then full blog-related test suite.

## Done Criteria
- Subscribe response still fast; verify email actually sent (mock/resend) and verify link works.
- Newsletter worker emits success/fail logs and updates `lastEmailAt` only when send succeeds.
- Repeated like from same actor does not increase count.
- Reader bookmark `total` and page count exclude archived/unpublished posts.
- Bulk moderation applies all-or-nothing; no partial status updates.

## Unresolved Questions
- Should newsletter email sending reuse `REPORT_EMAIL_PROVIDER` or introduce dedicated `NEWSLETTER_EMAIL_PROVIDER` env keys?
- For unauthenticated like actor key, prefer long-lived cookie id or short-lived session id rotation policy?
- For bookmarks, should hidden (archived/unpublished) bookmarks still count toward per-reader max limit 100?
