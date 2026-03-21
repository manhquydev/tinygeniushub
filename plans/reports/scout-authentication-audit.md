# Authentication Code Scout Report - 2026-03-21

**Work Context:** D:/project/cungcontuhoc  
**Reports Path:** D:/project/cungcontuhoc/plans/reports/

---

## SUMMARY

Found comprehensive authentication implementation using **Better Auth v1.4.18**:

### 1. JWT/Token Handling
- **Admin JWT:** jose library, jwtVerify, 8-hour expiry, ccth_admin_session cookie
- **Impersonation tokens:** Custom HMAC-SHA256, base64url format, 12-hour max age
- **Session tokens:** Better Auth opaque tokens, 30 days (user) / 8 hours (admin)

File: `/src/modules/admin/admin-auth-service.ts` (75 lines)
File: `/src/lib/auth/impersonation.ts` (165 lines)

### 2. Session Management
- User sessions: ccth_session, 30-day expiry, 24-hour refresh window
- Admin sessions: ccth_admin_session, 8-hour expiry, separate secret (BETTER_AUTH_SECRET + '_admin')
- Retrieval functions: getParentFromRequest, getAuthenticatedParentFromRequest, getParentFromServerCookie

File: `/src/lib/auth/better-auth.ts` (46 lines)
File: `/src/lib/auth/admin-auth.ts` (52 lines)
File: `/src/lib/auth/session.ts` (120 lines)

### 3. OAuth/SSO
**NOT IMPLEMENTED** - No OAuth providers configured, email-password only

### 4. Password Reset
- Forgot password: POST /api/auth/forgot-password - Better Auth token generation
- Reset password: POST /api/auth/reset-password - Token validation + password update
- Hashing: bcryptjs with 12 rounds

File: `/src/app/api/auth/forgot-password/route.ts` (70 lines)
File: `/src/app/api/auth/reset-password/route.ts` (63 lines)
File: `/src/lib/auth/password.ts` (12 lines)

### 5. Rate Limiting
- Redis-backed Lua script (atomic increment with TTL)
- In-memory fallback Map if Redis unavailable
- IP extraction: x-real-ip → x-forwarded-for → validates with node:net.isIP()
- Policies: auth.login.ip/email, auth.signup.ip/email, auth.logout.ip, admin.mutation.ip
- Email bucketing: SHA256(email.trim().toLowerCase()).slice(0,24)

File: `/src/lib/rate-limit.ts` (243 lines)
File: `/src/modules/platform/security-policy-service.ts` (150+ lines)
File: `/src/lib/security/admin-rate-limit.ts` (22 lines)

### 6. Middleware & Validation
- CSRF: Origin validation, sec-fetch-site header check, Fetch Metadata support
- Security guards: IP blocking (CIDR), readiness allowlist, dynamic caching
- Session validation: Better Auth integration, admin role enforcement

File: `/src/lib/security/csrf.ts` (70 lines)
File: `/src/modules/platform/security-access-guard.ts` (76 lines)

### 7. Better Auth Config
- User auth: baseURL, secret (min 32 chars), Prisma adapter, trustedOrigins
- Admin auth: basePath /api/admin/auth, secret with _admin suffix, 8-hour expiry
- Email/password: enabled, disableSignUp: true, autoSignIn: true, bcryptjs(12 rounds)

File: `/src/lib/auth/better-auth.ts`
File: `/src/lib/auth/admin-auth.ts`
File: `/src/lib/auth/better-auth-utils.ts` (45 lines)

### 8. Auth Routes
- Login: POST /api/auth/login - Rate limits (IP+email), 250ms timing delay, generic errors
- Signup: POST /api/auth/signup - Creates parentAccount, subscription (7-day trial), lifecycle email
- Logout: POST /api/auth/logout - CSRF check, rate limit, redirect vs JSON response
- Forgot/Reset: Password reset flow with Better Auth token

File: `/src/app/api/auth/login/route.ts` (182 lines)
File: `/src/app/api/auth/signup/route.ts` (125 lines)
File: `/src/app/api/auth/logout/route.ts` (88 lines)

### 9. Admin Auth Service
- getAdminSession(): JWT decode + active check
- requireAdminSession(allowedRoles): Role enforcement

File: `/src/modules/admin/admin-auth-service.ts` (75 lines)

### 10. Environment Config
- BETTER_AUTH_SECRET (min 32 chars)
- BETTER_AUTH_URL
- AUTH_TRUSTED_ORIGINS (comma-sep)
- SESSION_SECRET
- ADMIN_EMAILS
- RATE_LIMIT_TRUST_PROXY, RATE_LIMIT_TRUSTED_HOPS

File: `/src/lib/env.ts`

### 11. Helper Functions
- buildRateLimitIdentity: SHA256(email).slice(0,24)
- getRequestIp: Proxy-aware IP extraction
- requireAdminParent: Server-side admin enforcement

### 12. Password Utilities
- hashPassword: bcryptjs(12 rounds)
- verifyPassword: bcryptjs comparison

File: `/src/lib/auth/password.ts`

---

## ALL 22 AUTH FILES

**Core Auth (7):**
- /src/lib/auth/better-auth.ts
- /src/lib/auth/admin-auth.ts
- /src/lib/auth/session.ts
- /src/lib/auth/password.ts
- /src/lib/auth/impersonation.ts
- /src/lib/auth/better-auth-utils.ts
- /src/lib/auth/admin-auth-client.ts

**Routes (6):**
- /src/app/api/auth/login/route.ts
- /src/app/api/auth/signup/route.ts
- /src/app/api/auth/logout/route.ts
- /src/app/api/auth/forgot-password/route.ts
- /src/app/api/auth/reset-password/route.ts
- /src/app/api/auth/[...all]/route.ts (404 fallback)

**Security (4):**
- /src/lib/security/csrf.ts
- /src/modules/platform/security-access-guard.ts
- /src/modules/platform/security-policy-service.ts
- /src/modules/platform/security-policy.ts

**Rate Limiting (2):**
- /src/lib/rate-limit.ts
- /src/lib/security/admin-rate-limit.ts

**Services (2):**
- /src/modules/admin/admin-auth-service.ts
- /src/modules/identity/service.ts

**Config (1):**
- /src/lib/env.ts

---

## SECURITY FEATURES IMPLEMENTED

1. Password hashing: bcryptjs (12 rounds)
2. Session isolation: Admin sessions use separate secret
3. Rate limiting: Redis + in-memory fallback, IP+email bucketing
4. CSRF protection: Origin + Fetch Metadata validation
5. Admin impersonation: HMAC-signed tokens (12-hour expiry)
6. Timing attack mitigation: 250ms min delay on login failure
7. Account enumeration prevention: Generic error messages
8. Proxy trust: Configurable with hop counting
9. IP-based security: Dynamic CIDR blocklist + readiness allowlist
10. Cookie security: HTTP-only, SameSite defaults

---

## GAPS / NOT IMPLEMENTED

1. OAuth/SSO - No providers configured
2. MFA/2FA - No multi-factor auth
3. Email verification - No email confirmation flow
4. Forgot password rate limiting - Endpoint not rate-limited
5. Explicit session invalidation - Relies on expiry
6. API key auth - No key-based authentication
7. Token refresh rotation - Session refreshes via window

---

## UNRESOLVED QUESTIONS

1. Reset token expiration duration? (Abstracted by Better Auth)
2. OAuth/SSO in future roadmap?
3. Front-end handles expired session cookies? (Better Auth client)
4. Admin impersonation logged separately?
5. Redis connection pooling strategy?

