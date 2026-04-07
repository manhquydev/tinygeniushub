# WS3: Content and Commerce Quality

## Owner
- Product content + Backend/API + Frontend

## Scope
- Chuẩn hóa mô tả khóa học/package/video theo ngưỡng chất lượng.
- Giữ 18 course giá `0đ` là **free tạm thời**.
- Đồng bộ cách hiển thị commerce ở `/courses` và course detail.

## Thresholds (Locked)
1. Course description: `>= 80` ký tự.
2. Package description (`CurriculumPackage.description`): `>= 60` ký tự.
3. Video description (`AbekaVideo.description`): `>= 20` ký tự.

## Commerce Policy (Locked)
- `salePriceVnd = 0` => trạng thái `freeTemporary`.
- Admin vẫn được publish khóa `0đ` (không chặn chỉ vì `isPurchasable=false`).
- Chỉ chặn publish khi sale window invalid hoặc description chưa đạt ngưỡng.
- Checkout online giữ tắt với amount `<= 0` để không tạo payment gateway transaction sai.

## UI/Storefront Rules
- Card `/courses` phải đồng đều chiều cao (không lệch theo độ dài mô tả).
- Card phải hiển thị đúng các field đã chốt: track label, lesson count, duration, giá/miễn phí.
- Với khóa `0đ`, hiển thị rõ `Miễn phí` / `0đ (miễn phí tạm thời)`, không dùng copy “Giá đang cập nhật”.

## Production Audit Snapshot (2026-04-05)
- `Course` total: `18`
- `Course` giá `0đ`: `18`
- `Course` đang publish: `12`
- Published course desc đạt `>=80`: `12/12`
- Active package desc đạt `>=60`: `8/8`
- Video desc đạt `>=20`: `20195/20195`
- Production gate check: `PASS=12 WARN=0 FAIL=0`
- UI signal check:
  - `/courses` render có nhãn `Miễn phí`.
  - course detail hiển thị `0đ (miễn phí tạm thời)`.

## Deliverables
- [x] Pricing status mở rộng với `freeTemporary`.
- [x] Admin publish gate cập nhật theo policy mới.
- [x] `/courses` card layout chuẩn hóa đồng đều.
- [x] Report quality content/commerce trên production.
- [x] Backfill mô tả course chưa đạt ngưỡng trên production.

## Success Criteria
- Không mơ hồ giữa “free tạm thời” và “khóa thương mại”.
- Card `/courses` không còn tình trạng thẻ dài ngắn lệch nhau.
- Publish flow ngăn dữ liệu mô tả kém chất lượng.
- Có số liệu kiểm chứng quality sau rollout.
