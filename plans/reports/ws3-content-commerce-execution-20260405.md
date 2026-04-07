# WS3 Content + Commerce Execution Report (2026-04-05)

## Scope
- Chốt policy `0đ = free tạm thời`.
- Chuẩn hóa UI card `/courses` đồng kích thước.
- Kiểm tra + backfill chất lượng mô tả course theo ngưỡng `>=80`.

## Code Changes
- `src/modules/courses/course-pricing.ts`
  - Thêm `statusLabel: freeTemporary` khi `salePriceVnd=0`.
- `src/app/api/admin/courses/[id]/publish/route.ts`
  - Cho phép publish course `0đ`.
  - Chặn publish nếu sale window invalid.
  - Thêm gate mô tả course tối thiểu 80 ký tự.
- `src/app/api/admin/courses/[id]/route.ts`
  - Gate mô tả course tối thiểu 80 ký tự khi publish qua PATCH.
- `src/components/courses/course-card.tsx`
  - Chuẩn hóa card height bằng fixed zones + CTA đáy thẻ.
  - Hiển thị `Miễn phí` cho course `0đ`.
- `src/app/(main)/courses/page.tsx`
  - Grid `items-stretch` để đồng bộ chiều cao card.
- `src/components/courses/course-detail-sidebar.tsx`
- `src/components/courses/course-detail-sticky-header.tsx`
  - Copy hiển thị `0đ (miễn phí tạm thời)` thay vì `Giá đang cập nhật` cho course free.
- `src/modules/courses/course-checkout-service.ts`
  - Giữ chặn checkout paid gateway với amount `<=0`, đổi message theo policy free tạm thời.

## Docs/Anti-Drift
- `docs/abeka-curriculum-system.md`
  - Khóa mapping chính thức `K4..G12 => level 0..13`.
- `docs/business/abeka-course-package-design.md`
  - Thêm section `Canonical Grade Level Mapping (Lock)`.
- `scripts/import-abeka-videos.ts`
  - Sửa comment mapping để tránh drift nhận thức importer.
- `plans/260404-1431-abeka-stabilization-parallel-plan/ws3-content-and-commerce-quality.md`
  - Ghi rõ thresholds/policy/status WS3.
- `plans/260404-1431-abeka-stabilization-parallel-plan/plan.md`
  - Cập nhật progress WS3.

## Production Data Audit (before backfill)
- Published courses: `12`
- Published course description pass (`>=80`): `5/12`
- Active package description pass (`>=60`): `8/8`
- Video description pass (`>=20`): `20195/20195`
- `0đ` courses total: `18` (published `12`, unpublished `6`)

## Production Backfill Performed
Command class:
- SQL update trực tiếp trên production DB (`root-postgres-1`) cho các course `0đ` có description `<80`.

Result:
- Rows updated: `13`
- Remaining short desc in 18-course 0đ set: `0`
- Published desc pass (`>=80`) after backfill: `12/12`

## Validation
- Worker verification:
  - `pnpm type-check`
  - `pnpm exec vitest run src/modules/courses/course-pricing.test.ts src/app/api/admin/courses/[id]/publish/route.test.ts src/app/api/admin/courses/[id]/route.test.ts`
  - `pnpm exec eslint src/components/courses/course-card.tsx src/app/(main)/courses/page.tsx`

## Unresolved Questions
1. Có cần publish thêm 6 course `0đ` đang ở trạng thái unpublished để đủ “18 course live” không?
2. Có muốn mở flow enroll miễn phí trực tiếp (không qua contact/support) cho khóa `0đ` hay giữ như hiện tại?
