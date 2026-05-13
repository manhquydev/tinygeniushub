# TinyGenius Hub (MVP Rebuild)

MVP foundation rebuilt from handover docs (`docs/handover/handover-master-agent-ready.md`) using:
- Next.js 16 + React 19 + TypeScript
- Prisma + PostgreSQL 16
- Redis + BullMQ worker scaffold
- Modular monolith domain boundaries

## Implemented Scope

### Product flows
- Parent signup/login/logout with Better Auth (secure signed session cookie).
- Child profile management with plan-based limit enforcement (3 default, 5 for Family+).
- Trial lesson mission (English + Math) and lesson completion endpoint.
- Idempotent completion handling and one reward grant per child per lesson.
- Weekly report generation (in-app data model + API).
- Weekly report email delivery pipeline (queue + worker + opt-in aware dispatch).
- Billing webhook ingestion with idempotency and audit trail.
- Billing checkout session API with provider adapter abstraction (`mock_gateway` default, `stripe` available).
- CI release gate workflow with security/perf evidence artifacts.
- Observability baseline: structured logs + health/readiness APIs.

### Technical modules
- `identity`
- `content`
- `learning`
- `progress`
- `billing`
- `reports`
- `admin`
- `referral`
- `platform`

## Setup

1. Start full local stack with Docker (web + worker + postgres + redis):
```bash
docker compose up -d --build
```

2. Open app:
```bash
# http://localhost:3000
```

3. Stop stack:
```bash
docker compose down
```

4. Follow logs when needed:
```bash
docker compose logs -f web worker
```

`web` service will auto-run `prisma migrate deploy` and seed demo data on startup (`RUN_DB_SEED=true`).
Blog demo posts are disabled by default; set `SEED_BLOG_DEMO_CONTENT=true` only when you explicitly need sample blog content.

5. Optional: run without Docker (manual local dev):
```bash
pnpm install
docker compose up -d postgres redis
pnpm dev
pnpm worker:dev
```

## Grapuco MCP (Codex Dev Loop)

Reference docs: https://www.grapuco.com/docs

1. Create local MCP config for Codex at `.codex/.mcp.json`:
```json
{
  "mcpServers": {
    "grapuco": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.grapuco.com/mcp",
        "--header",
        "X-Api-Key: YOUR_API_KEY"
      ],
      "env": {},
      "disabled": false
    }
  }
}
```

2. Authenticate + index repo to Grapuco:
```bash
pnpm grapuco:login
pnpm grapuco:init
pnpm grapuco:ingest
```

3. During development, keep architecture graph in sync:
```bash
pnpm grapuco:push
# or continuous mode
pnpm grapuco:watch
```

4. Optional checks:
```bash
pnpm grapuco:status
pnpm grapuco:inspect
pnpm grapuco:quality-report
pnpm grapuco:semantic-search-fallback -- --query "checkout flow"
pnpm grapuco:critical-file-impact-fallback -- --file src/modules/courses/course-checkout-service.ts
```

Notes:
- You can pass key non-interactively: `pnpm grapuco:login -- --api-key <YOUR_API_KEY>`.
- `grapuco:ingest` runs with `--all` (embeddings + flows) for better MCP context.
- `grapuco:quality-report` compares current flow metrics vs baseline (`scripts/grapuco/flow-quality-baseline.json`) in warning mode.
- `grapuco:semantic-search-fallback` auto-fallbacks to `search_code` when semantic results are empty.
- `grapuco:critical-file-impact-fallback` supplements zero-flow impact results with dependency evidence.
- Keep API key in local secret storage; do not commit real keys.
- Team daily checklist (before editing files): `docs/grapuco-mcp-daily-workflow-checklist.md`.
- Analysis report for current project graph quality and optimization points: `docs/grapuco-mcp-analysis-report-2026-04-05.md`.

## Core Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET|POST|PATCH|PUT|DELETE /api/auth/[...all]` (blocked; canonical auth routes only)
- `GET /api/children`
- `POST /api/children`
- `PATCH /api/children/:childId`
- `DELETE /api/children/:childId`
- `GET /api/children/:childId/activity-today`
- `GET /api/lessons/today?childId=...`
- `POST /api/lessons/:lessonId/watch/session`
- `POST /api/lessons/:lessonId/watch/heartbeat`
- `POST /api/lessons/:lessonId/watch`
- `POST /api/lessons/:lessonId/complete`
- `POST /api/evidence/media/upload-url`
- `GET /api/reports/weekly`
- `POST /api/reports/generate`
- `POST /api/reports/send-email`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/cron/weekly-reports`
- `GET /api/cron/streak-alerts`
- `POST /api/billing/webhooks/mock`
- `POST /api/billing/webhooks/stripe`
- `POST /api/billing/webhooks/payos`
- `POST /api/billing/checkout`
- `GET /api/courses/checkout/return?orderCode=...`
- `GET /api/admin/overview`
- `GET /api/admin/payments?limit=&status=`
- `GET /api/admin/webhooks?limit=&status=`
- `GET|PATCH /api/admin/security/rate-limits`
- `GET /api/admin/security/edge-export`
- `PATCH /api/admin/lessons/:lessonId/trial-flag`
- `GET /api/referrals/me`
- `POST /api/referrals/claim`
- `GET /api/health`
- `GET /api/health/ready`

## Quality Commands

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
pnpm test:e2e:p0
pnpm test:e2e:auth-timing
pnpm test:e2e:auth-session
pnpm test:e2e:auth-session:https
pnpm test:e2e:integrity
pnpm test:e2e:full
pnpm test:e2e:security
pnpm test:e2e:staging-providers
pnpm test:obs:drills
pnpm test:local:full
pnpm security:baseline
pnpm perf:sanity
pnpm release:check
```

## Backup & Recovery Commands

```bash
pnpm backup:create
pnpm backup:create -- --offsite
pnpm backup:create -- --gdrive
pnpm backup:verify -- --file=backups/postgres/<backup-file>.dump
pnpm backup:restore -- --file=backups/postgres/<backup-file>.dump
pnpm backup:offsite:upload -- --file=backups/postgres/<backup-file>.dump
pnpm backup:gdrive:upload -- --file=backups/postgres/<backup-file>.dump
pnpm backup:gdrive:list
pnpm backup:gdrive:download -- --remote-key=postgres/prod/<backup-file>.dump
pnpm admin:seed-super
```

Runbook:
- `docs/deployment/backup-restore-runbook.md`

`security:baseline` supports:
- threshold tuning via `SECURITY_FAIL_ON` (`info|low|moderate|high|critical`, default `high`)
- scope tuning via `SECURITY_FAIL_SCOPE` (`prod|all`, default `prod`)

## Plan Documentation

Implementation plan and phases:
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/plan.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-01-foundation-architecture.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-02-core-modules.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-03-critical-workflows.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-04-ui-qa-ops.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-05-release-gates-email-delivery.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-06-ci-hardening-release-evidence.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-07-observability-health-probes.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-08-p0-end-to-end-journey-coverage.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-09-backend-db-integrity-hardening.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-10-better-auth-migration.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-11-mvp-gap-closure-production-readiness.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-12-security-ddos-hardening.md`

## Notes

- Docs are in English; UI copy is Vietnamese by policy.
- Set `ADMIN_EMAILS` in `.env` (comma-separated) to enable `/admin` access for specific parent accounts.
- Configure rate-limit proxy trust with `RATE_LIMIT_TRUST_PROXY` and `RATE_LIMIT_TRUSTED_HOPS` based on deployment topology.
  - IP headers (`x-forwarded-for`, `x-real-ip`) are only trusted when `RATE_LIMIT_TRUST_PROXY=true`.
  - If set to `false`, requests are bucketed as `unknown` for app-layer IP controls (safer against spoofed client headers, but coarser).
- Admin security endpoint (`GET|PATCH /api/admin/security/rate-limits`) now supports:
  - per-endpoint rate-limit overrides
  - `ddosMode` (`normal|elevated|emergency`)
  - `globalLimitMultiplier` (0.2-1.0)
  - `blockedIpCidrs` and `readinessAllowlistCidrs`
- Sensitive mutation endpoints use fail-closed mode for rate-limit store outages (`storeFailureMode=deny`) to avoid bypass when Redis is unavailable.
- Configure watch-session TTL with `WATCH_SESSION_TTL_SECONDS` for video watch flows.
- Storage upload pipeline supports `STORAGE_PROVIDER=mock_r2|cloudflare_r2` (`mock_r2` default).
- Billing provider supports `mock_gateway|stripe` via `BILLING_PROVIDER`.
- Course checkout provider supports `mock_gateway|payos` via `COURSE_PAYMENT_PROVIDER`.
- Report email provider supports `mock_email|resend|brevo` via `REPORT_EMAIL_PROVIDER`.
- Required env when using real providers:
  - `BILLING_PROVIDER=stripe` -> `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRETS` (optional override `STRIPE_API_BASE_URL`, `STRIPE_WEBHOOK_TOLERANCE_SECONDS`).
  - `COURSE_PAYMENT_PROVIDER=payos` -> `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` (optional override `PAYOS_API_BASE_URL`).
  - `REPORT_EMAIL_PROVIDER=resend` -> `REPORT_EMAIL_RESEND_API_KEY`, `REPORT_EMAIL_FROM` (optional: `REPORT_EMAIL_REPLY_TO`, `REPORT_EMAIL_TO_OVERRIDE`).
  - `REPORT_EMAIL_PROVIDER=brevo` -> `REPORT_EMAIL_BREVO_API_KEY`, `REPORT_EMAIL_FROM` (optional: `REPORT_EMAIL_BREVO_API_BASE_URL`, `REPORT_EMAIL_REPLY_TO`, `REPORT_EMAIL_TO_OVERRIDE`, `REPORT_EMAIL_FROM_NAME`).
  - Brevo SMTP relay reference: server `smtp-relay.brevo.com`, ports `587|2525` (or `465` with SSL/TLS), use SMTP key (not API key) for SMTP relay connections.
- PayOS webhook configuration:
  - Method: `POST`
  - Endpoint: `https://<your-domain>/api/billing/webhooks/payos`
  - Ensure `BETTER_AUTH_URL` is your production HTTPS domain so checkout return/cancel URLs are valid.
- Detailed runbook: `docs/payos-course-checkout-setup.md`
- `pnpm test:e2e:full` expects two local accounts:
  - parent: `demo.parent@tinygeniushubvn.tech` / `DemoPass123!`
  - admin: `demo.admin@tinygeniushubvn.tech` / `DemoAdmin123!`
  Create/update admin seed account with:
  `SEED_PARENT_EMAIL=demo.admin@tinygeniushubvn.tech SEED_PARENT_PASSWORD=DemoAdmin123! pnpm db:seed`
- `pnpm test:e2e:security` validates: rate-limit 429, blocked IP policy, readiness allowlist deny, ddos multiplier effect, burst-concurrency throttling (watch/report/readiness), edge export sync.
- `pnpm test:local:full` runs full local flow end-to-end (infra up, migrate, seed, build, e2e smoke/p0/full/security).
- Nightly CI workflow: `.github/workflows/nightly-local-full.yml` runs `pnpm test:local:full` on schedule/manual trigger.
- DigitalOcean SSH deploy automation:
  - workflow: `.github/workflows/deploy-digitalocean-ssh.yml`
  - setup guide: `docs/deployment/digitalocean-ssh-agent-setup.md`
- Vercel Cron setup:
  - `vercel.json` includes weekly report job at Sunday 20:00 VN (`0 13 * * 0` UTC) and streak alert job at 18:00 VN (`0 11 * * *` UTC).
  - Set `CRON_SECRET` in environment variables and send it via `x-cron-secret` header (or Bearer token in `Authorization`) when invoking cron endpoints.
