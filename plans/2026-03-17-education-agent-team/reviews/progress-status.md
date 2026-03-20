# Progress Status - Education Agent Team

Date: 2026-03-17
Active plan: `plans/2026-03-17-education-agent-team`

## Overall progress
- Phase 1 Evidence lock: DONE
- Phase 2 Course decomposition: DONE (pilot SKU list locked)
- Phase 3 Monetization design: DONE (funnel + KPI thresholds)
- Phase 4 Ops planning: DONE (capacity + stop/go)
- Data integrity layer: DONE (automation + reports + DB sync)

Estimated completion: 100% (pilot data package ready for execution sprint)

## Completed today
1. Added split integrity verifier script.
2. Generated full + pilot integrity reports.
3. Added Gate G0 (mandatory) into approval board.
4. Added `pnpm education:*` scripts for repeatable checks.
5. Generated pilot SKU manifest from integrity-verified ranges.
6. Added data-integrity runbook for repeatable board review.
7. Added idempotent pilot SKU import script into DB.
8. Upgraded DB integrity verifier to compare exact lesson payload (no thiếu/thừa/sai thứ tự).
9. Ran full pipeline `pnpm education:pipeline` and passed.
10. Implemented pilot funnel tracking on server flow (checkout start, purchase success, lesson complete).
11. Added pilot funnel report generator and produced first snapshot report.
12. Added attribution cookie + channel tagging (utm/source/referrer) for acquisition analysis.
13. Added KPI thresholds and weekly gate evaluator script (PASS/WARN/FAIL).
14. Added weekly board dashboard generator with explicit decision/actions.
15. Added generic course A/B CVR reporting from checkout/purchase audit logs.
16. Extended weekly gate evaluator to score `SKU x channel` thresholds.
17. Completed Run 02 parent-friendly repackage strategy (agent-team output).
18. Added pilot public naming map (12 SKU) with 1-1 integrity mapping.
19. Applied pilot public naming map to DB (12/12 SKU updated, PASS).
20. Locked legacy bundle routes to prevent returning to old bundle presentation model.
21. Completed full API sync audit (payment x admin x storefront) with endpoint map and runtime DB checks.
22. Hardened PayOS webhook integrity (no status downgrade from SUCCEEDED + amount mismatch guard).
23. Enabled admin course cover updates with both absolute URL and local `/images/...` paths.
24. Updated LittleFox bundle slug mapping (`lfen-*`, `lfcn-*`) and storefront sync checks (PASS).
25. Added endpoint `POST /api/admin/payments/[id]/reconcile` for manual payment/webhook reconciliation in exception ops.
26. Added admin payments UI actions to trigger manual reconcile directly from operations table.

## Current blockers
- Chưa có dữ liệu conversion/retention thực tế (chỉ mới baseline từ content source).
- Chưa đủ mẫu traffic để kết luận winner cho A/B message theo outcome.

## Next execution steps (immediate)
1. Run first 2-week pilot and collect weekly dashboard.
2. Run `pnpm education:weekly-pack` every week and review board decision.
3. Chốt override threshold cho từng `SKU x channel` khi có dữ liệu tuần 1.
4. Quyết định scale/rework theo bảng `SKU x channel gates` trong board tuần.
5. Theo dõi tác động của naming mới lên CTR catalog -> detail và checkout start rate.
6. Theo dõi log vận hành 3-5 ngày đầu sau khi bật manual reconcile UI để chuẩn hóa runbook thao tác.

## Data integrity status
- Full split: PASS (28/28 scope)
- Pilot split: PASS (6/6 scope)
- No overlap / no out-of-range / no invalid range detected.
- Pilot import to DB: PASS (12/12 SKU, no post-write mismatch).
- Pilot DB integrity: PASS (12/12 SKU, issues=0).

## Funnel tracking status
- Event taxonomy locked:
  - `pilot_checkout_started`
  - `pilot_purchase_succeeded`
  - `pilot_lesson_completed`
- Attribution tagging locked:
  - `attributionChannel`, `utm_source`, `utm_medium`, `utm_campaign`, `referrerHost`
- First report generated:
  - `reports/pilot-funnel-report.json`
  - `reports/pilot-funnel-report.md`
- Gate evaluation generated:
  - `reviews/pilot-kpi-thresholds.json`
  - `reports/pilot-funnel-gate-evaluation.json`
- Weekly board dashboard generated:
  - `reports/weekly-board-dashboard.json`
  - `reviews/weekly-board-dashboard.md`
