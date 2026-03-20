# Code Review: Admin Social Links Management

**Date:** 2026-03-18
**Reviewer:** code-reviewer
**Scope:** Backend service + API route + frontend admin UI + footer wiring

---

## Code Review Summary

### Scope
- Files reviewed: 9
- Lines of code analyzed: ~500
- Review focus: Admin social links feature end-to-end

### Overall Assessment
Feature is well-structured and follows project conventions. Backend is solid with proper auth, CSRF, rate limiting, validation, audit log, and graceful fallback to defaults. One medium-priority bug in the frontend error message extraction. All other areas pass.

---

### Critical Issues
None.

---

### High Priority Findings
None.

---

### Medium Priority Improvements

#### 1. Frontend error message extraction mismatch (BUG)
**File:** `src/components/admin/site-settings/admin-social-links-editor.tsx` line 77

API error shape is:
```json
{ "ok": false, "error": { "message": "...", "details": {...} } }
```

Frontend reads:
```ts
setError(data?.error ?? "Lưu thất bại. Vui lòng thử lại.");
```

`data?.error` resolves to the whole `{ message, details }` object, not a string. React will throw when attempting to render an object as a React child, or display `[object Object]`.

**Fix:** Change to `data?.error?.message ?? "Lưu thất bại. Vui lòng thử lại."`.

---

### Low Priority Suggestions

#### 2. `getFooterSocialLinks` test-environment short-circuit leaks into production concern
**File:** `src/modules/platform/site-content-settings-service.ts` lines 16–18

```ts
if (env.NODE_ENV === "test") {
  return { ...DEFAULT_FOOTER_SOCIAL_LINKS };
}
```

Using `NODE_ENV` guard inside a service to skip DB calls is a code smell. Tests that exercise this code path receive defaults, not real DB behavior. The route test already mocks the service entirely, making this guard redundant. Consider removing it and relying on mocks at the test boundary.

#### 3. `options` parameter silently ignored with `void options`
**File:** `src/modules/platform/site-content-settings-service.ts` line 15

`forceRefresh` option is defined on the signature but always ignored. No cache invalidation is implemented. Either remove the parameter (YAGNI) or implement it. Currently misleads callers.

#### 4. `isHttpUrl` redundant with Zod's `.url()` validator
**File:** `src/modules/platform/footer-social-links-schema.ts` lines 7–16

`z.string().url()` already rejects non-http(s) protocols in most practical cases. The custom `isHttpUrl` guard additionally blocks bare paths and data URIs, which is fine, but the comment and naming could be more explicit. Low impact.

#### 5. `updateFooterSocialLinks` throws `DomainError` with status 503 on any DB error
**File:** `src/modules/platform/site-content-settings-service.ts` lines 82–87

Catching all DB errors as a migration issue is overly broad. A transient network error or constraint violation will also surface as 503 "Run latest database migrations," which is confusing. Consider distinguishing known migration-related codes (e.g., Prisma's `P2021` table-not-found) from generic DB errors.

#### 6. `site-footer.tsx` exceeds 190 lines (borderline)
**File:** `src/components/site-footer.tsx` (190 lines)

Exactly at the project's 200-line limit. No action needed now but the inline SVG icons could be extracted to a `footer-social-icons.tsx` file if the file grows further.

---

### Positive Observations
- Backend: auth guard (`requireAdminFromRequest`) applied on both GET and PATCH; CSRF (`assertTrustedOrigin`) and rate limit (`enforceAdminMutationRateLimit`) only on mutating PATCH — correct pattern.
- Audit log written with structured data after successful update.
- Service gracefully falls back to defaults on DB read failure — zero crash risk.
- Schema re-exported cleanly through schema file; no duplication.
- Admin page uses `force-dynamic` to ensure fresh data on every request.
- Footer correctly wired via server component layout, passes live DB data as prop.
- `AdminSocialLinksEditor` uses controlled form state with optimistic reset — UX is solid.
- Test file covers: GET happy path, GET auth failure, PATCH rate limit, PATCH validation failure, PATCH success with audit log — good coverage.
- File sizes all within 200-line limit (except footer at 190).

---

### Recommended Actions
1. **Fix (medium):** `admin-social-links-editor.tsx` line 77 — change `data?.error` to `data?.error?.message`.
2. **Clean-up (low):** Remove `NODE_ENV === "test"` guard from `site-content-settings-service.ts` — mocking handles this at the right boundary.
3. **Clean-up (low):** Remove unused `options` parameter from `getFooterSocialLinks` or implement `forceRefresh` cache logic.
4. **Improve (low):** Narrow 503 DomainError in `updateFooterSocialLinks` to Prisma table-not-found codes only.

---

### Metrics
- Type Coverage: Strong — all props and return types explicit; no `any` observed.
- Test Coverage: Route handler fully covered (happy path + 3 error paths); service layer and schema not unit-tested separately (acceptable for current scope).
- Linting Issues: 0 functional, 1 bug (error message extraction).
- File Sizes: All within limits.

---

### Unresolved Questions
- Is `forceRefresh` on `getFooterSocialLinks` planned for a future caching layer (e.g., Redis/in-memory)? If not, remove per YAGNI.
- Should future social platforms (Instagram, X/Twitter) be supported? Current schema is a fixed object; adding new fields would require a schema migration. A `Record<string, string>` approach may be more extensible if expansion is planned.
