# Review Board - Run 01

Date: 2026-03-17
Scope: Pilot 12 SKU

## Gate G0 - Data integrity (BẮT BUỘC)
- Full split integrity: PASS (28/28 scope)
- Pilot split integrity: PASS (6/6 scope)
- Pilot coverage snapshot:
  - `abeka:grade:k4` -> 48/170 (28.24%)
  - `abeka:grade:k5` -> 48/170 (28.24%)
  - `abeka:grade:g1` -> 60/170 (35.29%)
  - `littlefox:level:1` -> 70/790 (8.86%)
  - `littlefox:level:2` -> 70/1238 (5.65%)
  - `littlefoxcn:level:1` -> 65/459 (14.16%)
- Integrity artifacts:
  - `reports/split-integrity-full.json`
  - `reports/split-integrity-pilot.json`
  - `reports/split-integrity-summary.md`
  - `reports/pilot-import-result.json`
  - `reports/pilot-db-integrity.json`
  - `reports/pilot-funnel-tracking-spec.md`
  - `reports/pilot-funnel-report.md`

## Gate scores
- G1 Pedagogy integrity: 27/30 (PASS)
- G2 Product decomposition: 22/25 (PASS)
- G3 Commercial viability: 20/25 (PASS)
- G4 Operational readiness: 18/20 (PASS)

Total: 87/100
Decision: APPROVE FOR PILOT

## Lý do pass
1. Có evidence base đủ mạnh cho phương pháp dạy-học cốt lõi.
2. Catalog pilot cụ thể, có mã SKU và phạm vi rõ.
3. KPI thương mại có ngưỡng định lượng để chốt mở rộng.
4. Đã có stop/go rule để giảm rủi ro vận hành.

## Điều kiện khi triển khai thật
1. Gắn tracking event trước khi mở bán pilot.
2. Báo cáo tuần bắt buộc (conversion, completion, retention, QA errors).
3. Trước mỗi vòng scale/rework phải chạy lại `pnpm education:verify-split`.
4. Sau 4 tuần phải họp board lại để quyết định scale/rework.
5. Đã chạy import + verify DB và PASS `pnpm education:verify-db-pilot` (issues=0).
6. Đã cắm tracking funnel cho 12 SKU pilot và sinh snapshot báo cáo đầu tiên.
7. Đã bổ sung attribution `channel/utm/referrer` để đọc CVR theo kênh acquisition.
8. Đã có bộ ngưỡng KPI + script chấm gate tuần từ funnel report (`PASS/WARN/FAIL`).
9. Đã có weekly board dashboard tự động với decision/actions rõ ràng.

## Reviewer slots
- Product owner: _pending_
- Curriculum lead: _pending_
- Growth lead: _pending_
- Ops lead: _pending_
