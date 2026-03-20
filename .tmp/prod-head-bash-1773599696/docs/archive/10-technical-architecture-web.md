# 10 — Technical Architecture (Website-first)

## 1) Kiến trúc module (khuyến nghị)
### Public Web
- Landing/SEO pages
- Roadmap pages
- Pricing/Checkout pages

### App (Authenticated)
- Parent dashboard
- Child profile manager (max 3; extendable to 5)
- Kid mode
- Content player (video + interactive)
- Reports/portfolio

### Admin/CMS
- Content management (tracks/levels/units/lessons/assets)
- Gating (trial_open flags)
- User & plan management
- Affiliate dashboard

---

## 2) Service boundaries (để dev dễ scale)
- Web frontend (Next.js/React hoặc tương đương)
- API (REST/GraphQL)
- Content storage (object storage)
- Analytics pipeline (events → warehouse/BI)

---

## 3) Video & interactive delivery
- Video: streaming (HLS/DASH) + CDN
- Interactive: JSON lesson spec (render engine)
- Prefetch assets cho Today’s Mission

---

## 4) Evidence handling (✅ theo quyết định v1.2)
### Required evidence
- checklist + quiz score lưu trong DB (nhẹ, realtime)

### Optional photo/audio
- Upload chỉ qua **parent gate**
- Store:
  - object storage (S3-compatible) + signed URL
  - giới hạn kích thước (ảnh nén; audio tối đa 30s)
- Retention:
  - configurable (30/90/365 ngày)
  - phụ huynh có nút xoá portfolio/evidence

---

## 4.5) Scheduled jobs & delivery (Report + Retention)
### Weekly Report pipeline
- **Generate**: batch job mỗi tuần (theo timezone Asia/Bangkok), tạo WeeklyReport cho từng child
- **Deliver in-app**: report hiển thị trong Reports page + dashboard card
- **Deliver email** (nếu opt-in):
  - queue email job (SendGrid/Mailgun/SES)
  - gắn deep link token để mở đúng child dashboard
  - tracking tối thiểu: sent/bounced (open/click là optional)

### Portfolio retention
- **Default**: media retention 90 ngày (rolling)
- **Extended**: tối đa 365 ngày (opt-in/plan)
- Job hàng ngày:
  - tìm media `expires_at <= now` → xoá object storage + update DB (deleted_at)
  - ghi log/audit để support khi phụ huynh hỏi

### Notification preferences
- Per-parent và per-child opt-in (vì nhiều bé)
- Rate limiting để không spam (1 email/tuần/child, hoặc gộp 1 email/tuần/parent)


## 5) Security baseline
- JWT + refresh token
- Rate limit login
- Audit log admin actions
- Signed URL cho video/evidence assets
- Per-child access control (không lẫn progress giữa profiles)

---

## 6) Observability & QA
- Event tracking chuẩn (activation, lesson_complete, report_view, trial_to_paid)
- Synthetic monitoring cho player latency (vì trẻ bỏ nhanh nếu lag)

---

## 7) References (design drivers)
- (Market) Kids learning products thường hỗ trợ nhiều child profiles (ví dụ 3 child profiles)
- (Growth) Trial length benchmark và randomized experiment (3 vs 7) để tối ưu conversion
