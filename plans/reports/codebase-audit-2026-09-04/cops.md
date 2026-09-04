# Slice: ops / deploy / observability / content-platform
# Agent: cops
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
74/100 — Compose, PM2 deploy, health/ready, backup scripts, 9/10 BullMQ queues, 4 cron routes, blog CMS, reader auth, i18n catalogs, R2/Bunny/email adapters exist; Sentry, 10th queue, 5th cron, R2 object delete, certificate persist, and VPS calendar cron do not.

## Quality score
68/100 — Real processors and deploy gates, but worker bootstrap fires jobs on every restart, HTTP cron and BullMQ are dual uncoordinated paths, compose runs `pnpm dev`, SSH workflow hardcodes root, docs over-claim, cron/backup/health routes have almost no unit tests.

## What is actually implemented
- Docker Compose **4 services**: `postgres:16-alpine`, `redis:7-alpine`, `web`, `worker` (`docker-compose.yml:2-139`). Web waits on healthy postgres+redis; worker waits on those plus healthy web. Host binds `127.0.0.1:5433/6380`.
- Local web start: wait pg/redis → `prisma migrate deploy` → optional seed → **`pnpm dev`** (`scripts/start-web.sh:20-37`). Worker: `pnpm worker:dev` → `tsx src/worker/index.ts` (`scripts/start-worker.sh:20-21`, `package.json:69`).
- Dockerfile `runner` is **dev image**: `CMD ["pnpm", "dev", ...]` (`Dockerfile:33-34`). Not Next standalone.
- Production runtime in repo: PM2 `tinygeniushub-web` (`pnpm start`) + `tinygeniushub-worker` (`npx tsx src/worker/index.ts`) (`ecosystem.config.js:13-55`).
- Primary deploy: `.github/workflows/deploy.yml` self-hosted runner → `scripts/deploy/remote-deploy.sh` → PM2 describe web+worker → curl `127.0.0.1:3000/api/health` and `/api/health/ready` (`deploy.yml:33,120-139`). External probes hit homepage only (`deploy.yml:163-165`).
- Fallback SSH: `.github/workflows/deploy-digitalocean-ssh.yml` `workflow_dispatch`, secrets `DO_SSH_HOST/PRIVATE_KEY/KNOWN_HOSTS`, `StrictHostKeyChecking=yes`, hardcoded `SSH_USER=root`, `APP_DIR=/var/www/tinygeniushub` (`deploy-digitalocean-ssh.yml:1-31,39-55,73-81`). Post-deploy restarts PM2 web+worker then health/ready loops (`deploy-digitalocean-ssh.yml:93-94`).
- Liveness `GET /api/health`: `{status, service, environment, version, timestamp, uptimeSeconds}` (`src/app/api/health/route.ts:4-13`). No dependency checks.
- Readiness `GET /api/health/ready`: allowlist + `health.ready.ip` rate-limit + cached prisma `SELECT 1` + Redis PING; 503 if either fails; details gated by `HEALTH_EXPOSE_DETAILS` (forbidden true in production) (`src/app/api/health/ready/route.ts:80-150`, `src/lib/env.ts:123-127,202-203`).
- Structured logs: custom JSON stdout logger (`timestamp/level/service/environment/message/metadata`) (`src/lib/observability/logger.ts:42-68`). Not Pino/Winston. No `@sentry/*`.
- Backup: 7 real `pnpm` scripts (`package.json:31-37`) + matching `scripts/ops/*.mjs` (`pg_dump -Fc`, sha256, `pg_restore`, R2 PutObject, rclone GDrive). Runbook `docs/deployment/backup-restore-runbook.md`.
- Cron HTTP: 4 routes, all `isCronRequestAuthorized` (`src/lib/cron.ts:39-45`):
  - `/api/cron/weekly-reports` Sunday `0 13 * * 0` UTC (`vercel.json:3-6`, `src/app/api/cron/weekly-reports/route.ts:18-21`) — **inline** `generateWeeklyReportsForParent`, does not enqueue BullMQ.
  - `/api/cron/streak-alerts` daily `0 11 * * *` (`vercel.json:7-10`).
  - `/api/cron/cleanup-pending-media` daily `0 3 * * *` — hard-deletes PENDING `EvidenceMedia` older than 2h (`src/app/api/cron/cleanup-pending-media/route.ts:13-21`).
  - `/api/cron/publish-scheduled-posts` daily `0 6 * * *` — `SCHEDULED` → `PUBLISHED` (`src/app/api/cron/publish-scheduled-posts/route.ts:13-43`).
- BullMQ **9 queues** in `src/worker/queue.ts:10-44`, all 9 workers constructed `src/worker/index.ts:13-21`. On bootstrap **immediately** enqueues weekly-reports, retention, weekly-report-emails, pending lifecycle (`src/worker/index.ts:135-141`), then `setInterval` 7d / 24h / 30min / 1h (`145-174`).
- Blog: public pages under `src/app/(main)/blog/` + admin CMS + APIs (`src/app/api/blog/**`, `src/modules/blog/blog-service.ts`). Comments enqueue verify-email (`src/app/api/blog/posts/[slug]/comments`).
- Reader: **separate** auth — `ReaderAccount`/`ReaderSession` (`prisma/schema.prisma:865-893`), cookie `ccth_reader_session` (`src/modules/reader/reader-auth-service.ts:17-18`), pages `src/app/(main)/reader/{login,signup,bookmarks}` (not `src/app/reader/**`).
- i18n: `supportedLocales = ["en","vi"]`, cookie `tgh_locale`, default `en` (`src/i18n/locales.ts:1-3`); next-intl plugin (`next.config.ts:2-4`); catalogs **5190/5190 keys, 0 drift** (`locales/en/translation.json`, `locales/vi/translation.json`). LanguageSwitcher (`src/components/language-switcher.tsx:24-44`). `/gioi-thieu`, `/lien-he` pages exist.
- Storage: `STORAGE_PROVIDER` default `mock_r2`; adapters `mock_r2` + `cloudflare_r2`; mock blocked in production (`src/modules/platform/storage/providers/index.ts:7-14`). Evidence signed upload `POST /api/evidence/media/upload-url` (`src/app/api/evidence/media/upload-url/route.ts:11-56`).
- Bunny: create/get/delete, TUS token, signed embed (`src/lib/bunny-stream-client.ts:44-167`); admin upload `POST /api/admin/videos/upload`; webhook `POST /api/webhooks/bunny` (`src/app/api/webhooks/bunny/route.ts:14-87`); playback `GET /api/lessons/[lessonId]/video-token`.
- Email: `REPORT_EMAIL_PROVIDER` default `mock_email`; `resend` + `brevo` implemented (`src/lib/email/transactional-email-sender.ts:102-126`); boot requires matching API key + FROM (`src/lib/env.ts:246-263`).

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
|---|---|---|---|
| docker-compose web+worker+postgres+redis | README.md:36-38; docs/codebase-summary.md:282-286 | 4 services exist; **NODE_ENV=development**, web=`pnpm dev`, not prod image | Partial |
| DigitalOcean SSH deploy is CI/CD | docs/codebase-summary.md:25, 291 | SSH workflow is **fallback** `workflow_dispatch`; primary is self-hosted `deploy.yml`. SSH hardcodes `root` / `/var/www/tinygeniushub`; setup doc lists unused `DO_SSH_USER`/`DO_APP_DIR` | Partial |
| Health + ready APIs | README.md:161-162 | Both implemented; health is liveness-only; ready checks DB+Redis with allowlist/rate-limit | Done |
| Structured logs (Winston/Pino) | docs/project-overview-pdr.md:174; docs/system-architecture.md:422 | Custom JSON `console.*` logger; no winston/pino in package.json | Partial (impl) / Doc-lie (library) |
| Sentry for errors | docs/project-overview-pdr.md:176; handover-master-agent-ready.md:246 | No `@sentry/*`, no DSN env, no instrumentation. implementation-plan.md:50 lists Sentry as remaining work | Missing / Doc-lie |
| Backup/restore + runbook | README.md:186-202 | 7 scripts + runbook exist. No `backup:offsite:list`; no restore-from-R2 CLI; no automated restore drill | Done (core) / Partial (ops loop) |
| BullMQ 10 queues | docs/codebase-summary.md:210-223; docs/system-architecture.md:137-150; PDR.md:169 | **9** `new Queue()`; `blog-newsletter` removed (`docs/project-changelog.md:16-17`, `src/worker/queue.test.ts:24-30`) | Partial / Doc-lie (count) |
| Vercel 5 cron routes | docs/codebase-summary.md:288; docs/system-architecture.md:362-367 | `vercel.json` has **4**. Newsletter cron gone. README lists 2/4; summary lists the other 2/4 | Partial / Doc-lie (count) |
| Production cron Sunday 8am / daily 6am | docs/system-architecture.md:137-147, 362-367 | Vercel schedules are `0 13 * * 0` and `0 11 * * *` (README VN times). VPS worker uses **setInterval from process start**, not calendar | Partial / Doc-lie (times) |
| Blog + newsletter | PDR.md:123-127; codebase-summary.md:44 | Blog CMS/public/admin Done. Newsletter pipeline **removed** | Partial (blog Done; newsletter Missing) |
| Reader portal separate auth | docs/system-architecture.md:192-196; PDR.md:123-127 | Separate cookie auth Done. UI only login/signup/bookmarks. No notifications page, reset, or email-verify gate. Path is `(main)/reader` not `src/app/reader` | Partial |
| i18n en/vi next-intl middleware | docs/codebase-summary.md:227-234; code-standards.md:309 | Cookie + `src/i18n/request.ts`. **No** `i18n.config.ts`, **no** `middleware.ts`, `src/proxy.ts` has no locale. Catalogs en/vi parity 5190 keys. Blog chrome still hardcoded English | Partial |
| Cloudflare R2 media + weekly R2 delete | docs/system-architecture.md:290-300; codebase-summary.md:247-248 | Signed PUT + `objectExists` only (`storage/providers/types.ts:15-19`). Env is `R2_*` not `CLOUDFLARE_R2_*`. Retention **soft-deletes DB only** (`retention-service.ts:23-41`). No DeleteObject | Partial / Doc-lie (env names + object delete) |
| Bunny Stream upload, signed embed, webhook | PDR.md:88-92; architecture.md:271-287 | Client + admin TUS + webhook + video-token exist. Unsigned embed if secret/library/cdn missing (`bunny-stream-client.ts:157-160`). Webhook compares raw secret to `X-BunnyWebhook-Signature` (`webhooks/bunny/route.ts:27-32`) | Done (surfaces) / Partial (token/secret dual-use) |
| Email Resend | codebase-summary.md:250-251, 299 | Code uses `REPORT_EMAIL_PROVIDER=mock_email\|resend\|brevo` and `REPORT_EMAIL_RESEND_API_KEY`. `RESEND_API_KEY` unused | Done (3 providers) / Doc-lie (env name) |
| POST `/api/progress/media` | docs/system-architecture.md:292-296 | Missing. Real route is `/api/evidence/media/upload-url` | Missing / Doc-lie |
| Certificates via BullMQ + R2 | architecture.md:146 | Queue+worker exist; PDF bytes generated then **discarded**; URL always `/api/certificates/${id}` (`generate-certificate.ts:33-56`) | Partial / Scaffold (persist) |
| Metrics dashboard / BullMQ dashboard | architecture.md:453-454; handover:246 | Not in repo | Missing |

## Findings
### Critical
- [Worker bootstrap enqueues production jobs on every start] `src/worker/index.ts:135-141` — `bootstrap()` always `enqueueWeeklyReports()`, `enqueueRetentionCleanup()`, `enqueueWeeklyReportEmails()`, `enqueueDispatchPendingLifecycleEmails()`. PM2 `autorestart` (`ecosystem.config.js:79`) re-fires this. Combined with weekly-reports processor also enqueueing emails (`generate-weekly-reports.ts:13-14`) and HTTP cron generating reports in-process (`weekly-reports/route.ts:52-53`), deploys can duplicate reports/emails. Impact: spam + duplicate weekly-report rows. Suggested fix: calendar/repeatable BullMQ jobs; remove eager bootstrap enqueue; single trigger path.

### High
- [Sentry claimed, not present] `docs/project-overview-pdr.md:176` vs no `@sentry/*`, no `SENTRY_*` in `src/lib/env.ts`. Production errors only go to PM2 stdout JSON. Impact: no error grouping/alerting. Suggested fix: stop claiming Sentry, or add DSN + Next instrumentation.
- [Certificate job does not store PDF] `src/worker/jobs/generate-certificate.ts:33-56` — comments admit R2 upload is "for now log"; `objectExists` unused for upload; adapter has no put/delete. Impact: certificates feature is a URL stub. Suggested fix: direct PutObject or signed PUT of `pdfBytes`, then persist that URL.
- [R2 objects never deleted] `StorageProviderAdapter` has only `createSignedUploadUrl` + `objectExists` (`types.ts:15-19`). `purgeExpiredPortfolioMedia` sets `deletedAt` (`retention-service.ts:23-41`). `cleanup-pending-media` deletes **DB rows only**. Impact: orphan media, privacy/retention claims false. Suggested fix: add `deleteObject` and call it from both jobs.
- [Vercel crons likely dead on production VPS] Production path is DigitalOcean PM2 (`deploy.yml`, `ecosystem.config.js`). `vercel.json` crons do not run there unless something HTTP-calls `/api/cron/*` with `CRON_SECRET`. VPS scheduling is `setInterval` from process uptime, not Sunday 20:00 VN. Impact: missed or early/late jobs after restart. Suggested fix: one scheduler (systemd/cron curling `/api/cron` **or** BullMQ repeatables), document which.

### Medium
- [Compose is not a staging/prod runtime] `docker-compose.yml:56,114` `NODE_ENV: development`; `start-web.sh:36-37` `pnpm dev`; demo seed + weak secrets (`CRON_SECRET: dev-cron-secret-change-this-123456` `:69`). Docs call this "dev/staging". Impact: operators may ship compose as-is.
- [SSH deploy vs setup doc] Workflow `SSH_USER=root`, `APP_DIR` hardcoded (`deploy-digitalocean-ssh.yml:29-31`). Doc claims `DO_SSH_USER`/`DO_APP_DIR` and a `deploy` user (`digitalocean-ssh-agent-setup.md:70-74,45-54`). Impact: secret setup is a no-op; root SSH is higher blast radius.
- [health-monitor uses `pm2 restart all`] `scripts/health-monitor.sh:87-88` despite setup doc forbidding it (`digitalocean-ssh-agent-setup.md:84-87`). Also curls public `/api/health/ready` which may 403 on allowlist (`ready/route.ts:82-84`).
- [Bunny token secret dual-use + unsigned fallback] Embed HMAC uses `BUNNY_WEBHOOK_SECRET` (`bunny-stream-client.ts:152-165`). Webhook treats the same value as a raw header (`webhooks/bunny/route.ts:15-32`). Missing config returns unsigned iframe URL (`bunny-stream-client.ts:157-160`). [INFERENCE] Bunny Stream webhooks are typically HMAC of body, not shared-secret equality.
- [Blog i18n incomplete] Public blog renders `titleVi` always (`src/app/(main)/blog/[slug]/page.tsx` per scout); chrome hardcoded English ("Latest article"). Catalogs exist but blog/reader pages do not use `translate()`.
- [Reader portal thin] No password reset, email verification gate (`emailVerified` selected, unused `reader-auth-service.ts:101-102`), no notifications UI despite APIs. Newsletter signup claimed in PDR, removed.
- [No R2 list/download / `backup:offsite:list`] Runbook is R2-first (`backup-restore-runbook.md:13-18`) but recovery steps use GDrive (`123-133`). Checklist `backup:offsite:list` has no script.
- [Logger quality] No request IDs, no key redaction, worker default `OBSERVABILITY_SERVICE_NAME` is `tinygeniushub-web` (`env.ts:101`). Obs drills not in `release:check`.

### Low
- README still says "BullMQ worker scaffold" (`README.md:6`) despite 9 wired processors.
- `APP_VERSION` default `0.1.0` (`env.ts:102`) vs package version.
- Compose web healthcheck only `/api/health`, not ready; worker has no healthcheck (`docker-compose.yml:85-89,94-139`).
- `.env.example` has no `BUNNY_*` keys (scout).
- `R2_PUBLIC_URL` used by blog image upload is not in `env.ts` schema (scout).
- Vietnamese route aliases `/gioi-thieu`, `/lien-he` exist; not a full locale-prefixed tree.

## Tests covering this slice
- `src/worker/queue.test.ts` — enqueue wrappers + newsletter exports **gone**. Does not run processors, Redis, or bootstrap intervals.
- `scripts/e2e-smoke.mjs` — `/api/health` 200 + `status=ok`; `/api/health/ready` 200 or 503. Hole: no DB-down/Redis-down unit cases.
- `scripts/e2e-security-abuse.mjs` — ready allowlist 403 + ready IP 429 burst. Hole: not a functional ready test.
- `src/modules/platform/__tests__/security-access-guard.test.ts` — allowlist deny. Hole: not the route.
- `scripts/e2e-obs-alert-drills.mjs` (`pnpm test:obs:drills`) — JSON log signals for auth fail, bad webhook sig, unauthorized report email. Hole: not in `release:check`; does not test health payload or Sentry (none).
- `src/modules/reports/__tests__/email-delivery-resend.test.ts` + `email-delivery-service.test.ts` — resend + mock weekly email. Hole: no dedicated brevo delivery test (only `src/app/api/webhooks/brevo/route.test.ts`).
- `src/lib/email/__tests__/email-feature-flags.test.ts` — feature-flag skip.
- `src/components/language-switcher.test.tsx` + `src/i18n/translator.test.ts` + `tests/e2e/language-switching.spec.ts` — cookie locale + homepage EN/VI. Hole: blog/reader/admin not covered; no URL-locale (none exists).
- `src/app/api/reader/auth/{login,signup}/route.test.ts`, bookmarks + notifications route tests — reader API. Hole: no e2e reader portal.
- `src/modules/progress/__tests__/evidence-media-service.test.ts` + `src/app/api/storage/mock-upload/route.test.ts` — mock R2 signed upload. Hole: no live R2; no delete tests (no delete API).
- **Missing:** no tests under `src/app/api/health/`, `src/app/api/cron/`, `src/app/api/webhooks/bunny/`, `scripts/ops/*` backup scripts, deploy workflows.

## Production-readiness blockers
- Worker `bootstrap()` enqueues weekly reports + emails on every process start (`src/worker/index.ts:135-141`) — do not ship this scheduler as-is.
- Certificate PDFs are not stored (`generate-certificate.ts:33-56`) if certificates are in the launch claim.
- No object-store delete path if evidence/media retention is a privacy requirement.
- No Sentry/metrics/alerting beyond PM2 logs + optional `health-monitor.sh` (`pm2 restart all`). Acceptable only if ops explicitly waive error monitoring.
- Do not treat `docker compose up` as production: it runs Next **dev** with seed and weak secrets.
- Confirm a **single** cron driver for VPS (HTTP `/api/cron` vs worker `setInterval`). `vercel.json` does not schedule DigitalOcean.

## Unresolved questions
- Is production actually on DigitalOcean PM2 only, or is there a Vercel project still receiving the 4 crons? Not probed (no production hits).
- Is `health-monitor.sh` installed on the droplet crontab? File exists; install state unknown.
- Are `BACKUP_OFFSITE_ENABLED` / GDrive rclone remotes configured in prod `.env`? Scripts exist; runtime unknown.
- Bunny webhook signature algorithm in live Bunny dashboard vs raw-secret compare — not verified against Bunny docs in this pass.
- Whether `readinessAllowlistCidrs` in prod would 403 deploy/local probes — config is data, not code.
