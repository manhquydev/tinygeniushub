# Executive Handover - Course Split Decision Structure

Date: 2026-03-18
Owner: Docs Manager (Education Program)
Audience: Leadership / Approval Board
Status: Draft for decision review

## 1) Purpose
- Chốt lý do vì sao hệ thống đang chia khóa học theo 3 lớp: bundle thương mại, lộ trình học thuật, SKU pilot.
- Tạo format chuẩn để báo cáo nhanh: business intent + educational intent + risk + decision asks.
- Tránh tranh luận cảm tính; mọi luận điểm phải map về dữ liệu repo hiện tại.

## 2) Current Split Snapshot (Source of Truth)

### 2.1 Catalog layer (for storefront and checkout)
- 3 bundle chính:
  - `abeka`
  - `little-fox-en`
  - `little-fox-cn`
- Giá niêm yết hiện tại theo bundle: `500,000 VND`, thời hạn `365 days`.
- Nguồn: `src/modules/courses/course-bundles.ts`.

### 2.2 Curriculum layer (for learning progression)
- `abeka`: 14 grades, 2,380 lessons, 20,195 videos.
- `littlefox`: 9 levels, 8,718 episodes.
- `littlefoxcn`: 5 levels, 1,983 episodes.
- Có phase decomposition (foundation/core/mastery) + weekly pacing assumptions.
- Nguồn: `docs/api/program-bootstrap/three-courses-program.json`, `docs/api/program-bootstrap/three-courses-program-summary.md`.

### 2.3 Pilot SKU layer (for go-to-market test)
- Pilot micro-course hiện có: 12 SKU (Abeka K4/K5/G1, LittleFox EN L1/L2, LittleFox CN L1).
- Nguồn: `src/modules/courses/pilot-sku-catalog.ts`.

## 3) Business Intent (Why this split makes business sense)
- Giảm ma sát mua hàng: phụ huynh chọn theo nhu cầu rõ (EN/CN/Academic), không bị ngợp bởi catalog thô.
- Tăng conversion theo tầng phễu: bundle lớn cho trust, SKU nhỏ cho thử nhanh.
- Dễ pricing/packaging: giữ 3 "product lines" ổn định, linh hoạt test micro-offer ở lớp SKU.
- Giảm rủi ro vận hành: storefront chỉ quản 3 nhóm chính; curriculum chi tiết nằm backend.

## 4) Educational Intent (Why this split is pedagogically sound)
- Học theo năng lực hiện tại: grade/level split giúp đặt đúng điểm bắt đầu.
- Học bền: phase `foundation -> core -> mastery` tạo tiến trình từ làm quen đến củng cố.
- Học đều theo tuần: pacing assumptions tránh dồn tải, hỗ trợ habit learning.
- Dễ theo dõi với phụ huynh: bundle nói ngôn ngữ nhu cầu, lộ trình giữ logic học thuật.

## 5) Justification Matrix (Business + Education + Evidence)

| Decision | Business intent | Educational intent | Evidence in repo | KPI to validate |
|---|---|---|---|---|
| Duy trì 3 bundle gốc | Giữ storefront đơn giản, dễ bán | Nhóm mục tiêu học rõ ràng | `src/modules/courses/course-bundles.ts` | Catalog CTR, Checkout start rate |
| Dữ liệu học tách grade/level | Scale nội dung mà không vỡ UX | Placement chính xác, tránh lệch trình | `docs/api/program-bootstrap/three-courses-program.json` | Lesson completion rate, Week-4 retention |
| Giữ phase foundation/core/mastery | Dễ đóng gói thành offer theo giai đoạn | Đảm bảo học từ nền tới thành thạo | `three-courses-program.json` | Progression rate phase-to-phase |
| Pilot micro-SKU 12 gói | Test willingness-to-pay nhanh, CAC thấp hơn | Time-to-value ngắn, phụ huynh thấy tiến bộ sớm | `src/modules/courses/pilot-sku-catalog.ts` | Tripwire->Core CVR, Refund rate |
| Tách catalog view và canonical split | Tránh technical slug lộ ra UI | Phụ huynh nhìn outcome, backend giữ chuẩn dữ liệu | `src/modules/courses/course-bundle-service.ts`, `src/modules/courses/course-storefront-content.ts` | Detail page dwell time, Purchase CVR |

## 6) Risk Register

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| SKU proliferation quá nhanh | Vận hành phức tạp, khó QA | Medium | Giới hạn wave rollout theo gate KPI | Product + Learning Ops |
| Thông điệp marketing lệch learning path | Kỳ vọng sai, churn sớm | Medium | Copy governance: promise phải map phase/scope thật | Marketing + Curriculum |
| Parent không hiểu khác biệt bundle vs SKU | Drop ở detail/checkout | High | Chuẩn hóa card: "cho ai, bao lâu, đo gì" | Growth + UX |
| Split logic không đồng bộ catalog/data | Sai báo cáo, sai entitlement | Low-Med | Sync checks trước release + audit định kỳ | Engineering |
| Thiếu bằng chứng outcome thực nghiệm | Khó scale ngân sách | Medium | Áp KPI theo cohort + A/B message | Data + Product |

## 7) Decision Requests (for leadership approval)

### Decision Request A - Catalog governance
- Approve giữ nguyên 3 bundle gốc làm "stable commercial frame" đến hết pilot wave.
- Guardrail: không thêm bundle mới trước khi đủ dữ liệu 2 chu kỳ cohort.

### Decision Request B - Pilot scale policy
- Approve scale từ 12 SKU lên wave-2 chỉ khi đạt đồng thời:
  - Completion >= 55%
  - Tripwire -> Core CVR >= 18%
  - CAC payback <= 2.5 months

### Decision Request C - Messaging policy
- Approve nguyên tắc: frontend dùng outcome-language; backend giữ technical slug và canonical mapping.
- Cấm đổi tên public nếu chưa có tracking mapping update.

### Decision Request D - Evidence cadence
- Approve nhịp review 2 tuần/lần với bảng điều khiển chung: conversion, retention, learning outcomes.

## 8) Recommended Executive Narrative (1-page talk track)
- "Chúng ta không chia khóa để bán nhiều SKU hơn; chúng ta chia để phụ huynh chọn đúng điểm bắt đầu, thấy tiến bộ sớm, và mở rộng lộ trình an toàn."
- "Lớp bundle giữ đơn giản cho quyết định mua; lớp curriculum giữ đúng logic học tập; lớp SKU dùng để thử nhanh và tối ưu unit economics."
- "Mọi bước scale gắn gate KPI; không scale theo cảm giác."

## 9) Appendix: Evidence Links
- `src/modules/courses/course-bundles.ts`
- `src/modules/courses/course-bundle-service.ts`
- `src/modules/courses/course-storefront-content.ts`
- `src/modules/courses/pilot-sku-catalog.ts`
- `docs/api/program-bootstrap/three-courses-program-summary.md`
- `docs/api/program-bootstrap/three-courses-program.json`
- `plans/2026-03-17-education-agent-team/reports/three-course-decomposition-and-product-matrix.md`
- `plans/2026-03-17-education-agent-team/reports/learning-science-and-market-evidence.md`

## Unresolved questions
- Có cần tách riêng bundle "preschool" và "primary" ở mặt storefront, hay giữ 3 line hiện tại đến hết Q2/2026?
- Ngưỡng KPI scale có cần khác nhau theo từng line (Abeka vs LFEN vs LFCN) thay vì 1 bộ ngưỡng chung?
- Ownership cuối cùng cho governance copy (Product hay Marketing) sẽ chốt ở cấp nào?
