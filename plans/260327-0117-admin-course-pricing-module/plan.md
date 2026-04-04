---
title: "Admin Course Pricing Module E2E Plan"
description: "Plan implement CRUD course + publish visibility + sale pricing windows with real-world edge handling."
status: pending
priority: P1
effort: 18h
branch: main
tags: [admin, courses, pricing, prisma, api, ui, testing]
created: 2026-03-27
---

## Scope
Implement admin module end-to-end for:
- CRUD khoa hoc
- Trang thai draft/published/public visibility
- Gia goc, gia khuyen mai
- Khung thoi gian khuyen mai
- Real-world cases: sale scheduled, expired, invalid price/window, timezone, publish/unpublish guard

## Phase Plan + Priority TODO

### Phase 1 - Domain Rules Freeze (P0, 2h)
- [ ] Chot pricing invariants (single source of truth):
  - `listPriceVnd >= 0`, integer
  - `salePriceVnd` null OR `0 < salePriceVnd < listPriceVnd`
  - Sale window: start/end phai di cung nhau, `start < end`
  - Luu DB theo UTC, UI nhap theo local timezone
- [ ] Chot sale status state machine: `none | scheduled | active | expired | invalid`
- [ ] Chot publish guard:
  - Publish FAIL neu price khong purchasable
  - Publish FAIL neu sale status = invalid

### Phase 2 - Data Model + Migration (P0, 2h)
- [ ] Prisma schema ho tro: `listPriceVnd`, `salePriceVnd`, `saleStartsAt`, `saleEndsAt`, `isPublished`
- [ ] Migration toi thieu (khong pha vo du lieu)
- [ ] Backfill an toan: `listPriceVnd = priceVnd` cho records cu bi null

### Phase 3 - Admin API Hardening (P0, 5h)
- [ ] `POST /api/admin/courses`:
  - Validate payload
  - Normalize pricing + timezone UTC
- [ ] `PATCH /api/admin/courses/[id]`:
  - Partial update nhung van enforce pricing invariants
  - Reject invalid windows/price
- [ ] `POST /api/admin/courses/[id]/publish`:
  - Support explicit `isPublished`
  - Block publish khi pricing invalid/not purchasable
- [ ] `DELETE /api/admin/courses/[id]`:
  - Block delete neu da co enrollment
- [ ] Standardize error codes: `COURSE_PRICE_INVALID`, `COURSE_SALE_PRICE_INVALID`, `COURSE_SALE_WINDOW_INVALID`, `COURSE_PUBLISH_PRICING_INVALID`

### Phase 4 - Admin UI Flow (P1, 4h)
- [ ] Form CRUD co du field pricing:
  - gia goc, gia KM, bat dau sale, ket thuc sale
- [ ] Client validation truoc submit (same rules API)
- [ ] Hien thi sale status ro rang trong list/detail
- [ ] Publish/unpublish action co feedback loi tu API
- [ ] Hien thi timezone hint (VD: `Asia/Ho_Chi_Minh`) + convert local->UTC

### Phase 5 - Storefront + Checkout Consistency (P1, 3h)
- [ ] Public listing/detail dung chung pricing resolver
- [ ] Checkout dung effective sale price theo thoi diem `now`
- [ ] Course unpublished khong duoc mua/khong public

### Phase 6 - Test + Rollout Safety (P0, 2h)
- [ ] Unit + API + UI e2e pass
- [ ] Add smoke script cho ca flow: create -> schedule sale -> publish -> checkout
- [ ] Verify edge window qua moc ngay/UTC offset

## Files Should Modify/Create

### Modify
- `prisma/schema.prisma`
- `src/modules/courses/course-pricing.ts`
- `src/modules/courses/course-service.ts`
- `src/modules/courses/course-checkout-service.ts`
- `src/modules/courses/course-bundle-service.ts`
- `src/app/api/admin/courses/route.ts`
- `src/app/api/admin/courses/[id]/route.ts`
- `src/app/api/admin/courses/[id]/publish/route.ts`
- `src/app/(main)/admin/courses/admin-courses-client.tsx`
- `src/app/(main)/admin/courses/[id]/admin-course-detail-client.tsx`

### Create (neu chua co)
- `prisma/migrations/<timestamp>_add_course_sale_window_fields/migration.sql`
- `src/modules/courses/course-admin-pricing.ts`
- `src/modules/courses/course-admin-pricing.test.ts`
- `src/modules/courses/course-pricing.test.ts`
- `src/app/api/admin/courses/route.test.ts`
- `src/app/api/admin/courses/[id]/route.test.ts`
- `src/app/api/admin/courses/[id]/publish/route.test.ts`
- `tests/e2e/admin-course-pricing-management.spec.ts`

## Required Tests

### Unit Tests
- `normalizeCourseAdminPricing`
  - valid: no sale, active sale, scheduled sale
  - invalid: negative price, sale >= list, missing paired start/end, start>=end, sale window without sale price
- `resolveCourseDisplayPricing`
  - `none`, `scheduled`, `active`, `expired`, `invalid`
  - timezone conversion input string/date
  - fallback behavior khi legacy data thieu `listPriceVnd`

### API Tests
- `POST /api/admin/courses`
  - create success (draft)
  - reject invalid sale price/window
- `PATCH /api/admin/courses/[id]`
  - partial patch success
  - reject invalid transition (window invalid)
  - 404 not found
- `POST /api/admin/courses/[id]/publish`
  - publish success when pricing ready
  - reject publish when price pending/invalid
  - unpublish success
- `DELETE /api/admin/courses/[id]`
  - delete success (no enrollment)
  - 409 when has enrollment

### UI Flow / E2E
- Admin create course draft with base price only
- Admin set scheduled sale (future start), status shows "scheduled"
- Admin tries publish with invalid pricing -> blocked, shows error
- Admin publish valid course -> appears on public courses page
- At runtime before/within/after sale window, storefront + checkout show correct effective price
- Timezone scenario: input local datetime near midnight, DB stores UTC and status still đúng

## Minimal Prisma Migration Suggestion
1. Add nullable fields:
   - `saleStartsAt DateTime?`
   - `saleEndsAt DateTime?`
2. Ensure `listPriceVnd` exists and nullable for backward compatibility.
3. Add supporting index:
   - `@@index([isPublished, saleStartsAt, saleEndsAt])`
4. One-time backfill SQL:
   - `UPDATE "Course" SET "listPriceVnd" = "priceVnd" WHERE "listPriceVnd" IS NULL;`

## Unresolved Questions
- Canonical timezone cho admin input: fix `Asia/Ho_Chi_Minh` hay theo browser locale?
- Cho phep publish khi sale `scheduled` khong? (de xuat: cho phep, vi pricing base van valid)
- Course free (`price=0`) co duoc publish khong? (de xuat: quyet dinh business rule ro rang)
