# Plan: Education Agent Team for Course Productization

Plan directory: `plans/2026-03-17-education-agent-team`
Created: 2026-03-17

## Goal
Thiết lập agent team chuyên giáo dục để:
1. Nghiên cứu có dẫn chứng khoa học.
2. Tách 3 khóa lớn (`abeka`, `littlefox`, `littlefoxcn`) thành sản phẩm nhỏ.
3. Lập kế hoạch phân bổ tài nguyên và chiến lược marketing sinh lời.

## Agent lineup
1. `education_researcher`
2. `curriculum_product_architect`
3. `education_growth_marketer`
4. `learning_ops_analyst`

Workflow file:
- `.codex/workflows/education-course-productization.md`

## Execution phases

### Phase 1 - Evidence lock
Owner: `education_researcher`
- Tổng hợp bằng chứng học thuật/chính sách giáo dục hiện đại.
- Chốt danh sách phương pháp nên giữ (truyền thống) và nên thêm (hiện đại).
- Output: `reports/learning-science-and-market-evidence.md`

### Phase 2 - Course decomposition
Owner: `curriculum_product_architect`
- Đọc quy mô nội dung và nhịp học thực tế từ bootstrap.
- Đề xuất micro-course theo outcome + thời lượng.
- Output: `reports/three-course-decomposition-and-product-matrix.md`

### Phase 3 - Monetization design
Owner: `education_growth_marketer`
- Gói bán theo funnel và theo mục tiêu phụ huynh.
- Đặt KPI thương mại và ngưỡng scale.
- Output: gộp trong decomposition report (mục funnel/KPI).

### Phase 4 - Ops and resource planning
Owner: `learning_ops_analyst`
- Chốt pilot 90 ngày, thứ tự sản xuất, tiêu chí pass/fail.
- Định nghĩa dashboard theo dõi.

## Delivery checklist
- [x] Agent files tạo mới trong `.codex/agents/`
- [x] Workflow agent team tạo mới trong `.codex/workflows/`
- [x] Báo cáo bằng chứng khoa học
- [x] Báo cáo tách khóa + chiến lược sản phẩm
- [x] Run 01: xuất báo cáo riêng cho 4 agent workstream
- [x] Run 01: chấm điểm gate và quyết định duyệt pilot
- [x] Import 12 pilot SKU vào DB + verify toàn vẹn dữ liệu
- [x] Cắm tracking funnel cho 12 pilot SKU (checkout/purchase/lesson)
- [x] Định nghĩa ngưỡng KPI funnel và script chấm gate tuần
- [x] Tạo weekly board dashboard tự động (decision + actions)
- [ ] Chạy pilot thực tế trên production data
- [ ] A/B test thông điệp marketing theo outcome

## Run 01 artifacts
- `reports/learning-science-and-market-evidence.md`
- `reports/three-course-decomposition-and-product-matrix.md`
- `reports/course-baseline-metrics.json`
- `reports/split-integrity-full.json`
- `reports/split-integrity-pilot.json`
- `reports/split-integrity-summary.md`
- `reports/pilot-sku-manifest.json`
- `reports/data-integrity-runbook.md`
- `reports/pilot-funnel-tracking-spec.md`
- `reports/pilot-funnel-report.json`
- `reports/pilot-funnel-report.md`
- `reviews/pilot-kpi-thresholds.json`
- `reports/pilot-funnel-gate-evaluation.json`
- `reports/weekly-board-dashboard.json`
- `reviews/weekly-board-dashboard.md`
- `reviews/api-sync-audit-2026-03-17.md`
- `reports/run-02-parent-friendly-repackage.md`
- `reports/pilot-public-naming-map.json`
- `reports/pilot-public-naming-apply-result.json`
- `reports/pilot-public-naming-apply-result.md`
- `workstreams/01-education-researcher-output.md`
- `workstreams/02-curriculum-product-architect-output.md`
- `workstreams/03-education-growth-marketer-output.md`
- `workstreams/04-learning-ops-analyst-output.md`
- `reviews/approval-gates-and-scoring.md`
- `reviews/review-board-run-01.md`
- `reviews/approval-checklist.md`

## Integrity automation
- Baseline generator:
  - `node scripts/education/generate-education-baseline.mjs`
- Split integrity verifier:
  - `node scripts/education/verify-split-integrity.mjs`
- Pilot SKU manifest generator:
  - `node scripts/education/generate-pilot-sku-manifest.mjs`
- Pilot SKU importer (idempotent):
  - `node scripts/education/import-pilot-courses.mjs --strict`
- Pilot DB integrity verifier (sau khi import SKU vào DB):
  - `node scripts/education/verify-db-pilot-courses.mjs --strict`
- One-shot pipeline:
  - `pnpm education:pipeline`
- Funnel report:
  - `node scripts/education/generate-pilot-funnel-report.mjs --days=14`
- Funnel gate evaluation:
  - `node scripts/education/evaluate-pilot-funnel-gates.mjs`
- Weekly board dashboard:
  - `node scripts/education/generate-weekly-board-dashboard.mjs`
  - `pnpm education:weekly-pack`

## Suggested next implementation sprint (2 tuần)
1. Chuẩn hóa template micro-course (metadata + checkpoint).
2. Sinh 12 SKU pilot từ dữ liệu 3 khóa hiện tại.
3. Cắm tracking conversion + completion + retention.
4. Mở chiến dịch thử nghiệm cho 2 phân khúc phụ huynh.
