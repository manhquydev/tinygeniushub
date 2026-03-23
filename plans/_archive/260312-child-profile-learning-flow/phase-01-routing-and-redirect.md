# Phase 01 - Routing and Redirect

## 1) Vấn đề hiện tại (evidence)

### A. Course detail/checkout mở vào luồng không có child context
- `src/app/(main)/courses/[slug]/page.tsx`: CTA enrolled -> `/courses/${slug}/lessons`.
- `src/app/api/courses/checkout/mock-success/route.ts`: success redirect -> `/courses/${slug}/lessons`.

### B. Course lessons player không gắn child
- `src/app/(main)/courses/[slug]/lessons/page.tsx`: chỉ check parent enrollment.
- `src/components/courses/course-lessons-player.tsx`:
  - dùng localStorage (`ccth_course_progress_*`),
  - `enrollmentId` bị bỏ qua,
  - complete course theo parent enrollment, không theo child.

### C. Kid flow dùng query childId phân tán
- `src/app/(kid-app)/kid/today/page.tsx`: lấy `searchParams.childId`.
- `src/components/kid-mission-panel.tsx`: update query `childId`, fetch `/api/lessons/today?childId=...`.
- `src/app/(main)/parent/dashboard/page.tsx` và `src/components/children-manager.tsx`: link vào `/kid/today?childId=...`.

## 2) Thiết kế route chuẩn

## 2.1 Canonical routes

1. `GET /courses/[slug]/learn`
- Auth: parent.
- Check enrollment.
- Nếu chưa enrollment: redirect `/courses/[slug]` + message.
- Nếu chưa có child profile: redirect `/setup?next=/courses/[slug]/learn`.
- Nếu có 1 child: redirect thẳng `/kid/children/[childId]/courses/[slug]`.
- Nếu có nhiều child: render picker để chọn hồ sơ.

2. `GET /kid/children/[childId]/courses/[slug]`
- Auth: parent.
- Validate child thuộc parent.
- Validate parent đã enroll course.
- Render course outline + lesson player theo child progress.

3. `GET /kid/children/[childId]/today`
- Auth: parent.
- Validate child thuộc parent.
- Render mission panel theo child.

## 2.2 Compatibility redirects

| URL cũ | URL mới | Ghi chú |
|---|---|---|
| `/courses/[slug]/lessons` | `/courses/[slug]/learn` | Giữ trải nghiệm cũ không gãy |
| `/kid/today?childId={id}` | `/kid/children/{id}/today` | Query -> path param |
| `/kid/today` | `/kid/children/{resolvedChildId}/today` | resolve theo cookie hoặc child đầu tiên |

## 2.3 Route ownership

- `courses/*`: điểm vào cho parent quyết định học khóa nào.
- `kid/children/*`: mọi trải nghiệm học đều phải có `childId` ở path.

## 3) Thay đổi component/page cụ thể

1. `src/app/(main)/courses/[slug]/page.tsx`
- Đổi CTA enrolled từ `/courses/[slug]/lessons` -> `/courses/[slug]/learn`.

2. `src/app/api/courses/checkout/mock-success/route.ts`
- Đổi destination từ `/courses/[slug]/lessons` -> `/courses/[slug]/learn`.

3. Tạo page mới `src/app/(main)/courses/[slug]/learn/page.tsx`
- Server component load:
  - parent,
  - enrollment,
  - children profiles.
- Nhánh redirect/render đúng theo rule ở mục 2.1.

4. Tạo route/page mới cho canonical kid pages
- `src/app/(kid-app)/kid/children/[childId]/today/page.tsx`
- `src/app/(kid-app)/kid/children/[childId]/courses/[slug]/page.tsx`

5. Điều chỉnh các link entry hiện hữu
- `src/app/(main)/parent/dashboard/page.tsx`
- `src/components/children-manager.tsx`
- dùng canonical path thay vì query `childId`.

## 4) Quy tắc guard và redirect

Pseudo-code server guard:

```ts
async function resolveParentChildOrRedirect(parentId: string, childId: string, nextPath: string) {
  const child = await prisma.childProfile.findFirst({ where: { id: childId, parentId } });
  if (!child) redirect(`/parent/children?error=child_not_found&next=${encodeURIComponent(nextPath)}`);
  return child;
}

async function resolveCourseEnrollmentOrRedirect(parentId: string, slug: string) {
  const course = await getCourse(slug);
  if (!course) notFound();
  const enrollment = await getEnrollment(course.id, parentId);
  if (!enrollment) redirect(`/courses/${slug}?error=not_enrolled`);
  return { course, enrollment };
}
```

## 5) Trạng thái active child

Khuyến nghị tối thiểu:
- Lưu `activeChildId` qua URL path (canonical source of truth).
- Có thể bổ sung cookie `ccth_active_child` để route không có child param vẫn resolve nhanh.

Không dùng query `childId` làm nguồn chính.

## 6) Course player: chuyển từ localStorage sang DB progress theo child

### 6.1 Nguồn tiến độ
- `LessonCompletion(childId, lessonId)` là nguồn hoàn thành.
- `LessonProgress(childId, lessonId)` là nguồn thời lượng/lastAccessed.

### 6.2 Thay đổi
- `CourseLessonsPlayer` nhận thêm `childId`.
- API complete gọi endpoint lesson-level (đã có) hoặc tạo endpoint bulk-progress theo child.
- Chỉ giữ localStorage cho state UI tạm (panel mở/đóng), không dùng làm progress nguồn chính.

## 7) Regression + E2E

Cập nhật test ngoài-vào-trong:
1. Signup -> `/setup` -> tạo child.
2. Mua hoặc enrolled course.
3. vào `/courses/abeka/learn`.
4. chọn child nếu nhiều hồ sơ.
5. vào `/kid/children/[childId]/courses/abeka`.
6. mở lesson đầu tiên, lấy `/api/lessons/[id]/video-token` thành công.

Thêm test redirect compatibility:
- old `/courses/abeka/lessons` phải sang `/courses/abeka/learn`.
- old `/kid/today?childId=...` phải sang canonical path.

## 8) Rủi ro và giảm thiểu

1. Rủi ro gãy deeplink cũ.
- Giảm thiểu: redirect 30x + e2e cho legacy paths.

2. Rủi ro sai quyền khi child không thuộc parent.
- Giảm thiểu: server-side ownership check ở mọi canonical kid route.

3. Rủi ro dữ liệu progress lệch giữa localStorage cũ và DB.
- Giảm thiểu: coi DB là nguồn chuẩn từ mốc release, bỏ read completion từ localStorage.
