# Route Map - Cùng Con Tự Học

## Auth Routes
- `/auth/login` - Đăng nhập
- `/auth/signup` - Đăng ký
- `/auth/forgot-password` - Quên mật khẩu
- `/auth/reset-password` - Đặt lại mật khẩu

> Lưu ý: dự án dùng `/auth/signup`, không dùng `/auth/register`.

## Public Pages
- `/` - Trang chủ
- `/pricing` - Bảng giá
- `/about` - Giới thiệu
- `/blog` - Danh sách bài viết
- `/blog/[slug]` - Chi tiết bài viết
- `/contact` - Liên hệ
- `/privacy` - Chính sách bảo mật
- `/terms` - Điều khoản sử dụng
- `/refund-policy` - Chính sách hoàn tiền
- `/referral` - Giới thiệu bạn bè

## Parent/Admin Pages
- `/parent/*` - Khu vực phụ huynh (yêu cầu đăng nhập)
- `/admin/*` - Khu vực quản trị (yêu cầu quyền admin)
- `/setup` - Thiết lập phụ huynh sau đăng nhập

## API Routes
- `/api/health` - Health check
- `/api/blog/posts` - Public blog API
- `/api/contact` - Gửi biểu mẫu liên hệ
- `/api/billing/checkout` - Billing checkout
- `/api/admin/*` - Admin API
- `/api/reports/weekly` - Báo cáo tuần (protected)
- `/api/children` - Child profiles (protected)

> Lưu ý: dự án dùng `/api/billing/checkout`, không dùng `/api/billing`.
