# Authentication Test Checklist (Basic -> Advanced)

## Authoritative Sources
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP WSTG Authentication Testing: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/
- OWASP WSTG - Testing for User Registration Process: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/02-Testing_for_User_Registration_Process
- OWASP WSTG - Testing for Weak Lock Out Mechanism: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/03-Testing_for_Weak_Lock_Out_Mechanism
- OWASP WSTG - Testing for Account Enumeration and Guessable User Account: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
- NIST SP 800-63B (Digital Identity Guidelines): https://pages.nist.gov/800-63-4/sp800-63b.html
- RFC 6585 (`429 Too Many Requests`): https://datatracker.ietf.org/doc/html/rfc6585
- RFC 9110 (`Retry-After` header semantics): https://datatracker.ietf.org/doc/html/rfc9110#section-10.2.3

## P0 - Must Pass Before Production

- [x] `AUTH-P0-001` Signup payload validation
Expected: `400`, clear validation message, issue details for invalid email/password/displayName.
Automated: `src/app/api/auth/signup/route.test.ts`

- [x] `AUTH-P0-002` Login payload validation
Expected: `400`, clear validation message, issue details for invalid email/password.
Automated: `src/app/api/auth/login/route.test.ts`

- [x] `AUTH-P0-003` Duplicate account registration
Expected: `409`, user-facing message for existing email, stable error code for client mapping.
Automated: `src/app/api/auth/signup/route.test.ts`

- [x] `AUTH-P0-004` Invalid credentials response consistency
Expected: no user enumeration in message detail for credential failures.
Automated: `src/app/api/auth/login/route.test.ts`

- [x] `AUTH-P0-005` Rate limiting on signup/login
Expected: `429` + `Retry-After`, both IP and account/email bucket controls.
Automated: `src/app/api/auth/signup/route.test.ts`, `src/app/api/auth/login/route.test.ts`

- [x] `AUTH-P0-006` Session cookie set on success
Expected: signup/login success returns auth cookie for next requests.
Automated: `src/app/api/auth/signup/route.test.ts`, `src/app/api/auth/login/route.test.ts`

- [x] `AUTH-P0-007` Logout invalidates session cookie
Expected: logout clears cookie and returns successful sign-out state.
Automated: `src/app/api/auth/logout/route.test.ts`

- [x] `AUTH-P0-008` CSRF protection on auth endpoints
Expected: unsafe cross-site requests blocked.
Automated: `src/lib/security/__tests__/csrf.test.ts`

- [x] `AUTH-P0-009` Canonical auth API surface enforced
Expected: direct Better Auth endpoints are not publicly usable (`/api/auth/sign-in/email`, `/api/auth/sign-up/email`, `/api/auth/sign-out`, `/api/auth/get-session` and other catch-all paths).
Automated: `src/app/api/auth/sign-in/email/route.test.ts`, `src/app/api/auth/sign-up/email/route.test.ts`, `src/app/api/auth/sign-out/route.test.ts`, `src/app/api/auth/[...all]/route.test.ts`, `scripts/e2e-auth-session-lifecycle.mjs`

## P1 - Should Pass in First Hardening Iteration

- [x] `AUTH-P1-001` Lockout/backoff effectiveness under distributed attempts
Expected: test against rotating IP + same account/email bucket according to WSTG lockout guidance.
Automated:
- `src/app/api/auth/login/route.test.ts` (email bucket across rotating IPs)
- `scripts/e2e-security-abuse.mjs` (distributed login abuse scenario)

- [x] `AUTH-P1-002` Username/email enumeration resistance beyond message level
Expected: timing and response-shape consistency between unknown-account and wrong-password paths.
Automated:
- `scripts/e2e-auth-timing.mjs` (statistical timing harness with median/p95 delta thresholds and minimum failure-duration checks)

- [x] `AUTH-P1-003` Cookie hardening verification (baseline)
Expected: `HttpOnly`, `Secure`, `SameSite`, and scoped `Path/Domain` align with deployment model.
Automated:
- `scripts/e2e-security-abuse.mjs` asserts `HttpOnly`, `Path=/`, `SameSite`.
- `scripts/e2e-auth-session-lifecycle.mjs` asserts baseline cookie attributes on signup/login session issuance.
- `scripts/e2e-auth-session-https.mjs` + `scripts/e2e-auth-session-lifecycle.mjs` (with `E2E_EXPECT_SECURE_COOKIE=1`) assert `Secure` in HTTPS-like staging mode.

- [x] `AUTH-P1-004` Session lifecycle controls
Expected: rotation/invalidation behavior after login/logout/password change follows policy.
Automated:
- `scripts/e2e-auth-session-lifecycle.mjs` (rotation/invalidation/multi-session isolation)
- `src/lib/auth/__tests__/session.test.ts` (session resolution + parent-link consistency)
Remaining gap: password-change session invalidation coverage.

- [x] `AUTH-P1-005` Audit/security logging quality
Expected: auth failures and lockout/rate-limit events logged without exposing secrets.
Automated:
- `src/app/api/auth/login/route.test.ts` (rate-limit/failure/success structured log assertions + no raw credential leakage)
- `src/app/api/auth/signup/route.test.ts` (rate-limit/failure/success structured log assertions)
- `src/app/api/auth/logout/route.test.ts` (rate-limit/failure/success structured log assertions)

## P2 - Advanced / Scale / Abuse-Resistance

- [ ] `AUTH-P2-001` MFA/step-up auth scenarios (if enabled in roadmap)
- [ ] `AUTH-P2-002` Password reset and account recovery abuse cases
- [ ] `AUTH-P2-003` Bot defense effectiveness with large-scale credential stuffing simulation
- [ ] `AUTH-P2-004` Session concurrency and device management policies
- [ ] `AUTH-P2-005` Chaos testing for auth dependencies (DB/Redis/auth provider partial outage)

## Implementation Notes
- This checklist is designed to be executed with a mix of unit/integration/e2e tests.
- P0 items are blocking quality gates for release candidate.
- P1 and P2 should be scheduled in security hardening sprints with clear pass/fail criteria.
