# Admin Panel — Kiến trúc & API Implementation Plan

## Tổng quan hệ thống Admin

Giao diện Admin của **Cùng Con Tự Học** là một module tách biệt hoàn toàn khỏi giao diện người dùng chính, dành cho nội bộ vận hành.

---

## 1. Kiến trúc Routing & Isolation

```
src/app/
├── (admin-login)/admin/login/       # Đăng nhập riêng (không dùng NextAuth)
│   └── page.tsx                     # AdminLoginForm — credential-only
│
└── (main)/admin/                    # Admin panel (yêu cầu getAdminSession)
    ├── layout.tsx                   # Dark shell: fixed sidebar 220px + main offset
    ├── overview/                    # Dashboard
    ├── analytics/                   # Phân tích học tập
    ├── users/                       # Quản lý phụ huynh
    ├── courses/                     # Quản lý khoá học
    ├── organizations/               # Tổ chức B2B
    ├── operations/                  # Vận hành (tab-based)
    ├── gift-codes/                  # Mã quà tặng
    ├── content/                     # Nội dung (tracks/levels/units/lessons)
    ├── blog/                        # Blog hub + 6 sub-routes
    │   ├── posts/
    │   ├── categories/
    │   ├── authors/
    │   ├── newsletter/
    │   ├── analytics/
    │   └── comments/
    ├── staff/                       # Nhân sự (SUPER_ADMIN only)
    ├── security/                    # Bảo mật (SUPER_ADMIN only)
    └── log/                         # Nhật ký hành động (SUPER_ADMIN only)
```

### Authentication Layer
- **Admin session**: `getAdminSession()` — riêng biệt với NextAuth của phụ huynh
- **Sessions store**: Redis hoặc DB `AdminSession` table
- **2FA**: TOTP/OTP tại login (thiết kế Stitch đã có)
- **Role-based gate**: `requireAdminRole(role)` middleware per-page

---

## 2. Design System Icon — Quy chuẩn

| Quy tắc | Chi tiết |
|---|---|
| **Thư viện** | Lucide React — stroke-based (outline), không fill |
| **Kiểu** | Monochrome, một màu duy nhất mỗi icon |
| **Size sidebar** | `size={15}` — compact, đồng nhất |
| **Size page header** | `size={18}` |
| **Size tab bar** | `size={14}` |
| **Màu inactive** | `text-slate-400` (trên nền dark `slate-900`) |
| **Màu active** | `text-teal-400` (trên nền `slate-800`) |
| **Tuyệt đối tránh** | `CheckCircle`, `XCircle`, `AlertCircle` — filled-looking variants |
| **Dùng thay thế** | `CircleDot`, `CircleX`, `CircleAlert` — outline-clean |

### Icon mapping hiện tại (admin-shell-nav):
| Route | Icon | Lý do |
|---|---|---|
| /admin/overview | `LayoutDashboard` | Grid layout symbol |
| /admin/analytics | `BarChart2` | Bar chart outline |
| /admin/users | `Users` | Outline persons |
| /admin/courses | `GraduationCap` | Education |
| /admin/organizations | `Building2` | Office building |
| /admin/operations | `Settings` | Gear outline |
| /admin/gift-codes | `Gift` | Gift box |
| /admin/content | `BookOpen` | Open book |
| /admin/blog | `PenSquare` | Pen + square |
| /admin/staff | `UserCheck` | User + checkmark |
| /admin/security | `ShieldAlert` | Shield + exclamation |
| /admin/log | `Clock` | Time/history |

---

## 3. Feature Matrix — Trang × Model × Chức năng

### 3.1 Dashboard Overview (`/admin/overview`)

**Models:** `Parent`, [Payment](file:///d:/project/cungcontuhoc/src/components/admin-operations-tabs.tsx#15-25), [Subscription](file:///d:/project/cungcontuhoc/src/app/%28main%29/admin/overview/page.tsx#5-23), `WebhookEvent`, `Child`

**Hiển thị:**
- KPI pills: tổng phụ huynh, gói active, doanh thu 30d, bé hoạt động 7d, churn 30d
- Bảng subscription status (grouped counts by status)
- Bảng recent payments (top 10)
- Recent webhook events (top 5, highlight FAILED)

**API cần:**
```
GET /api/admin/overview
  → { counts, subscriptionsByStatus, recentPayments, recentWebhookEvents,
      activeChildrenLast7d, retention }
```

---

### 3.2 Analytics (`/admin/analytics`)

**Models:** `LessonProgress`, `Child`, [Subscription](file:///d:/project/cungcontuhoc/src/app/%28main%29/admin/overview/page.tsx#5-23), `Parent`

**Hiển thị:**
- Active students (7d/30d/90d toggle)
- Lessons completed per period
- Avg minutes/child
- Streak distribution (horizontal bars by bucket: 0, 1-3, 4-7, 8-14, 15-30, 30+)
- Top 10 lessons by completion count
- Retention: new parents, churn, retention rate, avg onboarding days

**API cần:**
```
GET /api/admin/analytics?period=7d|30d|90d
  → { learningStats, streakBuckets, topLessons, retentionMetrics }

GET /api/admin/analytics/lessons
  → { topLessons: [{ id, slug, title, completionCount, avgMinutes }] }
```

---

### 3.3 User Management (`/admin/users`)

**Model:** `Parent`, [Subscription](file:///d:/project/cungcontuhoc/src/app/%28main%29/admin/overview/page.tsx#5-23), `Child`

**Hiển thị:**
- Filterable table: search by email, filter by subscriptionStatus, sort by createdAt/plan
- Right-side drawer: user detail — extend plan, cancel plan, send email, view children
- Subscription status pills: TRIALING (sky), ACTIVE_STANDARD (emerald), ACTIVE_FAMILYPLUS (violet), GRACE (amber), EXPIRED (rose), CANCELED (slate)

**API cần:**
```
GET /api/admin/users?q=&status=&sort=&page=&limit=
  → { users: [...], total, page }

GET /api/admin/users/:id
  → { parent, subscription, children, payments }

PATCH /api/admin/users/:id/subscription
  body: { action: "extend" | "cancel" | "activate", days?: number }
  → { ok, subscription }

POST /api/admin/users/:id/email
  body: { subject, body }
  → { ok }
```

---

### 3.4 Courses (`/admin/courses`)

**Models:** `Track`, `Level`, `Unit`, [Lesson](file:///d:/project/cungcontuhoc/src/components/admin-operations-tabs.tsx#37-44), `LessonProgress`

**Hiển thị:**
- Card grid (courses/tracks) với thumbnail, provider badge, lesson count, enrollment count
- Toggle visibility (published/draft)
- Lesson detail drawer với reorder hints
- `[id]` page: full course management — levels, units, lessons

**API cần:**
```
GET /api/admin/courses
  → { tracks: [{ id, code, name, lessonCount, enrollmentCount, published }] }

PATCH /api/admin/courses/:id
  body: { published?: boolean, title?: string }
  → { ok, track }

GET /api/admin/courses/:id/lessons
  → { lessons: [...] }

PATCH /api/admin/lessons/:id
  body: { trialEnabled?, title?, orderNo? }
  → { ok }
```

---

### 3.5 Organizations (`/admin/organizations`)

**Model:** `Organization`, `OrganizationMember`, [Subscription](file:///d:/project/cungcontuhoc/src/app/%28main%29/admin/overview/page.tsx#5-23)

**Hiển thị:**
- Table: tên tổ chức, domain, seat count, plan, trạng thái
- Create/edit modal
- Member list per org

**API cần:**
```
GET /api/admin/organizations?q=&page=
  → { organizations, total }

POST /api/admin/organizations
  body: { name, domain, seats, plan }
  → { ok, organization }

PATCH /api/admin/organizations/:id
  body: { name?, seats?, plan?, active? }
  → { ok }

GET /api/admin/organizations/:id/members
  → { members }
```

---

### 3.6 Operations — Tab: Thanh toán (`/admin/operations`)

**Model:** [Payment](file:///d:/project/cungcontuhoc/src/components/admin-operations-tabs.tsx#15-25)

**API cần:**
```
GET /api/admin/payments?status=&limit=&page=
  → { payments: [{ id, parent.email, provider, providerTransactionId,
      amountVnd, status, processedAt }], total }
```

---

### 3.7 Operations — Tab: Webhook

**Model:** `WebhookEvent`

**API cần:**
```
GET /api/admin/webhooks?status=&provider=&limit=
  → { events: [{ id, provider, eventId, status, signatureValid,
      errorMessage, processedAt, createdAt }] }

POST /api/admin/webhooks/:id/retry
  → { ok }
```

---

### 3.8 Operations — Tab: Bài học dùng thử

**Model:** [Lesson](file:///d:/project/cungcontuhoc/src/components/admin-operations-tabs.tsx#37-44) (field `trialEnabled`)

**API cần:**
```
GET /api/admin/lessons/trial
  → { lessons: [{ id, slug, title, trialEnabled, trackCode }] }

PATCH /api/admin/lessons/:id/trial
  body: { trialEnabled: boolean }
  → { ok, lesson }
```

---

### 3.9 Operations — Tab: Thông báo

**Model:** `SystemAnnouncement`

**API cần:**
```
GET /api/admin/announcements
  → { announcements: [{ id, message, type, active, scheduledAt, endsAt, createdBy }] }

POST /api/admin/announcements
  body: { message, type: INFO|WARNING|SUCCESS, scheduledAt?, endsAt? }
  → { ok, announcement }

PATCH /api/admin/announcements/:id
  body: { active: boolean }
  → { ok }
```

---

### 3.10 Operations — Tab: Mã giảm giá

**Model:** [Coupon](file:///d:/project/cungcontuhoc/src/components/admin-coupon-panel.tsx#5-16)

**API cần:**
```
GET /api/admin/coupons
  → { coupons: [{ id, code, discountPercent, maxUses, usedCount, active, expiresAt }] }

POST /api/admin/coupons
  body: { code, discountPercent, maxUses?, expiresAt? }
  → { ok, coupon }

PATCH /api/admin/coupons/:id
  → { ok, coupon }   (toggle active)
```

---

### 3.11 Gift Codes (`/admin/gift-codes`)

**Model:** `GiftCode`, `GiftCodeRedemption`

**API cần:**
```
GET /api/admin/gift-codes?status=&page=
  → { codes: [{ id, code, planDays, maxUses, usedCount, active, expiresAt, createdBy }] }

POST /api/admin/gift-codes
  body: { planDays, maxUses?, prefix?, count?, expiresAt? }
  → { ok, codes: string[] }

PATCH /api/admin/gift-codes/:id
  body: { active?: boolean }
  → { ok }
```

---

### 3.12 Content (`/admin/content`)

**Models:** `Track`, `Level`, `Unit`, [Lesson](file:///d:/project/cungcontuhoc/src/components/admin-operations-tabs.tsx#37-44), `LessonAsset`

**Hiển thị:**
- Tree view: Track → Level → Unit → Lesson
- Edit metadata per node
- Toggle published/draft

**API cần:**
```
GET /api/admin/content/tracks
  → { tracks: [{ id, code, title, levels: [...] }] }

POST|PATCH|DELETE /api/admin/content/tracks/:id
POST|PATCH|DELETE /api/admin/content/levels/:id
POST|PATCH|DELETE /api/admin/content/units/:id
POST|PATCH|DELETE /api/admin/content/lessons/:id
```

---

### 3.13 Blog Hub (`/admin/blog`)

**Models:** `BlogPost`, `BlogCategory`, `BlogAuthor`, `BlogComment`, `BlogNewsletterSubscriber`

#### Posts (`/admin/blog/posts`)
```
GET /api/admin/blog/posts?status=&q=&page=
POST /api/admin/blog/posts           (create)
PATCH /api/admin/blog/posts/:id      (update)
DELETE /api/admin/blog/posts/:id
PATCH /api/admin/blog/posts/:id/publish
```

#### Categories (`/admin/blog/categories`)
```
GET|POST /api/admin/blog/categories
PATCH|DELETE /api/admin/blog/categories/:id
```

#### Authors (`/admin/blog/authors`)
```
GET|POST /api/admin/blog/authors
PATCH|DELETE /api/admin/blog/authors/:id
```

#### Newsletter (`/admin/blog/newsletter`)
```
GET /api/admin/blog/newsletter/subscribers?verified=&page=
POST /api/admin/blog/newsletter/export   (CSV export)
DELETE /api/admin/blog/newsletter/subscribers/:id
```

#### Comments (`/admin/blog/comments`)
```
GET /api/admin/blog/comments?status=pending|approved|rejected&page=
PATCH /api/admin/blog/comments/:id
  body: { status: "approved" | "rejected" }
DELETE /api/admin/blog/comments/:id
```

---

### 3.14 Staff (`/admin/staff`) — SUPER_ADMIN only

**Model:** [AdminUser](file:///d:/project/cungcontuhoc/src/components/admin-staff-panel.tsx#8-17)

**API cần:**
```
GET /api/admin/staff
  → { users: [{ id, email, displayName, role, isActive, lastLoginAt }] }

POST /api/admin/staff
  body: { email, password, displayName, role }
  → { ok }

PATCH /api/admin/staff/:id
  body: { displayName?, role?, isActive? }
  → { ok }
```

---

### 3.15 Security (`/admin/security`) — SUPER_ADMIN only

**Model:** [SecurityPolicy](file:///d:/project/cungcontuhoc/src/components/admin-security-panel.tsx#74-104), `FeatureFlag`

**API cần:**
```
GET /api/admin/security
  → { controls: { ddosMode, globalMultiplier, ipBlocklist, allowlist },
      policies: [{ key, label, strategy, limit, windowMs, default, range }] }

PUT /api/admin/security
  body: { ddosMode?, globalMultiplier?, ipBlocklist?: string[], allowlist?: string[],
          policies?: [{ key, limit, windowMs }] }
  → { ok }

GET /api/admin/security/export-edge-policy
  → JSON (edge policy for Cloudflare/Nginx)

GET /api/admin/feature-flags
  → { flags: [{ key, value, description }] }

PATCH /api/admin/feature-flags/:key
  body: { value: boolean }
  → { ok }
```

---

### 3.16 Log (`/admin/log`) — SUPER_ADMIN only

**Model:** [AdminActionLog](file:///d:/project/cungcontuhoc/src/components/admin-action-log-panel.tsx#21-119)

**API cần:**
```
GET /api/admin/log?limit=50&adminId=&action=
  → { logs: [{ id, adminEmail, action, target, createdAt }] }
```
Live-polling mỗi 60s (đã implement trong [AdminActionLogPanel](file:///d:/project/cungcontuhoc/src/components/admin-action-log-panel.tsx#21-119)).

---

## 4. RBAC — Role-Based Access Control

| Role | Truy cập |
|---|---|
| `SUPER_ADMIN` | Tất cả pages |
| `SUPPORT_AGENT` | overview, users, operations (read-only), log |
| `CONTENT_EDITOR` | courses, content, blog (full CRUD) |

Middleware: `requireAdminRole(['SUPER_ADMIN', 'SUPPORT_AGENT'])` áp dụng tại route handler level.

---

## 5. Export Data (`AdminExportData`)

**API cần:**
```
GET /api/admin/export?type=parents|payments|subscriptions&format=csv
  → streaming CSV response (Content-Disposition: attachment)
```

---

## 6. Lưu ý triển khai

> [!IMPORTANT]
> Tất cả API routes admin phải:
> 1. Gọi `getAdminSession()` ở đầu handler — không dùng NextAuth
> 2. Check `session.user.role` trước khi mutate dữ liệu nhạy cảm
> 3. Ghi log vào [AdminActionLog](file:///d:/project/cungcontuhoc/src/components/admin-action-log-panel.tsx#21-119) cho mọi action PATCH/POST/DELETE
> 4. Return `{ ok: true, data: ... }` hoặc `{ ok: false, error: { message } }`

> [!WARNING]
> Security endpoints (`/api/admin/security`) phải strict `SUPER_ADMIN` only.
> Rate-limit export endpoint tránh bị abuse.
