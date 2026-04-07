# Parallel Execution Plan: Abeka Stabilization

## Decisions Locked
1. **Source of truth cho package**: `prisma/seeders/curriculum-packages.ts` là chuẩn duy nhất.  
   Docs phải sync theo code, không ngược lại.
2. **18 khóa giá 0đ**: giữ **free tạm thời**.  
   Cho phép chỉnh giá qua admin, không chặn publish chỉ vì giá 0.
3. **Mục tiêu rollout**: giữ UI ổn định + sửa dứt điểm data allocation + nâng chất lượng mô tả.

## Command Model
- Mode: `parallel`
- Rollout window: 2 ngày làm việc
- Gate bắt buộc: UI, data integrity, package parity, worker stability

## Parallel Workstreams
- [WS1 - Canonical Package + Docs Sync](./ws1-canonical-package-and-doc-sync.md)
- [WS2 - Hierarchy/Allocation Repair](./ws2-abeka-hierarchy-and-allocation-repair.md)
- [WS3 - Content/Commerce Quality](./ws3-content-and-commerce-quality.md)
- [WS4 - Production Verification + Observability](./ws4-production-verification-and-observability.md)

## Sequencing
1. Chạy WS1 + WS4 ngay.
2. WS2 bắt đầu sau khi WS1 chốt spec package.
3. WS3 chạy song song WS2 (không chờ full import).
4. Hợp nhất, smoke test tổng, rồi rollout controlled.

## Critical Gates
- G1: `/`, `/courses`, `/pricing`, `/try-garden`, `/admin/login` đều `200`.
- G2: 8 package codes khớp tuyệt đối spec.
- G3: Allocation count khớp query chuẩn.
- G4: Description quality pass threshold.
- G5: `cungcontuhoc-worker` hết restart storm.

## Definition of Done
- UI không regression.
- Allocation và hierarchy đúng (không còn `AbekaLesson = 0`).
- Package/docs/code đồng bộ.
- Có báo cáo verify production sau triển khai.

## Progress Update (2026-04-05)
- WS1: Completed on production.
  - Canonical package catalog synced to runbooks and business docs.
  - Canonical grade-level mapping locked to `0..13` in docs and importer notes.
  - Production gate parity check passed against canonical package codes.
- WS2: Completed on production.
  - Repaired Abeka hierarchy from existing 20,195 videos.
  - `AbekaLesson`: `0 -> 2380`
  - `AbekaVideo` with null `lessonPackageId`: `20195 -> 0`
  - Grade set normalized to 14 levels (`0..13`) and stale `-1` cleaned.
- WS4: Completed on production.
  - Gate script created and verified live.
  - Worker restart storm fixed.
  - Post-deploy gate: `PASS=12 WARN=0 FAIL=0`.
- WS3: Completed on production.
  - Commerce policy locked for `0đ` free temporary (`statusLabel=freeTemporary`).
  - Admin publish gates now enforce description quality and still allow free-temporary publish.
  - `/courses` card layout normalized for equal-height rendering and consistent data fields.
  - Content backfill completed: published course description quality reached `12/12` (>=80 chars).
  - Storefront checks passed (`Miễn phí`, `0đ (miễn phí tạm thời)` visible).
