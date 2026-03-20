# Phase 03 - Kid Dashboard Linkage and Image Normalization

## Goal
Đảm bảo ảnh khóa học hiển thị đồng nhất giữa `/courses` và `/kid/courses`, kể cả khi DB chưa có `coverImageUrl`.

## Requirements
- `/kid/courses?childId=...` hiển thị ảnh đúng theo bundle đã mua.
- `/kid/courses/[slug]?childId=...` cũng dùng cùng chuẩn ảnh.
- Nếu course publish mới có slug đúng pattern, tự ăn ảnh đúng mà không cần nhập tay.

## Planned Files
- Modify: `src/modules/courses/course-service.ts`
- Modify: `src/components/kid-courses/KidCoursesDashboard.tsx`
- Modify: `src/app/(kid-app)/kid/courses/[slug]/page.tsx`
- Optional: script backfill dữ liệu cover
  - Create: `scripts/backfill-course-covers.mjs`

## Implementation Steps
1. Tại server service, khi trả dữ liệu course:
   - `coverResolved = coverImageUrl ?? resolveCourseCoverImage(slug)`
2. Truyền `coverResolved` xuyên suốt vào UI.
3. Ở kid card, bỏ fallback emoji nếu có `coverResolved`.
4. Ở trang chi tiết kid course, render hero/course badge dùng ảnh tương ứng.
5. Optional: chạy script cập nhật DB `coverImageUrl` để admin cũng thấy nhất quán.

## Success Criteria
- Cùng một course slug -> cùng một ảnh ở mọi trang.
- Không còn trường hợp `/courses` có ảnh nhưng `/kid/courses` mất ảnh.

## Risks
- Mapping cứng dễ quên khi thêm bundle mới.

## Mitigation
- Đặt mapping tập trung 1 file, dùng chung tất cả nơi render.
