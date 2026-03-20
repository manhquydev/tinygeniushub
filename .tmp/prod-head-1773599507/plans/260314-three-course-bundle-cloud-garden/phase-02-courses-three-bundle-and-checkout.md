# Phase 02 - /courses Three Bundle and Checkout

## Goal
Biến `/courses` thành storefront 3 bundle; mỗi bundle có detail và flow mua mở trọn bộ.

## Requirements
- `/courses` hiển thị đúng 3 card bundle + 3 ảnh được cung cấp.
- `/courses/[slug]` của root slug hiển thị:
  - Intro bundle
  - Phạm vi nội dung (các level/grade bên trong)
  - CTA mua
- Mua bundle:
  - 1 giao dịch mock
  - enroll parent vào tất cả course thuộc bundle
  - idempotent nếu đã enroll một phần.

## Planned Files
- Modify: `src/app/(main)/courses/page.tsx`
- Modify: `src/app/(main)/courses/[slug]/page.tsx`
- Modify: `src/components/courses/course-checkout-button.tsx`
- Modify: `src/modules/courses/course-checkout-service.ts`
- Modify: `src/app/api/courses/[slug]/checkout/route.ts`
- Modify: `src/app/api/courses/checkout/mock-success/route.ts`
- Modify: `src/modules/courses/course-service.ts`
- Create: `src/modules/courses/course-bundle-checkout-service.ts` (nếu cần tách logic)

## Design Notes
- Không expose 28 course ở storefront chính.
- Vẫn giữ route cũ để không gãy link deep-link nội bộ.
- Nếu vào `/courses/abeka-g2` trực tiếp: có thể redirect về root bundle (`/courses/abeka-k4`) để nhất quán mua bundle.

## Implementation Steps
1. Query tất cả course publish, group theo bundle mapping.
2. Tính metadata bundle:
   - tổng số level
   - tổng số lesson
   - giá bundle (rule cố định hoặc theo cấu hình)
3. Render `/courses` từ bundle list, không render course lẻ.
4. Cập nhật checkout service nhận `bundleRootSlug` và expand danh sách `courseIds`.
5. Ở mock-success, tạo enrollment hàng loạt theo transaction.
6. Redirect sau mua về kid route có `childId`.

## Success Criteria
- Người dùng chỉ nhìn thấy 3 bundle ở `/courses`.
- Mua 1 bundle xong, DB có enrollment cho toàn bộ course trong bundle.
- Không tạo enrollment trùng khi callback lặp lại.

## Risks
- Tính giá bundle chưa thống nhất business.
- Callback mock có thể race-condition khi song song.

## Mitigation
- Chốt tạm giá từ config bundle, không suy luận tự động.
- Transaction + `upsert/findUnique` theo unique `(courseId,parentId)`.
