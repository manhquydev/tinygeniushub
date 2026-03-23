---
title: "Three-Bundle Courses + Kid Cloud Garden Refresh"
description: "Chuẩn hóa 3 bộ khóa học, mua 1 mở trọn bộ, đồng bộ ảnh giữa /courses và /kid/courses, và custom UI/UX Cloud Garden theo tài liệu GenAI."
status: pending
priority: P1
effort: 20h
branch: main
tags: [feature, frontend, backend, api]
created: 2026-03-14
---

# Three-Bundle Courses + Kid Cloud Garden Refresh

## Scope
- Rút `/courses` về đúng 3 bộ khóa:
  - Abeka
  - Little Fox EN
  - Little Fox CN
- Chuẩn hóa ảnh khóa học để hiển thị đồng nhất tại:
  - `/courses`
  - `/kid/courses?childId=...`
  - `/kid/courses/[slug]?childId=...`
- Mua 1 bộ thì mở toàn bộ cấp độ thuộc bộ đó (không mua lẻ từng level).
- Custom lại UI/UX:
  - Trang học tập của bé: `/kid/courses`
  - Trang chi tiết học theo khóa: `/kid/courses/abeka-k4` (và các slug tương tự)
  - Theo định hướng Three.js trong:
    - `docs/GenAI/KISU_Cloud_Garden_UIUX_Ideas.md`
    - `docs/GenAI/KISU_Cloud_Garden_Prompts.md`

## Current State (Verified)
- DB hiện có 28 course publish (`abeka-*`, `little-fox-en-*`, `little-fox-cn-*`), tất cả `coverImageUrl = null`.
- `/courses` đang list toàn bộ course publish, chưa gom 3 bộ.
- `/kid/courses` lấy từ enrollment; hiển thị ảnh theo `course.coverImageUrl` nên đang rơi fallback emoji.
- Có sẵn 3 ảnh đã cung cấp:
  - `/public/images/courses/course_cover_abeka.png`
  - `/public/images/courses/course_cover_littlefox.png`
  - `/public/images/courses/course_cover_littlefox_cn.png`
- UI kid hiện tại là CSS/DOM animation, chưa có Three.js runtime.

## Approach Decision
- Chọn hướng **không migration schema** ở vòng này (KISS/YAGNI):
  - Dùng config mapping 3 bundle theo slug pattern.
  - Checkout bundle sẽ enroll tất cả course con theo pattern.
  - Trang `/courses` chỉ render 3 bundle card.
- Lý do:
  - Ra nhanh, ít rủi ro thay đổi DB.
  - Không phá luồng journey hiện tại đang gắn vào `courseId/slug` cụ thể.

## Phases

| # | Phase | Status | Effort | Link |
|---|---|---|---|---|
| 1 | Baseline + contracts | Pending | 2h | [phase-01](./phase-01-baseline-and-contracts.md) |
| 2 | 3-bundle catalog + purchase flow | Pending | 6h | [phase-02](./phase-02-courses-three-bundle-and-checkout.md) |
| 3 | Kid linkage + image normalization | Pending | 4h | [phase-03](./phase-03-kid-dashboard-image-linkage.md) |
| 4 | Cloud Garden UI/UX + Three.js integration | Pending | 6h | [phase-04](./phase-04-cloud-garden-uiux-threejs.md) |
| 5 | E2E + Docker local review | Pending | 2h | [phase-05](./phase-05-e2e-docker-validation.md) |

## File Impact (planned)
- `src/modules/courses/*` (bundle mapping, media resolver, checkout bundle logic)
- `src/app/(main)/courses/page.tsx`
- `src/app/(main)/courses/[slug]/page.tsx`
- `src/components/courses/course-checkout-button.tsx`
- `src/app/api/courses/[slug]/checkout/route.ts`
- `src/app/api/courses/checkout/mock-success/route.ts`
- `src/modules/courses/course-service.ts`
- `src/components/kid-courses/KidCoursesDashboard.tsx`
- `src/components/kid-courses/kid-courses.css`
- `src/components/kid-sky-garden/KidSkyGardenScene.tsx`
- `src/components/kid-sky-garden/sky-garden.css`
- `scripts/e2e-*.mjs` (nếu selector/marker thay đổi)

## Acceptance Criteria
- `/courses` chỉ hiển thị đúng 3 bộ với đúng 3 ảnh đã cung cấp.
- Bấm từng card vào trang chi tiết có nội dung giới thiệu + nút mua.
- Mua 1 bộ -> tạo enrollment cho toàn bộ course thuộc bộ đó (idempotent).
- Sau mua, `/kid/courses?childId=cmmn9hr2w0006mmt8dicgnatk` hiển thị khóa đã mua kèm ảnh đúng.
- `/kid/courses/[slug]` dùng giao diện mới theo concept cloud-garden + cảm giác chiều sâu (Three.js).
- Pass:
  - `pnpm check:i18n`
  - `pnpm type-check`
  - `pnpm test:e2e:full`
  - `pnpm test:e2e:security`
  - chạy full local với Docker không lỗi.

## Risks
- Bundle logic nếu map sai slug có thể enroll thiếu/thừa course.
- UI Three.js có thể nặng trên mobile cấu hình thấp.
- E2E selector flake nếu animation thay đổi mạnh.

## Mitigation
- Unit tests cho slug→bundle resolver và enrollment expansion.
- Feature flag + reduced-motion + low-performance mode cho scene.
- Giữ marker test ổn định (`data-testid`) tách khỏi lớp animation.
