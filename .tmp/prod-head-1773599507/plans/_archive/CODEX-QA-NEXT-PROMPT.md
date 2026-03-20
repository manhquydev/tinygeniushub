# CODEX PROMPT — Sprint QA-NEXT-01: Refactoring, E2E Testing & Performance
**Date:** 2026-02-24
**Role:** Senior Developer & Automation QA
**Scope:** Tái cấu trúc file monolithic, thiết lập End-to-End Test, Tối ưu hóa hiệu năng.

---

## 🎯 Mục Tiêu Sprint

Sau khi vượt qua đợt QA chức năng và UI/UK toàn diện (Sprint QA-FIX-01), dự án Cùng Con Tự Học hiện đã đạt chuẩn **độ ổn định (stability)**. 
Sprint này tập trung vào **khả năng bảo trì (maintainability)**, **độ tin cậy tự động (automated reliability)**, và **hiệu năng (performance)** để chuẩn bị cho launch chính thức.

---

## 🏗️ TASK 1: Architectural Refactoring (Tái Cấu Trúc Admin Sub-services)

**Bối cảnh:** Báo cáo QA ghi nhận `src/modules/admin/service.ts` quá lớn (1551 dòng). File này đang gánh quá nhiều domain (users, blog, payments, analytics, v.v.).

**Yêu Cầu:**
1. Đọc và phân tích `src/modules/admin/service.ts`.
2. Tạo các sub-services chuyên biệt trong thư mục `src/modules/admin/`:
   - `admin-user-service.ts` (Quản lý Parent/Child/Caregiver)
   - `admin-blog-service.ts` (Quản lý bài viết blog)
   - `admin-billing-service.ts` (Quản lý Revenue, Subscriptions)
   - `admin-analytics-service.ts` (Thống kê, Reports mở rộng)
3. Di chuyển các hàm logic từ service cũ sang các sub-services mới.
4. Export lại từ một file index hoặc giữ `service.ts` như một Facade pattern gom các sub-services lại (để không phá vỡ import hiện tại của các file API/UI).
5. Đảm bảo chạy `pnpm type-check` pass 100% không vỡ kiểu dữ liệu.

---

## 🤖 TASK 2: E2E Testing với Playwright (Happy Paths)

**Bối cảnh:** Hiện tại chúng ta chỉ đang dựa vào manual QA và unit tests rải rác. Cần có E2E regression suite cho các luồng core của người dùng.

**Yêu Cầu:**
1. Cài đặt Playwright nếu chưa có: `pnpm create playwright` (chú ý cấu hình `playwright.config.ts` trỏ vào `baseURL: 'http://localhost:3000'`).
2. Tạo thư mục `tests/e2e/` ở root.
3. Viết 3 bộ test quan trọng nhất (Happy Paths):
   - **`guest-navigation.spec.ts`**: Truy cập Homepage → click Pricing → click Blog → vào một bài blog → Verify không bị crash/404, tiêu đề page đúng.
   - **`auth-flow.spec.ts`**: Mock request đăng nhập (hoặc dùng API route) → Xác nhận user vào được `/parent/dashboard` → Đăng xuất thành công.
   - **`contact-form.spec.ts`**: Bắt (mock) API endpoint `/api/contact` → Điền form hợp lệ ở trang `/contact` → Submit → Validate UI hiện thông báo thành công.

*Lưu ý:* Không chạy test chạm vào production DB. Khuyến khích dùng Playwright API mocking (`page.route()`) cho các endpoint gửi email/database khi test luồng UI.

---

## ⚡ TASK 3: Performance Audit (Core Web Vitals) & Optimization

**Bối cảnh:** Cần đảm bảo các trang landing pages (`/`, `/pricing`, `/blog`) tải siêu tốc trên thiết bị di động (LCP < 2.5s).

**Yêu Cầu:**
1. Chạy Lighthouse CI hoặc audit tool cho Home và Blog.
2. Kiểm tra lại việc sử dụng hình ảnh: 
   - Đảm bảo tất cả mascot và illustrations đang dùng định dạng tối ưu (`.webp` hoặc `.svg`).
   - Có component `next/image` nào đang thiếu thuộc tính `priority` trên màn hình above-the-fold (chẳng hạn như banner Hero) không? Thêm `priority={true}` nếu thiếu.
   - Có hình ảnh nào đang có kích thước origin quá lớn không?
3. Review Bundle Size: Chạy lệnh build phân tích (`ANALYZE=true pnpm build` nếu có plugin cắm sẵn, hoặc tự soi dung lượng static chunk). Xác định module nào đang kéo theo thư viện quá lớn xuống client side để gỡ bỏ/chuyển sang Server Component.

---

## 📋 Definition of Done (DoD)

1. **Khởi chạy thành công ứng dụng** mà không bị lỗi 500 tại bất kỳ route Admin nào sau khi tách file 1551 dòng.
2. **Playwright Suite** (`pnpm exec playwright test`) chạy xanh (pass) 100% cho 3 file `.spec.ts` đã viết.
3. **Báo cáo Perf:** Cập nhật ngắn vào cuối `plans/QA-REPORT.md` (mục Bonus) 3 gạch đầu dòng báo cáo dung lượng LCP trước và sau khi thêm thuộc tính tối ưu `next/image` và module bundle.

> ⛔ Quan trọng: Báo cáo lại mọi thay đổi cấu trúc khi chia nhỏ admin service. Đảm bảo dev/build runtime không gặp lỗi hydration hay TS errors.
