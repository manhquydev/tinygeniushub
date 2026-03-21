---
phase: 2
title: "Race Conditions & Webhooks"
status: pending
priority: P1
effort: 2h
---

# Phase 2: Race Conditions & Webhooks

## Findings: C4, H1, H2, H3

## Context Links
- `src/modules/billing/webhook-service.ts` — billing webhook processing
- `src/modules/progress/children-service.ts` — child profile CRUD
- `src/modules/referral/service.ts` — referral code claiming
- `src/app/api/coupons/validate/route.ts` — coupon validation

---

## C4 — Webhook Replay Race Condition

**Problem**: Between `findUnique` (line 74) and `create` (line 104), a concurrent request with same eventId can slip through. The unique constraint catch at line 113 handles the insert race, but a more subtle race exists: two concurrent requests both see `existingEvent === null`, both attempt create, one fails and retries, but meanwhile the first has already started processing. The `$transaction` uses default isolation (Read Committed), so the duplicate check at line 74 is not serializable.

**Current mitigation**: The code already handles this partially with the unique constraint catch + re-check pattern (lines 113-148). However, there's still a window where two transactions both process the same webhook.

**Files to modify**:
- `src/modules/billing/webhook-service.ts`

**Changes**:

Add `pg_advisory_xact_lock` at the start of the transaction to serialize processing per eventId:

```ts
export async function processBillingWebhook(params: {
  payload: z.infer<typeof billingWebhookSchema>;
}) {
  const payload = billingWebhookSchema.parse(params.payload);

  return prisma.$transaction(async (tx) => {
    // Advisory lock keyed on provider+eventId hash to serialize concurrent webhook replays
    const lockKey = hashWebhookLockKey(payload.provider, payload.eventId);
    await tx.$queryRawUnsafe(`SELECT pg_advisory_xact_lock($1)`, lockKey);

    const existingEvent = await tx.webhookEvent.findUnique({
    // ... rest unchanged
```

Add helper above `processBillingWebhook`:
```ts
import { createHash } from "node:crypto";

function hashWebhookLockKey(provider: string, eventId: string): bigint {
  const hash = createHash("sha256").update(`${provider}:${eventId}`).digest();
  // Use first 8 bytes as a signed 64-bit integer for pg_advisory_xact_lock
  return hash.readBigInt64BE(0);
}
```

**Note**: The `$queryRawUnsafe` is safe here because `lockKey` is a BigInt computed internally, not user input.

---

## H1 — Race Condition: Child Profile Limit Bypass

**Status**: **ALREADY MITIGATED**. Code at `children-service.ts:34` uses `Prisma.TransactionIsolationLevel.Serializable` with a 3-retry loop for serialization failures. This is the correct approach for preventing limit bypass.

**Action**: Verify only, no code change needed.

---

## H2 — Race Condition: Referral Double-Reward

**Status**: **ALREADY MITIGATED**. The `claimReferralCodeForParent` function (line 152-212):
1. Checks `findUnique` for existing attribution (line 171)
2. Attempts `create` (line 183)
3. Catches unique constraint violation on `referredParentId` (line 195)
4. Falls back to `findUnique` (line 199)

The `referredParentId` unique constraint at the DB level prevents double-reward. The code handles the race gracefully.

**Action**: Verify only, no code change needed.

---

## H3 — Unauthenticated Coupon Validation

**Problem**: `POST /api/coupons/validate` has no auth check and no rate limiting. Allows enumeration of valid coupon codes.

**Files to modify**:
- `src/app/api/coupons/validate/route.ts`

**Changes**:

Add auth + rate limiting:
```ts
import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { validateCoupon } from "@/modules/admin/service";
import { getParentFromRequest } from "@/lib/auth/session";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit({
      key: `coupon:validate:ip:${ip}`,
      limit: 10,
      windowMs: 60_000,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      return fail("Too many requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const body = (await request.json()) as {
      code?: string;
    };

    const result = await validateCoupon(body.code ?? "");
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
```

---

## Todo List

- [ ] Add `pg_advisory_xact_lock` to webhook processing (C4)
- [ ] Add `hashWebhookLockKey` helper function (C4)
- [ ] Add auth check to coupon validation endpoint (H3)
- [ ] Add rate limiting to coupon validation endpoint (H3)
- [ ] Verify H1 serializable isolation is correct (no code change)
- [ ] Verify H2 unique constraint handling is correct (no code change)

## Risk Assessment

- **C4 advisory lock**: `pg_advisory_xact_lock` is transaction-scoped, auto-releases on commit/rollback. No deadlock risk since it's the first operation. Performance impact negligible for webhook volume.
- **H3 auth requirement**: Breaking change if frontend calls this endpoint before user is logged in. Check all callers.

## Security Considerations

- Advisory locks use a global lock space; hash collision probability is negligible for 64-bit keys.
- Coupon rate limit of 10/min per IP is conservative enough to prevent enumeration while allowing normal checkout flow.
