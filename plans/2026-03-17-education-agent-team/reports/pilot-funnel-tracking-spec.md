# Pilot Funnel Tracking Spec (12 SKU)

## Mục tiêu
Theo dõi funnel pilot theo từng SKU để board có dữ liệu duyệt rõ ràng:
1. `checkout_started`
2. `purchase_succeeded`
3. `lesson_completed`

## Taxonomy sự kiện

| Event | Action (audit_log) | Resource type | Trigger |
|---|---|---|---|
| Checkout start | `pilot_checkout_started` | `pilot_course` | Sau khi tạo checkout session thành công cho course pilot |
| Purchase success | `pilot_purchase_succeeded` | `pilot_course` | Khi webhook/checkout mock xác nhận mua thành công và upsert enrollment |
| Lesson completed | `pilot_lesson_completed` | `pilot_course` | Khi lesson hoàn tất và thuộc course pilot đã enroll |

Metadata chuẩn:
- `sku`, `courseSlug`, `courseCode`, `unitType`, `unitValue`
- checkout: `provider`, `amountVnd`, `sessionId`
- purchase: `provider`, `amountVnd`, `paymentRecordId`, `source`
- lesson complete: `childId`, `lessonId`, `completionId`
- attribution: `attributionChannel`, `attributionUtmSource`, `attributionUtmMedium`, `attributionUtmCampaign`, `attributionReferrerHost`

## Nguồn dữ liệu báo cáo
- `audit_log`: checkout/purchase/lesson events.
- `course_enrollment`: số enrollments theo SKU.
- Catalog cố định 12 SKU pilot.

## Báo cáo vận hành
Lệnh chuẩn:
```bash
pnpm education:funnel-report
```

Weekly pack chuẩn cho board:
```bash
pnpm education:weekly-pack
```

Artifacts:
- `reports/pilot-funnel-report.json`
- `reports/pilot-funnel-report.md`
- `reviews/pilot-kpi-thresholds.json`
- `reports/pilot-funnel-gate-evaluation.json`
- `reports/weekly-board-dashboard.json`
- `reviews/weekly-board-dashboard.md`

Báo cáo bắt buộc có:
1. Funnel tổng theo SKU.
2. Funnel theo `SKU x channel` để so CVR kênh acquisition.
3. Gate đánh giá tuần theo ngưỡng KPI (`PASS/WARN/FAIL`).

Lệnh chấm gate:
```bash
pnpm education:funnel-gates
```

## Quy tắc kiểm tra dữ liệu
1. Không có SKU thiếu trong report (`courses found = 12`).
2. `purchase_succeeded <= checkout_started` theo từng SKU.
3. `active_learners <= purchase_succeeded` theo từng SKU.
4. Nếu lệch quy tắc, gắn cờ review trước board tuần.

## Cadence duyệt board
- Daily: snapshot nhanh checkout/purchase.
- Weekly: full report theo SKU + quyết định scale/rework.
- Gate chốt sprint: report phải được sinh từ dữ liệu mới nhất (<=24h).
