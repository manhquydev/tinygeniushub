# Security audit - course checkout production (2026-04-10)

## Scope
- UI copy exposure on `/courses/[slug]` (avoid technical internals user-facing).
- Paid checkout path validation with one real paid SKU.
- Abuse tests: auth bypass, CSRF bypass, return URL tampering, mock-success abuse, lesson resource bypass, webhook spoof.

## Production baseline
- App deploy ref: `c25a0d30`.
- Paid test slug: `lfen-l2-builder-8w` (`salePriceVnd = null`, list/base `299000`).
- Other published SKUs remain temporary free sale (`salePriceVnd = 0`).

## UI hardening delivered
- Removed/rewrote technical copy to parent-friendly copy in course detail flow.
- Added FAQ block back to `/courses/[slug]` to reduce confusion and handle objections.
- Normalized free CTA label so free button no longer renders redundant `- 0đ`.
- Hid transaction code from generic checkout banner UX.

## Security test cases and results
1. Unauthenticated checkout create session
- Request: `POST /api/courses/lfen-l2-builder-8w/checkout` with valid origin.
- Result: `401 Unauthorized`.

2. CSRF bypass attempt (authenticated but no Origin)
- Request: same endpoint with session cookie, missing Origin.
- Result: `403` with `CSRF_ORIGIN_MISSING`.

3. Authenticated paid checkout creation
- Request: same endpoint with valid Origin + session.
- Result: `200`, PayOS checkout URL returned, pending payment created.

4. Return URL tampering (fake order)
- Request: `GET /api/courses/checkout/return?orderCode=999...&status=PAID&id=fake`.
- Result: `307 -> /courses?checkout=not_found`.

5. Return URL tampering (real order + wrong paymentLinkId)
- Request: real `orderCode`, mismatched `id`.
- Result: `307 -> /courses?checkout=invalid`.

6. Return URL abuse (real pending order + correct id + status=PAID)
- Result: `307 -> /courses?checkout=processing...` (no enrollment granted).

7. Mock-success bypass on production
- Request: `/api/courses/checkout/mock-success?...`.
- Result: `307 -> /courses?error=invalid_checkout` (blocked).

8. Webhook spoofing
- Request: `POST /api/billing/webhooks/payos` with fabricated payload/signature.
- Result: `401 Invalid PayOS signature`.

9. Paid lesson resource bypass
- Request: non-enrolled parent calls `/api/lessons/{order8}/video-token`.
- Result: `403 PREVIEW_NOT_ELIGIBLE`.
- Token tampering test (`secure-playback` with token from another lesson): `403 Invalid playback token`.

## Final security posture (from tested paths)
- No successful bypass found for:
  - unpaid enrollment grant,
  - unauthorized checkout creation,
  - trial lock bypass on locked lesson,
  - PayOS webhook spoof enrollment.

## Residual risk
- `GET /api/courses/checkout/return` is publicly callable and can act as order-status oracle (`not_found` vs `processing/pending`).
- Current order code generation uses timestamp-derived component + 3-digit random suffix.

## Recommended next hardening
1. Add signed `state` (HMAC) to return URL and verify server-side against stored payment record.
2. Rate-limit `GET /api/courses/checkout/return` by IP and `orderCode`.
3. Consider requiring authenticated parent context for return-status reveal pages.
4. Increase entropy/opacity for externally visible order reference if feasible.

## Unresolved questions
- Do we want strict auth gating for `/api/courses/checkout/return` (parent session required) or keep public redirect behavior for PayOS callback UX?
- Should order reference strategy be changed now, or after adding signed return state + route rate limit?
