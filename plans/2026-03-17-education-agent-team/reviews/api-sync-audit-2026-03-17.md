# API Sync Audit - Payment x Admin x Course Storefront

Date: 2026-03-17
Scope: checkout/payos webhook/admin course APIs/storefront data presentation.

## 1) Endpoint map đã rà soát

### Payment flow
- `POST /api/courses/[slug]/checkout`
- `POST /api/billing/webhooks/payos`
- `GET /api/courses/checkout/return`
- `GET /api/courses/checkout/status`
- `GET /api/courses/checkout/mock-success`

### Admin can thiệp dữ liệu khóa
- `GET/POST /api/admin/courses`
- `GET/PATCH/DELETE /api/admin/courses/[id]`
- `POST /api/admin/courses/[id]/publish`
- `GET/POST/PATCH/DELETE /api/admin/courses/[id]/lessons`
- `GET /api/admin/courses/[id]/enrollments`

### Admin quan sát thanh toán/webhook
- `GET /api/admin/payments`
- `GET /api/admin/webhooks`
- `GET /api/admin/export/payments`

### Admin manual reconcile mới triển khai
- `POST /api/admin/payments/[id]/reconcile`
  - Action hỗ trợ:
    - `MARK_SUCCEEDED_AND_SYNC`
    - `SYNC_ENROLLMENTS`
    - `MARK_FAILED`
    - `MARK_PENDING`
  - Optional webhook resolution:
    - `webhookEventId` + `webhookResolution` (`PROCESSED` | `IGNORED`)
  - Bảo vệ:
    - `assertTrustedOrigin`
    - `enforceAdminMutationRateLimit`
    - role gate: `SUPER_ADMIN` hoặc `SUPPORT_AGENT`
  - Log:
    - ghi `adminActionLog` với action `payment_manual_reconcile`
    - ghi `manualReconcileHistory` vào `paymentRecord.rawPayload`

### Admin UI đã nối trực tiếp endpoint reconcile
- Màn `Admin Operations` (bảng Payment) có nút `Manual reconcile` theo từng payment row.
- Hỗ trợ chọn action, note, webhook resolution và webhook event liên quan trước khi submit.
- Sau khi submit: cập nhật lại danh sách payment + webhook ngay trên UI.

## 2) Kết quả kiểm tra đồng bộ dữ liệu thật

DB audit runtime (2026-03-17):
- `paymentsChecked`: 21
- `succeeded`: 4
- `pending`: 14
- `failed`: 3
- `stalePending24h`: 0
- `mismatchEnrollments`: 0
- `missingTarget`: 0

Đánh giá: hiện tại không thấy lệch đồng bộ kiểu “payment thành công nhưng không mở khóa”.

## 3) Các điểm đã fix trong đợt này

### 3.1 Harden webhook PayOS để bảo toàn dữ liệu thanh toán
File: `src/modules/courses/course-payment-webhook-service.ts`
- Chặn downgrade trạng thái: nếu payment đã `SUCCEEDED`, webhook đến sau sẽ không ghi đè ngược.
- Chặn mở khóa khi webhook amount lệch amount checkout gốc (`Webhook amount mismatch`).
- Không còn ghi đè `paymentRecord.amountVnd` theo payload webhook.

Tác động: giảm rủi ro sai lệch đối soát và sai trạng thái thanh toán.

### 3.2 Admin sửa ảnh bìa linh hoạt hơn
Files:
- `src/app/api/admin/courses/route.ts`
- `src/app/api/admin/courses/[id]/route.ts`
- `src/app/(main)/admin/courses/admin-courses-client.tsx`

Cập nhật:
- `coverImageUrl` chấp nhận cả URL đầy đủ và đường dẫn nội bộ dạng `/images/...`.
- Form admin bổ sung hướng dẫn + preview ảnh bìa.

Tác động: admin có thể cập nhật cover thực tế theo asset local/public, không bị khóa ở URL tuyệt đối.

### 3.3 Cải thiện mapping hiển thị khóa mới
Files:
- `src/modules/courses/course-bundles.ts`
- `scripts/education/check-course-storefront-sync.ts`

Cập nhật:
- Bundle LittleFox nhận diện thêm slug mới `lfen-*`, `lfcn-*`.
- Sync script chuyển sang chế độ tương thích chuyển tiếp (prefix cũ + mới).

Kết quả:
- `pnpm education:storefront-sync` => `PASS` (2026-03-17).

## 4) Rủi ro còn lại / đề xuất bước tiếp

1. Admin hiện **chưa có endpoint mutate** để “reconcile thủ công” payment/webhook (mới có read/export).
2. Admin hiện **chưa có endpoint upload ảnh khóa chuyên biệt** (đang edit bằng URL/path).
3. Có thể bổ sung test riêng cho `processPayosCourseWebhook` (case amount mismatch + duplicate event + downgrade prevention).

## 5) Validation đã chạy
- `pnpm type-check` => PASS
- `pnpm check:i18n` => PASS
- `pnpm education:storefront-sync` => PASS
- `verify-vietnamese-utf8.ps1` => PASS
