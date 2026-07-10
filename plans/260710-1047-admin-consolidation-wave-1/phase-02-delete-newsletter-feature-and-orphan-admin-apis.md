---
phase: 2
title: "Delete newsletter feature and orphan admin APIs"
status: pending
priority: P1
dependencies: []
effort: "5h"
---

# Phase 2: Delete newsletter feature and orphan admin APIs

## Overview

**Intentional feature-kill** (user re-confirmed 2026-07-10 after red-team correction): the blog newsletter is a LIVE feature — weekly digest cron + BullMQ worker sending real emails — that the user has decided to remove anyway. This is NOT dead-code cleanup; the send pipeline must be dismantled in the correct order (stop sends → archive data → drop model). Also deletes orphan `admin/bulk-enroll` API. `admin/integrations` (Jules monitoring) is KEPT — live integration, Wave 3 candidate for admin UI wiring.

## Context Links

- Red-team corrections: newsletter send pipeline is live (`vercel.json:12-13` weekly cron; `src/app/api/cron/newsletter-weekly/route.ts` enqueues; `src/worker/jobs/dispatch-blog-newsletter-emails.ts:283-321` sends via BullMQ; worker instantiated unconditionally at `src/worker/index.ts:17`)
- Jules integration KEPT: `src/app/api/admin/integrations/jules/monitoring/route.ts` is the read side of live webhooks (`src/app/api/integrations/jules/github-webhook/`, `session-feedback/`) writing via `src/lib/jules/audit-store.ts`
- Real bulk-enroll implementations that STAY: `/api/teacher/bulk-enroll`, `/api/organizations/[orgId]/bulk-enroll`

## Requirements

- Functional: no newsletter emails sent after this phase ships; blog pages render without subscribe form; all newsletter API/UI/worker/cron surfaces removed; admin blog dashboard shows no newsletter stats
- Non-functional: subscriber PII archived before destructive migration; DB backup taken; deletion order prevents worker crashes (never leave worker code referencing a dropped model)

## Related Code Files

**Full consumer inventory (from `grep -rn "blogNewsletterSubscriber\|newsletter" src/` — regenerate at execution time, red team found the original audit list missed 5/7 consumers):**

**Delete:**
- Cron trigger: `src/app/api/cron/newsletter-weekly/route.ts` + its entry in `vercel.json` crons
- Worker: `src/worker/jobs/dispatch-blog-newsletter-emails.ts`; newsletter queue + enqueue functions in `src/worker/queue.ts` (~:37,127-167 — surgical removal, queue file serves other jobs); `createBlogNewsletterWorker()` instantiation + wiring in `src/worker/index.ts` (:4,17,43-44,108-109,205)
- Service: `src/modules/blog/newsletter-service.ts` + `newsletter-service.test.ts`
- Public subscribe/verify/unsubscribe APIs: `src/app/api/blog/newsletter/**`
- Admin API: `src/app/api/admin/blog/newsletter/**` (incl. `subscribers/route.ts`)
- Admin page: `src/app/(main)/admin/blog/newsletter/page.tsx`
- Components: `src/components/admin-blog-newsletter-export-button.tsx`; blog subscribe form component(s) — locate via grep
- Prisma: `BlogNewsletterSubscriber` model + drop migration
- Orphan API: `src/app/api/admin/bulk-enroll/` (real impls at teacher/org routes stay)
- i18n keys: newsletter-related keys in `locales/en/translation.json` + `locales/vi/translation.json`

**Modify:**
- `src/app/(main)/admin/blog/page.tsx` (dashboard newsletter counts)
- `src/app/api/admin/blog/analytics/route.ts` (newsletter refs)
- `src/components/admin-shell-nav.tsx`: remove "Newsletter" child entry
- `src/components/admin/admin-module-catalog.ts` if newsletter listed
- Seeders/tests referencing `BlogNewsletterSubscriber`

**Explicitly KEEP:** `src/app/api/admin/integrations/**`, `src/app/api/integrations/jules/**`, `src/lib/jules/**`

## Implementation Steps (TDD)

1. **Tests first — lock survivor behavior:** vitest tests asserting (a) blog listing/dashboard services work without newsletter joins, (b) teacher/org bulk-enroll services untouched (run existing tests, note baseline), (c) worker boots and processes remaining job types with newsletter worker removed (worker registration test if none exists).
2. **Archive data + backup:** `pnpm backup:create`; export subscribers to CSV (`psql \copy` from `BlogNewsletterSubscriber`) → store outside repo. Confirm row count with user if > 0. Note: killing the pipeline also kills the unsubscribe endpoint — acceptable because sends stop entirely in the same release; do NOT ship a state where sends continue but unsubscribe is gone.
3. **Stop sends first:** remove `vercel.json` cron entry + cron route + worker job + queue wiring + `worker/index.ts` instantiation in one commit. `pnpm type-check` + worker boot check.
4. Delete service, public APIs, admin API/page, components, subscribe form, i18n keys; `pnpm type-check` after each batch.
5. Remove model from `prisma/schema.prisma`; `pnpm db:migrate` to generate drop migration (dev DB); review migration SQL manually. This MUST be the last deletion step — no code referencing the model may survive it (step-1/3/4 grep gates guarantee).
6. Delete orphan `admin/bulk-enroll`; grep-verify 0 consumers first (frontend AND worker/cron/queue-aware: also grep `src/worker/`, `vercel.json`, `.github/workflows/`).
7. Full gate: `pnpm lint && pnpm type-check && pnpm test`; manual: blog page + admin blog dashboard render; worker starts clean.

## Success Criteria

- [ ] Subscriber CSV archived; DB backup exists
- [ ] Survivor tests (blog render, teacher/org bulk-enroll, worker boot) green before AND after
- [ ] `BlogNewsletterSubscriber` gone from schema; drop migration reviewed; zero `blogNewsletterSubscriber` references in `src/`
- [ ] No cron/queue/worker path can trigger a newsletter send (grep `newsletter` in `src/worker/`, `vercel.json` = 0 runtime hits)
- [ ] `admin/integrations` (Jules) untouched and still responding
- [ ] `pnpm lint && pnpm type-check && pnpm test` green

## Risk Assessment

- **Destructive migration + code-only rollback (red-team confirmed):** `scripts/deploy/remote-deploy.sh:111-124` fast rollback = git checkout + rebuild only, NO DB restore. Once this migration ships, fast rollback to any pre-Phase-2 SHA is UNSAFE (old code references dropped model → Prisma Client failure). PR description MUST state: post-Phase-2 rollback requires full DB restore procedure (maintenance window). Take prod backup immediately before deploying.
- **Worker crash ordering:** worker runs continuously under PM2 — deploy order in steps 3-5 (code before schema) prevents a window where live worker queries a dropped table
- **In-flight queued jobs:** drain/obliterate the newsletter BullMQ queue before removing the worker (`queue.obliterate()` or verify empty via Redis) so no orphaned jobs error-loop
- **Hidden consumers of subscribe form** (footer, blog sidebar): grep sweep before delete
