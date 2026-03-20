# Phase 05 - E2E and Local Docker Validation

## Goal
Xác thực end-to-end toàn luồng mua bundle -> vào học -> hiển thị đúng ảnh và đúng trang kid.

## Validation Matrix
- Catalog:
  - `/courses` có đúng 3 card
  - ảnh đúng theo bộ
- Detail + checkout:
  - vào chi tiết từng bộ
  - checkout thành công
  - enrollment hàng loạt đúng số lượng
- Kid dashboard:
  - `/kid/courses?childId=cmmn9hr2w0006mmt8dicgnatk` thấy khóa đã mua + ảnh đúng
  - click vào khóa vào đúng `/kid/courses/[slug]`
- Kid detail:
  - giao diện mới load ổn
  - marker test tồn tại

## Commands
1. `pnpm check:i18n`
2. `pnpm type-check`
3. `pnpm test:e2e:full`
4. `pnpm test:e2e:security`
5. `pnpm test:local:full`
6. `docker compose ps` (xác nhận web/worker/postgres/redis healthy)

## Planned Files
- Modify (if needed): `scripts/e2e-full-local.mjs`
- Modify (if needed): `scripts/e2e-security-abuse.mjs`

## Success Criteria
- Tất cả command pass.
- Không có regression ở luồng child switching và lesson completion.

## Risks
- E2E fail do selector UI thay đổi.

## Mitigation
- Không assert vào text động; ưu tiên `data-testid` và route marker cố định.
