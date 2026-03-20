# Workstream 04: Learning Ops Analyst Output

Date: 2026-03-17
Owner agent: `learning_ops_analyst`
Skills used: `planning`, `analytics`

## Objective
Đảm bảo pilot triển khai được bằng nguồn lực startup, có thang đo để duyệt.

## Capacity plan (90 ngày)
- Sprint 1-2: chuẩn hóa template + QA checklist + phát hành 4 SKU đầu.
- Sprint 3-4: phát hành thêm 4 SKU + đo conversion/completion.
- Sprint 5-6: phát hành 4 SKU còn lại + tối ưu theo dữ liệu thực.

## Operational KPIs
- Time-to-publish/SKU <= 5 ngày làm việc.
- QA issue rate < 3 lỗi nghiêm trọng/SKU.
- Content mapping coverage = 100% (không mồ côi lesson).
- Dashboard cập nhật hằng tuần.

## Stop/Go rules
- STOP nếu 2 sprint liên tiếp completion < 40%.
- GO scale nếu đạt đồng thời:
  - Tripwire -> Core >= 18%
  - Completion >= 55%
  - Payback <= 2.5 tháng

## Output artifacts
- `reviews/approval-gates-and-scoring.md`
- `reviews/review-board-run-01.md`
- `reports/split-integrity-full.json`
- `reports/split-integrity-pilot.json`
- `reports/split-integrity-summary.md`
