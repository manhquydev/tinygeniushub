# TinyGenius Hub — Codebase quality + completeness (arbiter)

Date: 2026-09-04
Coordinator: herdr omp `xai-oauth/grok-4.6 --advisor`
Workers: 2 tabs × 5 panes (`quality` w17:t2, `completeness` w17:t3)
Method: parallel slice audits, then coordinator evidence check of Critical claims.

## Verdict

**mixed — demoable MVP core, not production-complete, docs over-claim.**

| Lens | Score | One line |
|---|---|---|
| Completeness vs README MVP | **62/100** | Auth, child CRUD, watch/complete, weekly report, health exist. Child cap 3/5, pricing UI, EN+MATH today-mission do not match claims. |
| Completeness vs PDR “delivered ✓” | **42/100** | Adaptive/Abeka/garden-challenge/B2B landing/newsletter/MFA/Sentry/20% discount are partial, mock, killed, or missing. |
| Code quality | **56/100** | Real domain services + webhook locks; god files, dual Prisma clients, unsigned Abeka/package webhooks, tests that mock journeys. |
| Production-readiness | **not ready** | Phase 11 still Planned. Defaults mock billing/R2/email. No Sentry. Worker bootstrap re-fires jobs. |

Do not treat `docs/project-overview-pdr.md` Delivered Features or `docs/codebase-summary.md` as ground truth.

## Herdr layout (this workspace `w17`)

Did **not** close `w13` flow or `w18` bot_shop (other projects, live agents).
`w17` had only the coordinator pane — nothing unused to close.

| Tab | Panes | Agents |
|---|---|---|
| `quality` `w17:t2` | p2,p5,p6,p3,p4 | qarch, qsec, qbe, qfe, qtest |
| `completeness` `w17:t3` | p7,p9,pB,p8,pA | cprod, clearn, ccom, cops, cplan |

Slice reports: `plans/reports/codebase-audit-2026-09-04/{qarch,qsec,qbe,qfe,qtest,cprod,clearn,ccom,cops,cplan}.md`

## Slice scores

| Slice | Completeness | Quality | Verdict |
|---|---|---|---|
| qarch architecture | 60 | 46 | mixed |
| qsec security | 71 | 64 | mixed |
| qbe backend | 62 | 70 | mixed |
| qfe frontend | 58 | 54 | mixed |
| qtest tests/CI | 61 | 47 | mixed |
| cprod product flows | 64 | 72 | mixed |
| clearn learning | 48 | 62 | mixed |
| ccom commerce | 51 | 58 | mixed |
| cops ops | 74 | 68 | mixed |
| cplan plan/docs | 55 | 36 | mixed |

## What is actually solid

- Better Auth canonical `/api/auth/{signup,login,logout}`; catch-all 404. Cookie e2e exists.
- Lesson watch HMAC+Redis TTL, heartbeat, idempotent complete + unique `RewardGrant`.
- Subscription webhook: signature + `WebhookEvent` unique + advisory lock (Stripe/mock).
- Course catalog + PayOS/mock checkout + enrollment.
- Weekly report model/API + email dispatcher (opt-in flag exists; no parent writer).
- Admin CMS catalog (16 modules), Bunny upload/webhook, blog CMS, reader separate cookie.
- Health + ready (DB+Redis), Redis fail-closed rate-limit, ddosMode, backup CLI scripts.
- 17 domain modules; 9 BullMQ queues (not 10); 111 Vitest files / ~637 cases; 21 Playwright specs.

## Coordinator-verified Critical (re-read source)

1. **Child cap is 1, not 3/5.** `src/modules/progress/children-service.ts:6,39-41` `CHILD_PROFILE_LIMIT = 1`. Parent UI also hardcodes 1. Family+ `childProfileLimit: 5` is unused.
2. **`POST /api/curriculum/complete` has no session.** `src/app/api/curriculum/complete/route.ts:22-61` — body `childId`+`assignmentId` mutates Abeka assignment/watch/streak.
3. **`POST /api/webhooks/package-subscription` grants packages without HMAC.** `route.ts:51-107` — IP/rate-limit only, then `processWebhook(payload)`.
4. **`/pricing` and `/for-schools` are redirects to `/courses`.** Confirmed.
5. **Stripe monthly cannot activate.** `stripe-webhook-service.ts:111-136` maps only `YEARLY_STANDARD|YEARLY_FAMILY_PLUS`; `MONTHLY_STANDARD` → `STRIPE_WEBHOOK_UNMAPPABLE`.

## Blockers (do not ship / do not market)

### Security
- Unauthenticated Abeka/curriculum write APIs (`/api/curriculum/complete`, `/api/abeka/progress/watch`, `/api/abeka/plans/journeys`).
- Unsigned package-subscription webhook.
- Dual password stores: reset updates Better Auth only; parent hash leftover (`qsec`).
- CSRF builds origin from client `X-Forwarded-Host` (`qsec`).
- Adaptive review-queue / next-lesson: auth without child ownership (`clearn`).

### Product honesty
- README child limits 3/5 — false in create+UI.
- PDR pricing page, B2B landing, 99k/month, 20% subscriber discount, 30-day in-app refund, daily challenge, newsletter, MFA, Sentry, WCAG AA, coverage 82%, MAU/revenue KPIs — false or unsourced.
- Live kid today is course-enrollment mission, not EN+MATH trial; garden zone `onSelectLesson={undefined}`.
- Abeka parent/student UI is mock Emma/Jack / `demo-child`.
- Subscription checkout UI unmounted (`CheckoutPlanButton` unused).
- Stripe is `mode=payment`, not recurring; autoRenew is a flag with no charger.

### Ops / CI
- Worker `bootstrap()` enqueues weekly-reports/emails on every PM2 restart (`cops`).
- Weekly report first-insert freezes metrics (`qbe`).
- Nightly compose ports 5433/6380 vs workflow 5432/6379; no `.env` (`qtest`).
- `pnpm test:e2e` is HTTP smoke, not Playwright. PR CI runs smoke + P0 + one visual spec.
- Dual Prisma clients `@/lib/db` vs `@/lib/prisma`.
- Certificate worker discards PDF bytes; R2 has no deleteObject.
- Compose/`Dockerfile` run `pnpm dev`, not production image.

## Quality debt (not all ship-blockers)

- 167/1035 `src` ts/tsx files >200 lines; garden journey 963; sky-garden scene 1338.
- 43 app files Prisma-bypass modules; Abeka lives in `src/lib/abeka` + fat routes, no module.
- Kid/teacher/reader/player largely hardcoded English; README still says Vietnamese UI policy.
- Playwright auth/purchase/gift/teacher specs `page.route` mock APIs.
- Coverage “81.65% Met” is a 2026-02-21 snapshot; no CI threshold.

## Honest ship-readiness

| Bar | Status |
|---|---|
| Local demo of parent signup → 1 child → watch/complete trial-ish lesson → weekly report | Yes, on mocks |
| README “Implemented Scope” as written | No |
| Production (live Stripe/R2/email, alerts, honest pricing, multi-child, no unauth writes) | No |
| PDR complete | No |

## Recommended next cuts (priority)

1. Auth-gate or unpublish Abeka/curriculum + package-subscription webhooks.
2. Either enforce `Subscription.childProfileLimit` or rewrite all 3/5 marketing.
3. Kill or restore `/pricing` and `/for-schools`; one price constant (99k vs 149k).
4. Stop worker bootstrap enqueue; one cron driver on VPS.
5. Scrub PDR/codebase-summary/README doc-lies (queues=9, no Sentry, no newsletter, no daily challenge).
6. Put Playwright suite or stop calling smoke “e2e”; fix nightly ports.

## Unresolved questions

- Prod env: `BILLING_PROVIDER`, `COURSE_PAYMENT_PROVIDER`, `STORAGE_PROVIDER`, `REPORT_EMAIL_PROVIDER` on tinygeniushubvn.tech — not readable from tree.
- Is subscription retail retired in favor of PayOS courses only? UI says yes; README says no.
- Intended child cap: 1 (code) vs 3/5 (docs/billing)?
- Is `/api/webhooks/package-subscription` on production ingress?
- Does the TLS terminator overwrite `X-Forwarded-Host` / `X-Real-Ip`?
- Nightly `test:local:full` last green after host ports became 5433/6380?
- Abeka: replace Track→Lesson, or leftover second product?
- Child auth for `/kid/*` (PIN vs parent session)? Current is parent session only.

**Arbiter:** pass (all 10 jobs produced reports; Criticals re-checked). Not a ship go.
