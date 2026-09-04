# Slice: cplan
# Agent: cplan
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
55/100 — Core parent/child/lesson/report/admin loops exist in source; PDR “all delivered ✓” and changelog “all 12 phases complete” are false. Phase 11 is still Planned. Pricing and `/for-schools` are redirects. Several claimed surfaces are stubs, killed, or hardcoded-wrong.

## Quality score
36/100 — Docs systematically over-claim. Dead plan paths, killed features still marked done, unsourced KPIs, price/limit mismatches between UI and billing.

## What is actually implemented
- Next.js 16.1.7 + React 19 + Prisma + PostgreSQL + Redis + BullMQ modular monolith. `package.json:2-12`, `src/modules/*` (17 domain dirs, not 14).
- Parent auth via Better Auth behind custom `/api/auth/{signup,login,logout}`; catch-all `/api/auth/[...all]` returns 404. `src/app/api/auth/[...all]/route.ts:7-24`.
- Child CRUD with serializable create. Limit is **hardcoded 1**, not plan-based 3/5. `src/modules/progress/children-service.ts:6,39-44`.
- Track→Level→Unit→Lesson hierarchy + seed. `prisma/seed.ts` lesson slugs; `src/modules/content/service.ts`.
- Lesson watch/heartbeat/complete, unique reward grant, weekly reports + worker email dispatch. `src/modules/learning/completion-service.ts`; `src/worker/queue.ts:10-20`.
- Billing adapters `mock_gateway|stripe` + PayOS course checkout; **defaults mock**. `src/lib/env.ts:47-48,77`; `.env.example:9-10,18,35`.
- Admin CMS: 16 catalog modules with real pages/APIs (overview, analytics, users, courses, content, operations, gift-codes, site-settings, blog, orgs, staff, security, log, impersonation, skills, feature-flags). `src/components/admin/admin-module-catalog.ts:51-194`.
- Bunny Stream upload + signed embed + encoding webhook. `src/lib/bunny-stream-client.ts`; `src/app/api/webhooks/bunny/route.ts:14-85`.
- Course storefront, reviews, gift-code redeem, pdf-lib certificate generator (PDF not persisted — see findings). `src/modules/courses/{course-service,course-review-service,gift-code-service,certificate-service}.ts`.
- Teacher dashboard + bulk enroll + class PDF. `src/app/(main)/teacher/dashboard/page.tsx`; `src/modules/organizations/class-report-service.ts:7`.
- Adaptive engine: skill tree, CAT placement, spaced repetition, heuristic next-lesson. `src/modules/adaptive/{placement-test-service,content-sequencing-engine,spaced-repetition-service}.ts`.
- Abeka schema + import + package-config (8 packages) + curriculum UI. `prisma/schema.prisma` CurriculumPackage; `src/modules/billing/package-config.ts:12-21`.
- Garden journey/tier unlock. `src/modules/garden/journey-service.ts:20-71`. No daily-challenge symbol in `src/modules/garden`.
- Reader portal + blog CMS + related posts. `src/modules/reader/*`; `src/modules/blog/related-posts-service.ts`.
- Referral codes + Zalo/Facebook share URLs. `src/modules/referral/service.ts`; `src/modules/sharing/share-link-builder.ts:8-51`.
- Health/ready, Redis rate-limit, CI `release-check.yml`, DigitalOcean SSH deploy. `src/app/api/health/route.ts:4-12`; `src/lib/rate-limit.ts:20-40`; `.github/workflows/release-check.yml`.
- Caregiver invite/accept **implemented** despite handover deferral. `src/modules/caregivers/service.ts`.
- Newsletter **killed** in this tree (no page, no `BlogNewsletterSubscriber`, queue test asserts absence). `src/worker/queue.test.ts`; `docs/project-changelog.md:16-17`.

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
|---|---|---|---|
| Plan lives at `plans/2026-02-20-cungcontuhoc-mvp-rebuild/` | `README.md:210-223` | Only `plans/_archive/2026-02-20-cungcontuhoc-mvp-rebuild/` exists | Doc-lie |
| All 12 MVP rebuild phases complete | `docs/project-changelog.md:335` | `plan.md:20-31` phases 1–10 Completed, **phase 11 Planned**; phase 12 file not in plan table | Doc-lie |
| Phase 01–10 acceptance met | archived phase files, all `Status: Completed` | 01,03–05,07–09 mostly Done. Phase 02 child-cap AC **not met** (limit=1). Phase 06 Node 20 vs CI Node 22. Phase 10 `[...all]` is 404 not a live Better Auth surface | Partial |
| Phase 11 launch-ready (real Stripe/R2/email, Sentry, payout ledger, branch protection) | `phase-11-mvp-gap-closure-production-readiness.md:70-76` | Defaults `mock_gateway` / `mock_r2` / `mock_email`. No `@sentry/*`. No PayoutLedger model. Plan still Planned | Partial / Missing |
| Phase 12 DDoS complete (edge origin lock, WAF, drilled alerts) | changelog “12 complete”; `phase-12-security-ddos-hardening.md:105-111` | App Redis limiter + runbook exist. No product-repo Cloudflare origin-lock/WAF apply. No Sentry paging | Partial |
| Child limit 3 Standard / 5 Family+ | handover §8; `plan.md:34`; `plan-config.ts:16-35` | `CHILD_PROFILE_LIMIT = 1` + parent UI `childLimit = 1` | Doc-lie vs locked rule |
| Pricing page with 30-day refund | PDR:81-82 | `src/app/(main)/pricing/page.tsx:3-5` **redirects to `/courses`** (111B stub). Same pattern as `/for-schools` | Doc-lie |
| 13 VN SEO blog articles | PDR:83 | Canonical `prisma/seeds/blog-seed.ts` has **10** published slugs. `prisma/seed.ts` also upserts 3 TIP/GUIDE + 10 files. Not a clean 13 | Partial |
| Lifecycle D0/D3/D7 | PDR:84 | Schema `TRIAL_WELCOME, D1, D3, D5, D7, WINBACK_D30, RENEWAL_14D` `schema.prisma:72-79` | Partial |
| GA4 + Meta Pixel | PDR:85 | Consent-gated loader `src/components/legal/analytics-by-consent.tsx`; `src/app/layout.tsx:49-69` | Done (env-gated) |
| Referral Zalo/Facebook | PDR:86 | `share-link-builder.ts:47-51` | Done |
| Bunny Stream + admin video CMS + signed URLs + encoding status | PDR:88-92 | Client + TUS uploader + webhook | Done |
| Course catalog + one-time purchase + reviews + gift codes | PDR:95-100 | Storefront, PayOS path, reviews, gift-code service | Done |
| 20% subscriber discount | PDR:97 | No subscriber-discount logic in `src/modules/courses` | Missing / Doc-lie |
| Certificate generation (pdf-lib) | PDR:98 | PDF bytes generated then **discarded**; URL stored, object not uploaded `generate-certificate.ts:30-56` | Partial |
| B2B org + teacher dashboard + at-risk + class PDF + CSV enroll | PDR:102-106 | Org models + `/teacher/*` + at-risk count `teacher/dashboard/page.tsx:42-46` + PDF. Admin CSV enroll **deleted** (`changelog.md:19`). Teacher path remains | Partial |
| B2B landing `/for-schools` | PDR:107 | `for-schools/page.tsx:1-5` **redirects to `/courses`** | Doc-lie |
| Free preview + parent script + parent course progress | PDR:110-113 | Preview policy + `LessonParentScriptPanel` + `/parent/courses` | Done |
| Related course recommendations | PDR:114 | No related-course helper in course storefront/detail | Missing / Doc-lie |
| Placement test on signup (30 questions) | PDR:118 | Bank 30 MATH + 30 PHONICS; tests created `minItems: 10, maxItems: 15` `placement-test-seed.ts:756-801`. Starts on child/domain, not parent signup | Partial |
| AI next-lesson sequencing | PDR:120 | Heuristic SR + skill readiness; cold start returns null. Not an LLM `content-sequencing-engine.ts:1-35` | Partial |
| Newsletter signup + verification | PDR:126; codebase-summary:44,210-217 | Feature-killed; no admin newsletter page; no schema model | Missing / Doc-lie |
| Comment moderation + related articles | PDR:127-128 | Admin comments + `related-posts-service.ts` | Done |
| Abeka PreK–K + assignments | PDR:130-136 | Schema/import span K4–G12. Parent browser feeds **`mockGrades`/`mockLessons`** `browser/page.tsx:14-15,248-250`. Student daily `demo-child` + `console.log` `student/daily/page.tsx:40-49` | Partial |
| Garden daily challenge | PDR:142 | Journey/tiers exist. Zero `dailyChallenge` matches under `src` | Missing / Doc-lie |
| Garden journey + mascot | PDR:139-143 | Journey service + mascot components | Partial (no daily challenge) |
| MFA ready | PDR:156 | No `mfa`/`twoFactor` in `src` | Missing / Doc-lie |
| Encryption at rest (PG + R2) | PDR:157 | Claim only in PDR/skills docs. No app-level at-rest config | Missing / Doc-lie |
| Observability: Winston or Pino + Sentry | PDR:174-176 | Custom JSON `console.*` logger `logger.ts:42-68`. No `@sentry` in `package.json` | Doc-lie |
| 10 BullMQ queues | PDR:169; codebase-summary:210-223 | 9 queues in `src/worker/queue.ts:10-44`. Newsletter queue removed | Doc-lie |
| 14 domain modules | PDR:190; codebase-summary:128 | 17 dirs including caregivers/courses/blog/garden/adaptive/organizations/reader/sharing | Partial |
| Test coverage 82% / >80% | PDR:189,212 | Feb matrix `81.65%`; `docs/implementation-plan.md` `81.13%`. Vitest coverage not gated. No current run this audit | Partial / stale |
| MAU 1,500+, revenue 35M₫, retention 62%, NPS 58, uptime 99.95%, LCP 2.1s | PDR:204-212; roadmap:140-144 | No measurement source in repo | Doc-lie |
| Hetzner Singapore primary | handover `11.1` `:257-263` | Production docs: DigitalOcean `152.42.246.218` `project-roadmap.md:50-53` | Doc-lie / strategy drift |
| Caregiver post-MVP | handover `:99`, phase-11 out-of-scope | Full `src/modules/caregivers` + APIs | Scope drift (implemented anyway) |
| Admin full CMS + funnel/cohort + email campaigns + CSV enroll | `project-roadmap.md:117-122` | Funnel/cohort services **deleted** `changelog.md:18`. Campaigns absent. Admin bulk-enroll deleted. Catalog itself marks courses/operations/gift-codes/orgs/security `partial` | Partial / Doc-lie |
| `/admin/blog/newsletter` | `codebase-summary.md:44` | No newsletter route/page | Doc-lie |
| Stripe live | roadmap P1 `:155`; README billing | Adapter exists; default mock; prod forbids course mock `env.ts:210-211` | Partial |
| Backup/Restore UI + Queue/Job ops | roadmap P0 `:149-151` | CLI scripts only. No `/admin/backup*` | Missing (backlog honest) |
| Next: Mobile app, AI tutor, pSEO 50+, affiliate, international | PDR:226-234 | Correctly not delivered. Teacher dashboard **does** exist while “Teacher Platform” listed as next (expansion vs existence) | Done (as next, not as shipped) |

## Findings
### Critical
- [Locked child-limit broken] `src/modules/progress/children-service.ts:6,39-44` — `CHILD_PROFILE_LIMIT = 1` and error “one primary child profile.” Parent UI `src/app/(main)/parent/children/page.tsx:45` `childLimit = 1`. Handover/plan/plan-config require 3 / Family+ 5. Family+ is unsellable as specified. Fix: read `Subscription.childProfileLimit` inside the create transaction; delete hardcoded 1.
- [Checkout price ≠ marketed price] `src/modules/billing/plan-config.ts:16-17` charges 149,000 VND; `src/components/checkout-plan-button.tsx:8-10` analytics/UI 99,000 and comment claims it “mirrors plan-config.ts”. Going live on Stripe charges 50k more than the button implies. Fix: single source of truth; stop duplicating amounts in the client.
- [Phase 11 still Planned while docs say shipped] `plans/_archive/2026-02-20-cungcontuhoc-mvp-rebuild/plan.md:31` vs `docs/project-changelog.md:335`. Defaults remain mock billing/storage/email. No Sentry. No payout ledger. Not production-complete.

### High
- [PDR Delivered Features are a checkbox farm] `docs/project-overview-pdr.md:78-143` — 20% subscriber discount, related courses, daily challenge, newsletter, `/for-schools` and **`/pricing` landings**, MFA, Sentry, Winston/Pino, 10 queues, 82% coverage, MAU/revenue/NPS/uptime/LCP “current” numbers: missing, stubbed, or unsourced. Impact: agents and humans will treat fiction as done. Fix: re-check every ✓ against source; move killed/stub items to Next Phase.
- [Marketing landings are redirects] `src/app/(main)/pricing/page.tsx:3-5` and `src/app/(main)/for-schools/page.tsx:3-5` — both `redirect("/courses")`. PDR marks dedicated pricing + B2B landing delivered. Impact: `/pricing` and school GTM URLs dump onto the course catalog. Fix: real pages or un-check.
- [Certificate worker does not store the PDF] `src/worker/jobs/generate-certificate.ts:30-56` — generates bytes, logs size, writes `/api/certificates/${id}` without `put`. GET may regenerate; R2 path is dead. Fix: upload bytes or drop the worker lie.
- [Newsletter claimed after intentional kill] PDR:126, `codebase-summary.md:44,132,176`, `codebase-summary.md:210-217` blog-newsletter queue vs `changelog.md:16-17` and empty newsletter glob. Impact: rebuild/re-enable of a deleted product. Fix: scrub docs.
- [Funnel/cohort + admin email campaigns + admin CSV enroll claimed delivered] `project-roadmap.md:117-122` vs `changelog.md:18-19` (services/routes deleted). Remaining analytics: GA4/SOT snapshot + retention, not cohort/funnel modules.
- [Abeka parent browser is mock data] `src/app/(curriculum)/parent/curriculum/browser/page.tsx:14-15,248-250` — comment “Mock data for development”; `LessonBrowser` gets `mockLessons`/`mockGrades`, not Prisma. Combined with student daily `demo-child`/`console.log`, Abeka UI is not wired to the import pipeline.

### Medium
- [Plan path rot] `README.md:210-223` points at a non-existent directory; real files are under `plans/_archive/`.
- [Better Auth catch-all blocked] Phase 10 deliverable claimed `app/api/auth/[...all]` handler; `route.ts:7-24` 404s every method. README documents the block — phase-10 file does not.
- [Handover vs ops geography] Hetzner SG + Vietnamese UI vs DigitalOcean VN + English-primary i18n in progress. Two “sources of truth.”
- [Admin catalog `health: complete` overstates] Audit log: 50–200 rows, no filter/export (`roadmap.md:152` still P0). Site settings: footer Facebook/YouTube only. Feature flags: boolean on/off, not rollout %.
- [Referral has no payout ledger] Phase 11 AC3. `src/modules/referral/service.ts` attribution/claim only. Grep `payout` in `src` empty.
- [Auto-charge is a predicate, not a scheduler] `src/modules/billing/renewal-service.ts:11-41` lists due subs; no worker charges them.
- [Phase 12 edge unproven] Redis limiter + `docs/security/ddos-abuse-runbook.md` exist. No Cloudflare WAF/origin-lock IaC in this repo. `SECURITY_FAIL_ON` example `critical` vs script default `high`.
- [Caregiver shipped against deferral] Extra surface/authz to maintain; handover still says post-MVP.
- [UI/backend monthly price comment is a lie] `checkout-plan-button.tsx:8`.

### Low
- Phase 06 claims Node 20; CI uses Node 22 `.github/workflows/release-check.yml:61-64`.
- `APP_VERSION` default `0.1.0` in env vs `package.json` `0.2.0`.
- Admin blog hub links `/admin/blog/posts/${id}` while only `posts/[id]/edit` exists. [INFERENCE from AdminCms scout]
- Wave 2 admin i18n/header standardization still pending; Wave 1 changelog says unreleased even though cuts are in this tree.
- `package-config.ts:4-6` still documents “Lite 99K → 149K” while PDR/UI keep 99K.

## Completeness matrix (major capabilities)

| Capability | MVP need | PDR claim | Code | Score |
|---|---|---|---|---|
| Identity / session | in | ✓ | Custom Better Auth wrapper; no MFA | 75 |
| Child profiles | in | ✓ | CRUD yes; limit=1 | 45 |
| Content hierarchy + trial lessons | in | ✓ | Present + Bunny | 80 |
| Lesson complete / rewards / streak | in | ✓ | Idempotent complete; stars/badges thin | 75 |
| Parent dashboard + weekly report | in | ✓ | In-app + queue; email default mock | 70 |
| Trial→paid + webhooks | in | ✓ | Adapters + idempotent webhooks; default mock; price mismatch | 50 |
| Admin users/content/payments | in | ✓ | Wired CMS; several modules self-rated partial | 70 |
| Referral | module | ✓ | Codes + share; no payout | 55 |
| Course commerce | extension | ✓ | Catalog/checkout/reviews/gifts; no 20% sub discount; cert not stored | 65 |
| B2B / teacher | extension | ✓ | Org+teacher+PDF; `/for-schools` redirect; admin CSV gone | 45 |
| Adaptive engine | extension | ✓ | Real services; not LLM; not on parent signup | 60 |
| Abeka | extension | ✓ | Import/schema/packages exist; parent browser mocks; student daily stub | 40 |
| Garden | extension | ✓ | Journey; no daily challenge | 55 |
| Reader / blog | extension | ✓ | Auth/bookmarks/comments; newsletter killed | 60 |
| Observability / Sentry | phase 07/11 | ✓ | Health/ready + JSON logs; no Sentry | 40 |
| Edge DDoS / WAF | phase 12 | ✓ | App limiter; edge unproven | 45 |
| Docs honesty | — | — | Path lies, checkbox lies, fake KPIs | 25 |

**Ship-readiness**
- **MVP (handover §7.1):** Partial. Core loop can demo on mocks. Locked child-limit and monthly price are wrong. Public `/pricing` is a redirect. Not “foundation-complete and honest.”
- **Production:** Not ready. Phase 11 Planned. Mock defaults. No Sentry/alerts. Certificate/R2 persistence hole. No live-provider evidence in this audit.
- **PDR-complete:** No. Treat PDR Delivered Features as marketing residue, not a backlog.

## Tests covering this slice
- `src/modules/progress/__tests__/children-service.test.ts` — concurrency/limit helper. Hole: does not fail if limit stays 1 vs plan 3/5.
- `scripts/e2e-p0-journey.mjs` / `pnpm test:e2e:p0` — signup→child→complete→report. Hole: one-child only; no Family+; no live Stripe.
- `src/worker/queue.test.ts` — asserts newsletter queue gone. Docs still claim it.
- `src/app/api/auth/[...all]/route.test.ts` — 404 catch-all. Contradicts phase-10 “handler” wording.
- `src/modules/adaptive/__tests__/placement-test-engine.test.ts` + scorer — CAT unit tests. Hole: not “30 questions on signup.”
- `src/modules/courses/course-pricing.test.ts` — sale windows. Hole: no 20% subscriber case (feature absent).
- `scripts/e2e-security-abuse.mjs` — rate-limit/DDoS app layer. Hole: not live WAF.
- `docs/testing/backend-production-readiness-matrix.md` — 2026-02-21 snapshot; stale vs current PDR numbers.
- No test that `/pricing` or `/for-schools` is a landing page (both redirect).
- No test that certificate bytes hit object storage.
- Coverage 82% / 1,500 MAU / 35M₫ / 99.95% uptime: **no test or telemetry artifact in repo**.

## Production-readiness blockers
- Do not ship Family+ or “3 children” marketing while `CHILD_PROFILE_LIMIT = 1`.
- Do not enable live Stripe until UI amount and `plan-config.ts` match.
- Do not call the system production-complete while phase 11 is Planned and providers default to mock.
- Do not promise newsletter, `/pricing` page, `/for-schools` B2B landing, daily challenges, 20% subscriber discount, MFA, or Sentry.
- Persist certificates or stop showing “See certificate” as if R2 wrote a file.
- Replace PDR success-metric “Current” column or mark unknown.

## Unresolved questions
- Live prod env: `BILLING_PROVIDER`, `COURSE_PAYMENT_PROVIDER`, `STORAGE_PROVIDER`, `REPORT_EMAIL_PROVIDER` on `tinygeniushubvn.tech` — not readable from this tree. [INFERENCE] README/roadmap still list Stripe live as P1.
- GitHub branch protection requiring `release-check` / `test:e2e:p0` — not inspectable here.
- Whether Admin Consolidation Wave 1 is deployed (changelog “Unreleased”) vs this working tree already containing the newsletter kill.
- Current `pnpm test -- --coverage` vs Feb 2026 `81.65%`.
- Whether Abeka 8-package checkout is used in production or only `PlanCode` TRIAL/MONTHLY/YEARLY_* .
