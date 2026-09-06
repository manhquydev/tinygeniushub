# Platform kernel contract

**Authority:** `docs/decisions/260904-1102-platform-kernel.md` (accepted).

This file is the implementer cheat-sheet. Do not re-decide here.

## Layers

```
Parent (login user, household)
  ├── ChildProfile A, B     progress, skills, reports
  └── Tickets (parent-scoped)  what the house may learn
          ↓
     Lesson (playable)  ← catalogs map into this
          ↓
     Skill (mastery)
```

Catalogs (Track content, Course SKU, Abeka, partners) are **plugins**. They are not the kernel.

## Access

```
canAccess(parentId, lessonId) -> boolean
```

True iff a non-expired household ticket covers the lesson’s catalog/level.

Kid routes: parent session + `childId` query/body. Never a child cookie.

## Money

| Offering kind | Provider | Effect |
|---|---|---|
| `RECURRING` | Stripe Billing | auto-charge; ticket `validUntil` follows period |
| `ONE_TIME_PROGRAM` | PayOS or Stripe payment | ticket for whole catalog |
| `ONE_TIME_LEVEL` | PayOS or Stripe payment | ticket for one level |

One `PaymentRecord` ledger. Webhook → grant/extend ticket. Not three access tables.

## Module ownership (target)

| Concern | Module |
|---|---|
| Tickets / canAccess | `src/modules/entitlement/` |
| Offerings / prices | `src/modules/entitlement/` or `src/modules/billing/` offerings |
| Playable complete/watch | `src/modules/learning/` |
| Skills / review | `src/modules/adaptive/` |
| Child profiles | `src/modules/progress/` |
| Catalog content map | catalog module (`content`, later `abeka` adapter) |

## Cutover rule

Until entitlement cutover is done, document dual-read in the active plan only. After cutover, delete access checks that use only `CourseEnrollment` or Abeka journey rows.

## Out of kernel (do not put here)

Child login, per-child licenses, garden zone keys, Abeka-specific complete APIs, newsletter, B2B invoice billing, MFA.
