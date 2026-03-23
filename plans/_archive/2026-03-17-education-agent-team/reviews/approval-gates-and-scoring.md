# Approval Gates and Scoring

Date: 2026-03-17

## Gate G0 (Bắt buộc): Data integrity
- Không tính điểm, nhưng bắt buộc PASS trước khi vào chấm điểm các gate còn lại.
- Điều kiện PASS:
1. Full split integrity PASS toàn bộ scope (không gap/overlap/out-of-range).
2. Pilot split integrity PASS toàn bộ scope (không overlap/out-of-range/invalid range).
3. Pilot import + DB integrity PASS (đúng lesson payload, không thiếu/thừa/sai thứ tự).
4. Có artifact kiểm định:
   - `reports/split-integrity-full.json`
   - `reports/split-integrity-pilot.json`
   - `reports/split-integrity-summary.md`
   - `reports/pilot-import-result.json`
   - `reports/pilot-db-integrity.json`

## Tổng điểm: 100
- Gate G1: Pedagogy integrity (30 điểm)
- Gate G2: Product decomposition quality (25 điểm)
- Gate G3: Commercial viability (25 điểm)
- Gate G4: Operational readiness (20 điểm)

## Gate G1 - Pedagogy integrity (30)
Checklist:
1. SKU có objective đo được (5)
2. Có retrieval checkpoint/lesson (10)
3. Có spacing schedule/module (10)
4. Không dùng learning-styles personalization làm core (5)
Pass: >= 24/30

## Gate G2 - Product decomposition quality (25)
Checklist:
1. Mapping rõ từ source content -> SKU (10)
2. Syllabus tuần + mastery check (10)
3. Độ phủ pilot hợp lý (5)
Pass: >= 20/25

## Gate G3 - Commercial viability (25)
Checklist:
1. Funnel 5 tầng rõ (5)
2. KPI conversion có ngưỡng pass/fail (10)
3. Pricing ladder không chồng chéo (5)
4. Messaging gắn learning outcome (5)
Pass: >= 18/25

## Gate G4 - Operational readiness (20)
Checklist:
1. Capacity plan theo sprint (5)
2. QA checklist và stop/go rule (5)
3. Dashboard KPI cadence tuần (5)
4. Owner rõ cho từng deliverable (5)
Pass: >= 16/20

## Quy tắc duyệt cuối
- APPROVE khi:
  - Gate G0 = PASS
  - Tổng điểm >= 80/100
  - Không gate nào dưới ngưỡng pass
- CONDITIONAL APPROVE khi:
  - Gate G0 = PASS
  - Tổng điểm >= 75 và chỉ 1 gate dưới ngưỡng tối đa 2 điểm
- REJECT khi:
  - Gate G0 = FAIL
  - hoặc
  - Tổng điểm < 75 hoặc có từ 2 gate fail

## Mandatory evidence pack để trình duyệt
1. `reports/learning-science-and-market-evidence.md`
2. `reports/three-course-decomposition-and-product-matrix.md`
3. `reports/course-baseline-metrics.json`
4. `reports/split-integrity-full.json`
5. `reports/split-integrity-pilot.json`
6. `reports/split-integrity-summary.md`
7. `reports/pilot-sku-manifest.json`
8. `reports/data-integrity-runbook.md`
9. `reports/pilot-import-result.json`
10. `reports/pilot-db-integrity.json`
11. `workstreams/*.md` (4 file)
12. `reviews/review-board-run-01.md`
13. `reports/pilot-funnel-tracking-spec.md`
14. `reports/pilot-funnel-report.md`
15. `reviews/pilot-kpi-thresholds.json`
16. `reports/pilot-funnel-gate-evaluation.json`
17. `reports/weekly-board-dashboard.json`
18. `reviews/weekly-board-dashboard.md`
