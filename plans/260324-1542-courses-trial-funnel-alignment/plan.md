---
title: "Courses Trial-7 + Funnel Alignment"
description: "Chot trial 7 bai dau, dong bo UI/API/data/tracking, giam overload card /courses, chot dashboard SoT"
status: in_progress
priority: P1
effort: 4d
branch: main
tags: [courses, trial, funnel, ga4, sql-audit]
created: 2026-03-24
---

# Muc tieu sprint
- Chot policy: trial fixed 7 bai dau cho `/courses/[slug]`.
- Dong bo claim giua Data/UI/API/Tracking de khong lech.
- Giam overload card trang `/courses`, day nguoi dung vao detail de ra quyet dinh.
- KPI uu tien: `detail -> checkout_start`, `purchase_success`, `giam mua sai level`.
- Dashboard SoT: `GA4 + SQL audit logs`.

# KPI (chot theo user)
- `KPI-1: detail_to_checkout_start_rate`
  - Cong thuc: unique users `checkout_start` / unique users `course_detail_view`.
- `KPI-2: purchase_success_rate`
  - Cong thuc: purchases success / `checkout_start`.
- `KPI-3: wrong_level_purchase_rate`
  - Cong thuc: so don co yeu cau doi level/chuyen khoa sau mua / tong don thanh cong.
  - Cua so chot: `7 ngay sau mua` (KPI chinh), `3 ngay` dung lam chi bao som.

# Decision lock (2026-03-24)
- Chot KPI `wrong_level_purchase_rate_7d` lam KPI ra quyet dinh sprint.
- Chot event `level_change_request` ghi nhan ca 2 moc:
  - `level_change_request_created` (dung cho numerator KPI mua sai level)
  - `level_change_request_decided` (dung cho KPI van hanh/quality support)
- Chot `courses_preview_play_success` la `load success`, KPI chat luong preview doi sang `courses_preview_watch_qualified`.
- Chot dashboard visualization chinh: `admin page noi bo` (SoT: GA4 + SQL audit), Looker/Metabase de secondary view khi can.
- Chot phase 2 preview qualification:
  - `secure`: `20s`, `confidence=high`
  - `embed`: `30s`, `confidence=medium` (chi dem khi modal con mo + tab visible + window focus)
- Chot GA4 production SoT:
  - `GA4_PROPERTY_ID` phai la property dang gan web stream production cho domain `cungcontuhoc.io.vn` (cung stream voi `NEXT_PUBLIC_GA4_MEASUREMENT_ID` production).
  - Runtime bat buoc khi rollout SoT: `GA4_SOT_REQUIRED=true`.
- Chot noi luu GA4 service-account secrets:
  - Nguon chinh: `GitHub Actions Secrets` (khong commit vao repo, khong luu plaintext trong docs/code).
  - Inject vao runtime env luc deploy, PM2 restart voi `--update-env`.

# Phase 0 - Measurement + Policy (bat buoc truoc UI)
- [x] Chot taxonomy event funnel (ten event + params) cho GA4 va SQL audit logs.
- [x] Chot 1 hang so policy trial duy nhat (`trial_preview_lesson_limit = 7`) va map vao UI/API/data.
- [x] Chot logic do `wrong_level_purchase_rate` dua tren policy doi level/chuyen khoa sau mua.
- [x] Chot schema event toi thieu:
  - `courses_bundle_detail_view` (bundle_slug, variant)
  - `courses_checkout_start` + `course_checkout_started` (client + audit log)
  - `course_purchase_succeeded` (audit log)
  - `level_change_request_created` + `level_change_request_decided`
- [ ] Tao checklist anti-drift: policy doc + API contract + UI copy + test cases.

# Phase 1 - Dong bo API/Data theo policy trial 7
- [x] Sua backend gating de preview dung 7 bai dau (khong 12/5/3).
- [x] Dong bo data seed/import va trial flag logic de khong tao lech claim moi.
- [x] Dam bao endpoint lesson access va secure playback cung 1 policy.

# Phase 2 - UI toi uu dieu huong /courses -> /courses/[slug]
- [x] Giam mat do thong tin card `/courses` (giu info de click detail, khong lam thay detail page).
- [x] Card CTA ro: xem chi tiet + hoc thu 7 bai (neu can).
- [x] Dua thong diep mua tu tin: co policy doi level/chuyen khoa sau mua.
- [x] `/courses/[slug]` hien claim trial 7 bai nhat quan voi API.

# Phase 3 - Tracking + Dashboard SoT + QA
- [x] Gan tracking o cac diem bat buoc: detail view, checkout start, purchase success, level change request.
- [x] Luu SQL audit logs song song GA4 cho cac event funnel chinh.
- [x] Tao truy van/bao cao dashboard doi chieu GA4 vs SQL theo ngay, course_slug, level.
- [ ] QA E2E 3 KPI va bao cao mismatch (neu co) truoc rollout 100%.

# File du kien sua (cu the)
- `src/app/(main)/courses/page.tsx`
- `src/components/courses/course-card.tsx`
- `src/app/(main)/courses/[slug]/page.tsx`
- `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx`
- `src/components/courses/course-lessons-player.tsx`
- `src/components/courses/course-storefront-tracking.tsx`
- `src/lib/analytics/track-event.ts`
- `src/components/courses/course-level-change-request-card.tsx`
- `src/modules/courses/pilot-funnel-tracking-service.ts`
- `src/modules/courses/course-level-change-request-service.ts`
- `src/modules/courses/course-level-change-request-constants.ts`
- `src/app/api/courses/[slug]/lessons/route.ts`
- `src/app/api/courses/level-change-requests/route.ts`
- `src/app/api/lessons/[lessonId]/video-token/route.ts`
- `src/app/api/lessons/[lessonId]/secure-playback/route.ts`
- `src/modules/platform/audit-service.ts`
- `src/app/api/admin/courses/level-change-requests/[requestId]/decision/route.ts`
- `src/app/api/admin/analytics/route.ts`
- `prisma/scripts/import-three-courses-bootstrap.ts`

# Rollout nhanh (thuc thi ngay)
- [ ] Day 1: Phase 0 (policy + measurement lock).
- [ ] Day 2: Phase 1 (API/data alignment).
- [ ] Day 3: Phase 2 (card simplification + detail claim alignment).
- [ ] Day 4: Phase 3 (tracking verify + dashboard + QA signoff).

# Definition of done
- [ ] Trial claim hien thi moi noi deu la 7 bai, backend tra dung 7 bai.
- [ ] 3 KPI co du lieu day du tren GA4 va SQL audit logs.
- [ ] Card `/courses` giam thong tin, tang ty le vao detail.
- [ ] Co report doi chieu GA4 vs SQL khong lech nghiem trong.

# Unresolved questions
- Tam hoan (2026-03-24): chua khoa duoc `GA4_PROPERTY_ID` production vi chua co property ID chinh thuc tu owner.
- Trang thai van hanh tam thoi: giu `GA4_SOT_REQUIRED=false` de khong chan deploy.
- Dieu kien mo lai: owner cung cap `GA4_PROPERTY_ID` dung production, sau do bat `GA4_SOT_REQUIRED=true`.
