---
title: "Cloud Garden Beanstalk System"
description: "Thiết kế kỹ thuật chi tiết cho hệ khu vườn trên mây: cây đậu, tầng mây, mở tầng theo tiến độ khóa học và trải nghiệm gieo hạt khi mua khóa"
status: proposed
priority: P0
effort: 2-3 tuần (MVP + hardening)
branch: main
tags: [kid-garden, beanstalk, course-journey, animation, ux]
created: 2026-03-12
---

# Cloud Garden Beanstalk System

## Mục tiêu

Xây hệ "Khu vườn trên mây" nơi mỗi khóa học tương ứng một cây đậu riêng của bé.

1. Cây đậu mọc theo tầng mây đã mở.
2. Mỗi lần hoàn thành bài học tạo cảm giác tiến bộ rõ ràng (mở tầng + animation).
3. Mua khóa học mới tương đương gieo hạt mới và bắt đầu hành trình mới.
4. Ưu tiên 2D mượt trên mobile/tablet; có lộ trình nâng cấp hybrid 3D.

## Phạm vi và ranh giới với team khác

- Team khác đang triển khai trực tiếp luồng `/kid/today?childId=...`.
- Thiết kế này **không chặn** công việc đó; chỉ định nghĩa điểm tích hợp để đồng bộ sau.
- Trước mắt triển khai độc lập trong `/kid/garden` và API Garden.

## Tài liệu chi tiết

- Thiết kế đầy đủ: [technical-design.md](./technical-design.md)

## Lộ trình triển khai đề xuất

| Phase | Nội dung | Kết quả |
|---|---|---|
| 1 | Data model + journey service | Có dữ liệu cây đậu/tầng mây theo child+course |
| 2 | Garden map 2D + beanstalk growth | Mở được bản đồ cây đậu có animation mọc |
| 3 | Course purchase -> plant flow | Mua khóa -> gieo cây mới |
| 4 | Lesson complete -> unlock tier | Hoàn thành bài -> mở tầng + camera + hiệu ứng |
| 5 | Hardening (A11y, perf, E2E) | Sẵn sàng chạy local/CI ổn định |

## Acceptance nhanh

1. Bé có thể thấy nhiều cây đậu tương ứng nhiều khóa đã bắt đầu.
2. Chỉ tầng hiện tại được mở; tầng khóa không cho vào.
3. Khi mở tầng mới có animation cây mọc và cloud unlock rõ ràng.
4. Mua khóa mới tạo cây mới trong vườn (qua flow chọn hồ sơ bé).
5. Không làm gãy route hiện tại của `/kid/today`.
