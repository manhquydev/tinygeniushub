# Audit Alignment: Course-Purchase Model
Date: 2026-04-10

## P0 (fix ngay - parent journey chính)
- src/app/(main)/parent/dashboard/page.tsx
  - Đang hiển thị trạng thái gói/Trialing và mascot ecosystem block không còn phù hợp.
  - Đã xử lý trong patch hiện tại.
- src/app/(main)/parent/children/page.tsx
  - Đang phụ thuộc subscription child/caregiver limit.
  - Đã xử lý: child profile limit cố định 1.
- src/components/children-manager.tsx
  - Copy/UI còn thông điệp nâng cấp gói Family+.
  - Đã xử lý: chuyển sang thông điệp 1 hồ sơ xuyên suốt.
- src/app/(main)/parent/billing/page.tsx
  - Khối thông tin gói/plan/auto-renew không phù hợp mô hình mua khóa.
  - Đã xử lý: chuyển sang thông tin thanh toán theo giao dịch khóa học.
- src/modules/progress/children-service.ts
  - Backend create child phụ thuộc subscription, có thể sai với mô hình mới.
  - Đã xử lý: enforce 1 profile / parent, bỏ dependency subscription ở tạo hồ sơ.

## P1 (nên xử lý kế tiếp - copy/UX public)
- src/components/app-nav-client.tsx
  - Label "Gói dịch vụ", CTA "Xem gói học".
  - Đã xử lý: đổi thành "Thanh toán", "Xem khóa học".
- src/app/(main)/terms/page.tsx
  - Nội dung còn nhắc "gói dịch vụ trả phí".
- src/app/(main)/refund-policy/page.tsx
  - Nội dung "mua gói/khóa học" cần chuẩn hóa thống nhất theo mua khóa.
- src/app/(main)/gift-code/page.tsx
  - Mô tả còn nhắc "khóa học hoặc gói dịch vụ".
- src/components/homepage/section-testimonials.tsx
  - Nội dung testimonial còn nhắc Family+ theo mô hình cũ.

## P2 (admin/analytics - vẫn chạy được nhưng lệch business language)
- src/app/(main)/admin/overview/page.tsx
  - Section "Trạng thái gói đăng ký".
- src/modules/admin/admin-overview-service.ts
  - subscriptionsByStatus làm trọng tâm overview.
- src/modules/admin/admin-revenue-service.ts
  - MRR/ARR theo plan code cũ.
- src/components/admin/analytics/revenue-dashboard.tsx
  - Copy "Doanh thu theo gói".
- src/modules/admin/admin-funnel-service.ts
  - Funnel còn stage trial/subscription_activated.

## Unresolved questions
- Có giữ khái niệm caregiver limit cố định (2) hay chuyển sang không giới hạn theo mô hình mới?
- Với admin analytics, có muốn pivot hoàn toàn sang KPI theo khóa học (course orders, conversion theo course) thay vì subscription KPI?