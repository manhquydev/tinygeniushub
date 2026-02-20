# 05 — Content Taxonomy & Data Model (CMS/DB)

Mục tiêu: chốt cách tổ chức nội dung để:
- Dev build DB/API đúng ngay từ đầu
- Bạn nhập liệu dễ, mở rộng thêm grade lớn không vỡ cấu trúc

---

## 1) Taxonomy nội dung (từ lớn → nhỏ)
### Program
- Ví dụ: “Cùng Con Tự Học — Giai đoạn mầm non”

### Track
- English / Math / Habit

### Level
- Ví dụ:
  - English: Level 1 → 9 (Little Fox-inspired)
  - Math: Level 1 → 5 (Numberblocks-inspired)
  - Habit: 21-day loop / weekly cycle

### Unit
- 1 unit = 1 chủ đề/1 chặng (2–4 tuần)

### WeekPlan
- Mỗi unit có 2–4 week plans

### DayPlan
- Mỗi week có 5–7 day plans (có ngày review)

### Lesson
- lesson_id, title, track, level, unit_id, week_no, day_no
- objective (1 câu)
- estimated_minutes
- prerequisites (optional)
- assets:
  - video_source (url/id)
  - interactive (game/quiz spec)
  - offline_card (image/pdf)
  - parent_script (markdown)

### Assessment (Mini)
- assessment_id, scope (track/level)
- items (json)
- pass_criteria
- remediation_rule

---

## 2) Data model người dùng
### ParentAccount
- id, email/phone (login), name (optional)
- plan_status (trial/paid/expired)
- plan_type (yearly / family+ / add-on slots)
- created_at, last_active_at

### ChildProfile (✅ chốt v1)
- id, parent_id
- nickname (không bắt buộc tên thật)
- age_band (ví dụ: 2–3 / 3–4 / 4–5 / 5–6)
- avatar_id
- placement_result (json)
- settings: daily_minutes_limit, preferred_language
- progress_snapshot (denormalized json)

> Constraint: **mặc định tối đa 3 child profiles / 1 parent account**.  
> Mở rộng: add-on slot hoặc Family+ (tối đa 5).

---

## 3) Progress & Evidence
### ProgressState
- child_id, track, level, unit_id, week_no, day_no
- lesson_completed_at
- streak_count, weekly_goal_status
- review_schedule (json: next_review_dates)

### Evidence (✅ chốt v1.2)
- evidence_id, child_id, lesson_id, created_at
- checklist (json: các mục tick)
- quiz_score (0–100 hoặc correct/total)
- attachments (optional):
  - photo_url (0..n)  — opt-in
  - audio_url (0..n)  — opt-in
  - media_meta (json): {type, size, duration, checksum, uploaded_by_parent_id}
- retention:
  - retention_policy: `DEFAULT_90D` | `EXTENDED_365D`
  - expires_at (datetime) — thời điểm auto-delete media (ảnh/audio)
  - deleted_at (datetime, nullable)
- visibility:
  - show_in_portfolio (bool)
  - shareable_progress_card (bool, default false)

> Checklist + quiz_score là “bằng chứng tối thiểu” (không cần media). Ảnh/audio chỉ là lớp tăng trust.

### WeeklyReport
- report_id, child_id, week_start, week_end
- minutes_learned, lessons_completed, streak_days
- skills_summary (json)
- recommendations (json)
- delivery:
  - generated_at
  - delivered_in_app_at
  - delivered_email_at (nullable)
  - email_status (queued/sent/bounced/open/click) — nếu tracking
- access:
  - deep_link_token (time-bound) — dùng trong email để mở đúng dashboard



### SubscriptionPlan
- subscription_id, parent_id
- plan_code: `YEARLY_STANDARD` | `YEARLY_FAMILY_PLUS`
- status: trialing/active/past_due/canceled
- current_period_start, current_period_end
- child_profile_limit: 3 | 5
- portfolio_retention_max_days: 90 | 365
- created_at, updated_at

### ParentPreferences
- parent_id
- weekly_report_channel: `IN_APP_ONLY` | `EMAIL_ONLY` | `IN_APP_AND_EMAIL` (default)
- weekly_report_email_enabled (bool)
- per_child_email_opt_in (json map child_id -> bool)
- marketing_email_opt_in (bool)
- timezone (default Asia/Bangkok)

