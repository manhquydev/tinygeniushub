# Slice: qsec
# Agent: qsec
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
71/100 — Canonical Better Auth, CSRF, fail-closed rate limits, ddosMode, signed stripe/payos/mock webhooks, HMAC impersonation, and parent-owned child/media APIs are real; COPPA/GDPR claims and an unsigned package-subscription webhook are not.

## Quality score
64/100 — Dual admin auth, dual password stores, CSRF that trusts client `X-Forwarded-*`, and production IP extraction that ignores hop count.

## What is actually implemented
- Better Auth parent sessions via `ccth_session`, bcrypt 12, signup disabled on the library handler, custom `/api/auth/signup|login|logout`. `src/lib/auth/better-auth.ts:44-100`, `src/lib/auth/password.ts:3-10`
- Catch-all Better Auth routes return 404: `src/app/api/auth/[...all]/route.ts:3-24`, `src/app/api/auth/sign-in/email/route.ts:1-4`, `src/app/api/auth/sign-up/email/route.ts:1-4`, `src/app/api/auth/sign-out/route.ts:1-4`. Same for `src/app/api/admin/auth/[...all]/route.ts:4-26`
- Login: CSRF + IP blocklist + IP/email rate-limit `storeFailureMode: "deny"` + 250ms failure pad + email-verification gate + Better Auth `signInEmail`. `src/app/api/auth/login/route.ts:52-150`
- Signup requires `legalAccepted: true`; writes parent hash + Better Auth `user`/`account` with `id === parent.id`; no auto session. `src/modules/identity/service.ts:10-15,45-112`, `src/app/api/auth/signup/route.ts:28-40`
- Admin login is a separate jose HS256 JWT in `ccth_admin_session` (httpOnly, Secure in prod, SameSite=strict, 8h). DB role re-checked on read. `src/app/api/admin/auth/login/route.ts:21-125`, `src/modules/admin/admin-auth-service.ts:29-54`
- Impersonation: SUPER_ADMIN only, HMAC-SHA256 cookie, 1h TTL, actorEmail binding, audit log. Applied only if Better Auth parent email has an active `adminAccount`. `src/app/api/admin/impersonate/route.ts:17-50`, `src/lib/auth/impersonation.ts:40-133`, `src/lib/auth/session.ts:88-117`
- CSRF origin check on mutating routes (`Origin`/`Referer` vs host, blocks `sec-fetch-site: cross-site`). `src/lib/security/csrf.ts:54-68`
- Rate-limit Redis Lua + fail-closed `deny`. ddosMode `normal|elevated|emergency` (1 / 0.8 / 0.6) × `globalLimitMultiplier`. Blocked CIDRs fail closed when IP is `unknown`. `src/lib/rate-limit.ts:136-164,214-244`, `src/modules/platform/security-policy.ts:453-536`, `src/modules/platform/security-access-guard.ts:42-48`
- Stripe webhook: HMAC + timestamp window. PayOS: HMAC over sorted fields, fail-closed without checksum key. Mock webhook 404 in production. `src/modules/billing/stripe-webhook-service.ts:76-108`, `src/modules/billing/payos-client.ts:28-47`, `src/app/api/billing/webhooks/mock/route.ts:14-16`
- Cron: timing-safe `CRON_SECRET` via `x-cron-secret` or Bearer. `src/lib/cron.ts:29-44`
- Child profiles: nickname + ageBand only (no DOB/legal name). Mutations CSRF + parent session + parentId ownership. Media upload URL requires parent + child ownership + fail-closed RL. `prisma/schema.prisma:294-307`, `src/modules/progress/children-service.ts:8-12,89-126`, `src/modules/progress/evidence-media-service.ts:69-99`, `src/app/api/evidence/media/upload-url/route.ts:13-42`
- Secrets: `.env*` gitignored; tracked `.env.example` is placeholders. Prod refuses missing `SESSION_SECRET` / Stripe keys / PayOS keys / mock course checkout. `/.gitignore:34-35`, `src/lib/env.ts:202-244`
- `src/proxy.ts` is A/B + maintenance + `x-next-pathname`; it does **not** parse IP headers. IP trust lives in `getRequestIp`. `src/proxy.ts:91-140`, `src/lib/rate-limit.ts:214-244`
- Session cookie hardening asserted in e2e (HttpOnly, Path=/, SameSite; Secure on HTTPS). `scripts/e2e-auth-session-lifecycle.mjs:117-123`

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
| Parent signup/login/logout with Better Auth signed session cookie | README.md:12,126-129 | Canonical routes exist; library handler blocked; e2e checks cookie flags. Dual `parentAccount.passwordHash` + Better Auth `account.password`. | Partial |
| `GET\|POST\|PATCH\|PUT\|DELETE /api/auth/[...all]` blocked | README.md:129 | 404 on all methods. Extra real routes: forgot/reset/verify-email (not listed). | Done |
| IP headers trusted only when `RATE_LIMIT_TRUST_PROXY=true`; false buckets as `unknown` | README.md:229-231 | True in code, but production **requires** trust-proxy true. `src/lib/env.ts:206-208` | Partial |
| Sensitive mutations fail-closed Redis (`storeFailureMode=deny`) | README.md:237 | Auth, children, evidence upload, billing webhooks, admin mutations, forgot-password helper default deny. | Done |
| Admin rate-limits + ddosMode + CIDR + edge export | README.md:232-236,154-157 | Implemented; SUPER_ADMIN gated. `src/app/api/admin/security/rate-limits/route.ts:13-32` | Done |
| Stripe / PayOS / mock webhook ingestion with signatures | README.md:148-150,243-252 | Stripe/PayOS/mock verify. Extra unsigned `POST /api/webhooks/package-subscription`. | Partial |
| COPPA-aware (parental consent, no tracking under 13) | docs/project-overview-pdr.md:240 | Parent account + terms/privacy/cookie consent. No COPPA flag. Math gate is client-only. Default `marketingEmailOptIn: true`. Child media is photo/audio. | Doc-lie |
| GDPR-compliant (consent, export, delete) | docs/project-overview-pdr.md:239 | Signup consent audit only. No parent self-export/delete API. | Missing |
| `ADMIN_EMAILS` enables `/admin` | README.md:228 | Admin UI/API use `adminAccount` JWT (`requireAdminSession`). `ADMIN_EMAILS` still gates `requireAdmin` on Clarity/analytics. | Partial |
| Secure session cookie | README.md:12 | Better Auth defaults + e2e. App config only overrides cookie **name**, not SameSite/Secure. `src/lib/auth/better-auth.ts:94-100` | Done |

## Findings
### Critical
- [Unsigned package-subscription webhook grants paid access] `src/app/api/webhooks/package-subscription/route.ts:51-107,125-168` — POST is unauthenticated beyond IP allow/block + rate-limit. Body `parentId` + `status: "SUCCESS"` + `metadata.targetPackageId` creates `paymentRecord` and `packageSubscription`. Impact: anyone who can hit the URL can attach a 1-year package to any parent. Suggested fix: require a provider HMAC (or delete the route and keep PayOS/Stripe only).

### High
- [CSRF trusts client `X-Forwarded-Host` / `X-Forwarded-Proto`] `src/lib/security/csrf.ts:27-51` — expected origin is built from forwarded headers with no `RATE_LIMIT_TRUST_PROXY` gate. Tests treat this as success (`src/lib/security/__tests__/csrf.test.ts:48-58`). Browser can set `X-Forwarded-Host` (not a forbidden header). `sec-fetch-site: cross-site` blocks modern browsers only; missing header continues. Impact: CSRF bypass on mutating APIs if the edge does not overwrite those headers. Suggested fix: pin expected origin to `BETTER_AUTH_URL` / `AUTH_TRUSTED_ORIGINS`; never take host from client-controlled forwarded headers.
- [Password reset updates Better Auth only] `src/app/api/auth/reset-password/route.ts:50-56` vs login `src/app/api/auth/login/route.ts:104-150` + `src/modules/identity/service.ts:138-160` — login checks `parentAccount.passwordHash` then `auth.api.signInEmail`. Reset calls only Better Auth. After reset, old hash still authenticates the parent row; new password fails parent check; old password fails Better Auth. Impact: reset locks the account; leftover old hash is a future bypass if any path uses only the parent hash. Suggested fix: one password store, or update both hashes in the same transaction.
- [Two admin authorization systems] `src/lib/auth/admin-guard.ts:26-41` vs `src/lib/auth/admin.ts:26-32` — `requireAdmin` is parent Better Auth + `ADMIN_EMAILS`. Used by `src/app/api/clarity/export/route.ts:10-26` and `src/app/api/admin/analytics/realtime/route.ts:2-9`. Real admin panel uses JWT `adminAccount` + roles. Impact: any parent whose email is in `ADMIN_EMAILS` can hit those APIs without an admin session/role. Suggested fix: delete `admin-guard`; route all admin APIs through `requireAdminFromRequest`.
- [Brevo webhook fail-open] `src/app/api/webhooks/brevo/route.ts:82-86` — empty `REPORT_EMAIL_BREVO_WEBHOOK_SECRET` authorizes every request. Token also accepted in query string (`:91`). Impact: forged open/click events on weekly reports when provider=brevo and secret unset. Suggested fix: fail closed in production; header-only compare, timing-safe.
- [COPPA/GDPR claimed, not implemented] PDR `docs/project-overview-pdr.md:239-240` vs signup `src/modules/identity/service.ts:10-15,58-59,122-123`, gate `src/components/parental-gate-modal.tsx:35-40`, media `src/modules/progress/evidence-media-service.ts:13-20`. Ages 2–6. Consent is terms/privacy/cookie, not verifiable parental COPPA consent. Marketing email defaults on. No parent data-export/delete. Client math puzzle is not a control. Impact: regulatory exposure if marketed as COPPA/GDPR-ready. Suggested fix: stop claiming it, or add verifiable consent, data-minimized child records, parent export/delete, and no default marketing opt-in.

### Medium
- [Production IP extraction ignores `RATE_LIMIT_TRUSTED_HOPS`] `src/lib/rate-limit.ts:224-240` — production always takes the last `X-Forwarded-For` hop; `x-real-ip` wins when hops ≥ 1 (default 1). Tests only cover non-prod hop indexing (`src/lib/__tests__/rate-limit.test.ts:57-127`). Impact: spoofable rate-limit keys if the proxy does not overwrite `x-real-ip`; or all users collapse onto the proxy IP. Suggested fix: same hop algorithm in all envs; never prefer client-set `x-real-ip` unless the proxy is known to set it.
- [CI=true allows well-known prod secrets] `src/lib/env.ts:5,135-140,166` — `BETTER_AUTH_SECRET`, `ADMIN_AUTH_SECRET`, `CRON_SECRET`, `MOCK_UPLOAD_SIGNING_SECRET` fall back to committed dev strings when `NODE_ENV=production` and `CI=true`. GitHub Actions sets `CI=true`. Impact: accidental prod/CI runtime with public secrets. Suggested fix: never fallback when `NODE_ENV=production`.
- [Dead Better Auth admin instance shares `authSession`] `src/lib/auth/admin-auth.ts:10-51` — cookie name `ccth_admin_session` collides with the jose JWT. Handler is 404. Impact: landmine if someone wires `toNextJsHandler(adminAuth)`. Suggested fix: delete unused admin Better Auth client/server.
- [Bunny webhook unsigned when secret unset (non-prod)] `src/app/api/webhooks/bunny/route.ts:18-47` — production without secret → 503; otherwise no secret means any JSON can flip `lesson.videoStatus`. Compare is raw secret equality, not body HMAC. Suggested fix: require HMAC of body in all envs.
- [Caregiver invite returns raw token] `src/app/api/caregivers/invite/route.ts:64-71` — token in JSON response. CSRF + RL present. Impact: XSS/log leakage becomes account-link. Suggested fix: return only delivery status; consume token via one-time link.
- [`listChildProfiles` returns full Prisma rows] `src/modules/progress/children-service.ts:14-18` — includes `progressSnapshot` / `placementResult` JSON. Impact: extra child telemetry on `GET /api/children`. Suggested fix: explicit DTO.
- [Evidence confirm has no rate-limit] `src/app/api/evidence/media/[mediaId]/confirm/route.ts:14-44` — auth + CSRF + owner check, no deny-mode RL. Suggested fix: same buckets as upload-url.
- [Jules webhook uses non-constant-time token compare] `src/app/api/integrations/jules/github-webhook/route.ts:125-126` — token is required (`src/lib/jules/config.ts:70-71`). Low practical exploit; still wrong. Suggested fix: `timingSafeEqual`.
- [Compose/CI committed local secrets] `docker-compose.yml:60-69` (`dev-better-auth-secret-...`, `dev-cron-secret-change-this-123456`, `dev-webhook-secret`), README demo passwords. Fine for local; disaster if that compose is prod. Suggested fix: fail compose without override when `NODE_ENV=production`.

### Low
- [Parental gate is a client multiplication quiz] `src/components/parental-gate-modal.tsx:12-40`, used from `src/components/app-nav-client.tsx:484`. No server check. Kids who can multiply bypass it.
- [Better Auth cookie attributes not pinned in config] `src/lib/auth/better-auth.ts:94-100` — name only; relies on library defaults. e2e currently passes.
- [Admin `requireAdminServer` always 400] `src/lib/auth/admin-guard.ts:49-55` — dead/wrong helper.
- [Signup default `marketingEmailOptIn: true`] `src/modules/identity/service.ts:58-59` — opt-out, not opt-in.
- [Forgot-password rate-limit returns success] `src/app/api/auth/forgot-password/route.ts:41,64` — good anti-enumeration; Redis deny also looks like success so user gets no email. Product, not exploit.

## Tests covering this slice
- `src/lib/security/__tests__/csrf.test.ts` — origin/referer/mismatch/Sec-Fetch-Site. Hole: treats spoofed `x-forwarded-host` as valid.
- `src/lib/__tests__/rate-limit.test.ts` — in-memory limit, deny/allow store failure, trust-proxy off → `unknown`, hop indexing, x-real-ip preference. Hole: no `NODE_ENV=production` last-hop case.
- `src/modules/platform/__tests__/security-access-guard.test.ts` — blocked CIDR + unresolved IP.
- `src/modules/platform/__tests__/security-policy.test.ts` + `security-policy-service.test.ts` + `security-edge-export.test.ts` — ddosMode multipliers, controls persistence, edge export.
- `src/lib/auth/__tests__/session.test.ts` — cookie name, email-verification gate, impersonation lookup. Hole: no HMAC tamper tests (impersonation module untested directly).
- `src/lib/auth/__tests__/admin.test.ts` — `isAdminEmail` only.
- `src/lib/auth/__tests__/admin-role-gating.test.ts` — SUPER_ADMIN page/API gating for some modules.
- `src/modules/billing/__tests__/stripe-webhook-service.test.ts`, `webhook-service.test.ts`, `payos-client.test.ts` — signature accept/reject. Hole: no test that package-subscription rejects unsigned bodies.
- `src/app/api/auth/login/route.test.ts`, `signup/route.test.ts`, `src/app/api/billing/webhooks/mock/route.test.ts` — RL + mock 404 in prod.
- `scripts/e2e-auth-session-lifecycle.mjs` + `scripts/e2e-auth-session-https.mjs` — cookie HttpOnly/SameSite/Secure.
- `scripts/e2e-security-abuse.mjs` — 429, blocked IP, readiness allowlist, ddos multiplier, burst, edge export. Hole: CSRF forwarded-host, unsigned package webhook, dual-password reset.

## Production-readiness blockers
- Unsigned `POST /api/webhooks/package-subscription` can grant subscriptions.
- Password reset vs dual hash stores: reset does not restore a working login; old parent hash remains.
- CSRF `X-Forwarded-Host` trust unless the TLS terminator **always** overwrites Host/proto (not enforced in app).
- Do not ship COPPA/GDPR claims; no verifiable parental consent, no subject-access/delete path, child photo/audio pipeline exists.
- `ADMIN_EMAILS` parent-session admin bypass on Clarity export / realtime analytics.

## Unresolved questions
- Is `/api/webhooks/package-subscription` reachable in the production ingress, or leftover unused route?
- Does the production proxy overwrite `X-Forwarded-Host`, `X-Forwarded-Proto`, and `X-Real-Ip` on every request?
- Is Better Auth session cookie SameSite=Lax or Strict in the installed library version (config does not set it)?
- Target market US (COPPA) vs VN-only (different child-data rules)?
