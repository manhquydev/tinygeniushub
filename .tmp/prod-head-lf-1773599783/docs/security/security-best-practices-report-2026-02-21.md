# Security Best Practices Report (2026-02-21)

## Executive Summary
Backend has good baseline controls (session-based auth, CSRF origin checks on most mutation routes, structured domain errors).  
However, there are several gaps that can materially impact production safety: unsafe GET side effects, auth hardening inconsistency via Better Auth catch-all paths, IP policy fail-open behavior when source IP is unresolved, and missing abuse controls on multiple authenticated mutation APIs.

## Remediation Status (Follow-up)
- Addressed:
  - `GET /api/reports/weekly` no longer triggers report generation side effects.
  - `GET /api/referrals/me` is read-only; explicit `POST /api/referrals/me` is used for provisioning summary/code.
  - Canonical auth surface hardened by blocking direct Better Auth routes:
    - `/api/auth/sign-in/email`
    - `/api/auth/sign-up/email`
    - `/api/auth/sign-out`
  - Catch-all auth surface is now blocked by default (`/api/auth/[...all]` returns `404` for all verbs), which also denies `/api/auth/get-session` and other non-canonical paths.
  - Added app-level abuse guard/rate-limit on previously uncovered mutation routes:
    - children create/update/delete
    - referral claim
    - lesson complete
    - admin mutation endpoints
    - logout
    - mock upload ingest
  - Production startup now enforces `RATE_LIMIT_TRUST_PROXY=true`.
  - Blocked-IP policy now fails closed on unresolved source IP.
  - Mock upload signing now uses dedicated `MOCK_UPLOAD_SIGNING_SECRET`.
  - Child profile plan-limit check is now serializable transaction-based with retry on serialization conflict.
- Remaining to evaluate:
  - None in this report scope; re-run endpoint inventory after any new Better Auth plugin/feature is added.

## Findings

### F-01 (High): `GET` endpoints are performing state-changing writes
- Location:
  - `src/app/api/reports/weekly/route.ts:12`
  - `src/app/api/reports/weekly/route.ts:37`
  - `src/modules/reports/weekly-report-service.ts:77`
  - `src/app/api/referrals/me/route.ts:7`
  - `src/app/api/referrals/me/route.ts:14`
  - `src/modules/referral/service.ts:51`
  - `src/modules/referral/service.ts:79`
  - `src/modules/referral/service.ts:80`
- Evidence:
  - `GET /api/reports/weekly` can call report generation, which does DB `upsert`.
  - `GET /api/referrals/me` can create referral code if absent.
- Impact:
  - Violates safe-method semantics and weakens CSRF/cache assumptions for read routes.
- Standard alignment:
  - RFC 9110 safe methods.
  - OWASP CSRF Prevention Cheat Sheet guidance: do not use `GET` for state change.

### F-02 (High): Auth control inconsistency via Better Auth catch-all route
- Location:
  - `src/app/api/auth/[...all]/route.ts:4`
  - `src/app/api/auth/signup/route.ts:13`
  - `src/app/api/auth/signup/route.ts:14`
  - `src/app/api/auth/signup/route.ts:21`
  - `src/app/api/auth/login/route.ts:45`
  - `docs/security/ddos-abuse-runbook.md:15`
  - `docs/security/ddos-abuse-runbook.md:16`
  - `docs/testing/backend-production-readiness-matrix.md:23`
- Evidence:
  - Catch-all exposes Better Auth handler directly for multiple methods.
  - Project hardening (custom CSRF/security policy/rate-limit profile) is centered on `/api/auth/login` and `/api/auth/signup`.
- Impact:
  - Auth endpoints can have uneven protection posture, making abuse/lockout policy harder to reason about and verify.
- Standard alignment:
  - OWASP API5 (Broken Function Level Authorization) and API8 (Security Misconfiguration) recommend uniform enforcement for privileged/auth functions.

### F-03 (High): IP security policy can fail-open when client IP is unresolved
- Location:
  - `src/lib/env.ts:33`
  - `src/lib/env.ts:35`
  - `src/lib/rate-limit.ts:216`
  - `src/lib/rate-limit.ts:228`
  - `src/modules/platform/security-access-guard.ts:42`
  - `src/modules/platform/security-access-guard.ts:50`
  - `docs/security/ddos-abuse-runbook.md:9`
- Evidence:
  - Production default for `RATE_LIMIT_TRUST_PROXY` is `false`.
  - IP resolver returns `"unknown"` when proxy headers are not trusted.
  - Security access guard returns early on `"unknown"` (except readiness allowlist branch).
- Impact:
  - CIDR block controls may not be applied for those requests; abuse protection and forensics degrade.
- Standard alignment:
  - Proxy trust model must match deployment edge behavior.

### F-04 (Medium): Plan-based child profile limit is race-prone
- Location:
  - `src/modules/progress/children-service.ts:24`
  - `src/modules/progress/children-service.ts:25`
  - `src/modules/progress/children-service.ts:41`
  - `docs/handover/handover-master-agent-ready.md:164`
- Evidence:
  - Count check and create are separate operations without transaction/locking.
- Impact:
  - Concurrent requests can exceed subscription child limit.

### F-05 (Medium): Readiness endpoint exposes internal dependency detail on success
- Location:
  - `src/app/api/health/ready/route.ts:119`
  - `src/app/api/health/ready/route.ts:142`
  - `src/app/api/health/ready/route.ts:147`
  - `src/lib/env.ts:90`
- Evidence:
  - `checks` object (dependency status/latency metadata) is returned even on successful readiness responses.
- Impact:
  - Increases operational information leakage if endpoint is internet-reachable.
- Standard alignment:
  - OWASP API8 advises against exposing unnecessary system details.

### F-06 (Medium): Multiple mutation routes lack app-level abuse guard/rate limit
- Location:
  - `src/app/api/children/route.ts:22`
  - `src/app/api/children/[childId]/route.ts:8`
  - `src/app/api/children/[childId]/route.ts:30`
  - `src/app/api/lessons/[lessonId]/complete/route.ts:8`
  - `src/app/api/referrals/claim/route.ts:8`
  - `docs/security/ddos-abuse-runbook.md:48`
- Evidence:
  - These routes use CSRF + auth but do not apply `enforceRateLimit` and do not call `assertRequestAllowedBySecurityControls`.
- Impact:
  - Authenticated abuse (burst writes) can still pressure DB/app resources.
- Standard alignment:
  - OWASP API4 recommends endpoint-specific consumption controls.

### F-07 (Low): Reuse of auth secret for mock storage URL signing
- Location:
  - `src/modules/platform/storage/providers/mock-r2-provider.ts:7`
  - `src/app/api/storage/mock-upload/route.ts:6`
- Evidence:
  - `BETTER_AUTH_SECRET` is also used for upload URL HMAC.
- Impact:
  - Cross-purpose key reuse increases blast radius and rotation coupling.
- Standard alignment:
  - OWASP key management: one key per purpose.

## Gaps Between Docs vs Implementation
- Auth readiness/testing docs focus mostly on custom login/signup/logout paths, while catch-all Better Auth endpoints remain exposed:
  - `docs/testing/backend-production-readiness-matrix.md:23`
  - `docs/testing/auth-test-checklist.md:17`
  - `docs/testing/auth-test-checklist.md:21`
- Handover says child limit is complete, but implementation is not concurrency-safe:
  - `docs/handover/handover-master-agent-ready.md:164`
  - `src/modules/progress/children-service.ts:24`
  - `src/modules/progress/children-service.ts:41`

## Priority Remediation Plan
1. Remove write side effects from `GET` routes:
   - Move report generation/referral code creation to explicit `POST` endpoints.
   - Keep `GET` read-only.
2. Normalize auth route protection:
   - Decide a single canonical auth surface.
   - Either block non-canonical Better Auth paths or apply the same guard/rate-limit policy consistently.
3. Close IP fail-open gap:
   - Enforce valid proxy trust config in production startup checks.
   - Optionally deny sensitive operations when IP is unresolved.
4. Make child-limit enforcement atomic:
   - Add transactional check+create or DB-enforced quota strategy.
5. Add abuse controls for remaining mutation routes:
   - Apply policy-based `enforceRateLimit` + `assertRequestAllowedBySecurityControls` consistently.
6. Reduce readiness exposure:
   - Return minimal payload externally; keep detailed checks for internal/admin path only.
7. Separate crypto keys by purpose:
   - Introduce dedicated `MOCK_UPLOAD_SIGNING_SECRET`.

## Sources
- RFC 9110 HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110.html
- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP API4:2023 Unrestricted Resource Consumption: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
- OWASP API5:2023 Broken Function Level Authorization: https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/
- OWASP API8:2023 Security Misconfiguration: https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/
- OWASP Key Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html
- Express trust proxy guidance: https://expressjs.com/en/guide/behind-proxies.html
