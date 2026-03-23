---
title: "Child-Profile Learning Flow + Grouped Course Outline"
description: "Chuẩn hóa luồng học theo hồ sơ trẻ, bỏ luồng rời rạc theo query childId, và thiết kế hiển thị bài học theo nhóm cho Abeka/LittleFox/LittleFoxCN"
status: proposed
priority: P0
effort: 3-4 days
branch: main
tags: [learning-flow, routing, onboarding, courses, kid-app]
created: 2026-03-12
---

# Child-Profile Learning Flow + Grouped Course Outline

## 1) Kết luận kiểm tra logic hiện tại

### Root cause A: Luồng mua khóa học và luồng học theo trẻ đang tách rời
- Mua/đăng ký course đi theo `CourseEnrollment(parentId, courseId)` và mở `/courses/[slug]/lessons`.
- Luồng kid lại đi theo `childId` ở query (`/kid/today?childId=...`) và mission của `getTodayMission`.
- Kết quả: phụ huynh không có câu trả lời rõ ràng cho câu hỏi "đăng ký xong học ở đâu theo hồ sơ nào".

### Root cause B: Course player đang lưu tiến độ localStorage, không theo hồ sơ trẻ
- `src/components/courses/course-lessons-player.tsx` dùng `ccth_course_progress_*` + `*_done`.
- `enrollmentId` truyền vào nhưng bị bỏ qua.
- Dẫn tới tiến độ bị dính theo browser/session, không phải tiến độ học của từng bé.

### Root cause C: Nút vào học phân tán sang nhiều điểm vào, không có route chuẩn
- Parent dashboard, children manager, cron links đều trỏ tới `/kid/today?childId=...`.
- Checkout mock success lại redirect tới `/courses/[slug]/lessons`.
- Không có một route "entry" thống nhất để: kiểm tra đăng ký -> chọn hồ sơ -> vào học.

## 2) Mục tiêu thiết kế

1. Học luôn gắn với hồ sơ trẻ (child profile), không phụ thuộc localStorage/query rời rạc.
2. Rõ route chuẩn từ ngoài vào trong: setup -> dashboard -> chọn khóa -> chọn hồ sơ -> học.
3. Course lessons hiển thị theo nhóm có nghĩa với dữ liệu import hiện có:
- Abeka theo nhóm K/G (K4, K5, G1...).
- LittleFox/LittleFoxCN theo Level -> Series -> Episode.
4. Tương thích ngược URL cũ bằng redirect rõ ràng, không gãy luồng production.

## 3) Không làm trong scope này

- Không thay kiến trúc payment/provider.
- Không thay adaptive engine cốt lõi.
- Không refactor toàn bộ UI Kid Journey.

## 4) Route chuẩn đề xuất

### Canonical learning routes
- `GET /courses/[slug]/learn`:
  entry cho course đã đăng ký, chịu trách nhiệm chọn hồ sơ trẻ.
- `GET /kid/children/[childId]/courses/[slug]`:
  trang học course theo hồ sơ trẻ.
- `GET /kid/children/[childId]/today`:
  trang nhiệm vụ hôm nay theo hồ sơ trẻ.

### Compatibility redirects
- `/courses/[slug]/lessons` -> `/courses/[slug]/learn`.
- `/kid/today?childId={id}` -> `/kid/children/{id}/today`.
- `/kid/today` -> resolve active child rồi redirect canonical.

## 5) Phân rã phase

| # | Phase | Trọng tâm | Kết quả |
|---|---|---|---|
| 1 | [Routing + Redirect](./phase-01-routing-and-redirect.md) | Chuẩn hóa entrypoint + chuyển hướng | Luồng học không rời rạc |
| 2 | [Grouped Course Outline](./phase-02-grouped-lesson-presentation.md) | Render bài học theo nhóm Abeka/LittleFox | UI course rõ cấu trúc |
| 3 | Verification | E2E outside-in + regression routes cũ | CI pass, không gãy link cũ |

## 6) Tiêu chí nghiệm thu

1. Sau khi đăng ký khóa học, CTA luôn đi qua `/courses/[slug]/learn`.
2. Nếu phụ huynh có nhiều bé, bắt buộc chọn hồ sơ trước khi mở course player.
3. Tiến độ trong course player hiển thị theo `LessonCompletion(childId, lessonId)` thay vì localStorage.
4. Abeka hiển thị group theo `Level.title` (K4/K5/Gx), LittleFox hiển thị Level -> Series.
5. Tất cả URL legacy vẫn chạy nhờ redirect 30x.
6. E2E flow mới pass theo đường: signup -> setup -> buy/enroll -> choose child -> open video lesson.
