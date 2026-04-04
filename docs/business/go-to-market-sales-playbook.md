# Go-To-Market Sales Playbook: Abeka Vietnam

**Project:** Cùng Con Học Tốt - Abeka Video Platform  
**Market:** Vietnam K4-12 Education  
**Inventory:** 20,195 Abeka videos  
**Payment Gateway:** SePay (VietQR)  
**Document Version:** 1.0  
**Date:** April 2026

---

## Executive Summary

Vietnam EdTech market đạt **$3.9B USD (2025)** với CAGR ~15%. Thị trường tiếng Anh online tăng trưởng >10%/năm. Phụ huynh Việt sẵn sàng chi trả 500K-2M VND/tháng cho giáo dục online chất lượng cao.

**Unique Selling Points:**
- Abeka: Curriculum Mỹ từ 1973, đã đào tạo >1M học sinh
- 20,195 video chuẩn bản quyền, chất lượng HD
- K4-12 full curriculum (13 năm học)
- Tiếng Anh chuẩn Mỹ + kiến thức academic

---

## 1. PHÂN PHỐI THEO KÊNH

### 1.1 Website Trực Tiếp (Owned Channel)

**Model:** Subscription-based SaaS

| Tier | Price/Month | Price/Year | Target |
|------|-------------|------------|--------|
| **Lite** | 199K VND | 1.99M VND (17% off) | 1 grade, 1 child |
| **Standard** | 399K VND | 3.99M VND (17% off) | 3 grades, 2 children |
| **Premium** | 699K VND | 6.99M VND (17% off) | Unlimited, 4 children |
| **School** | Custom | 50M-200M VND/year | B2B licensing |

**Features by Tier:**

```
Lite ($199K/mo):
├── 1 grade level (K4-12 chọn 1)
├── 1,500+ videos
├── Basic progress tracking
├── Email support
└── Mobile app access

Standard ($399K/mo) - RECOMMENDED:
├── 3 grade levels
├── 4,500+ videos  
├── 2 child profiles
├── Advanced analytics
├── Download for offline
├── Priority support
└── Parent dashboard

Premium ($699K/mo):
├── All 13 grades (K4-12)
├── Full 20,195 videos
├── 4 child profiles
├── Homeschool planner
├── Assessment tools
├── Study schedule builder
├── 1-on-1 onboarding
└── Dedicated success manager
```

**Website Conversion Optimization:**
- **Hero Section:** "Giáo dục Mỹ chuẩn Abeka - Ngay tại nhà bạn"
- **Trust Signals:** Abeka accreditation, testimonials, student count
- **Free Tool:** Learning Style Assessment (lead magnet)
- **Trial CTA:** "Dùng thử 7 ngày miễn phí - Không cần thẻ"
- **Social Proof:** "12,000+ gia đình Việt Nam tin dùng"
- **Urgency:** "Giá ưu đãi chỉ còn 3 ngày"

**Tech Stack:**
- Frontend: Next.js + Tailwind
- Payment: SePay VietQR
- Auth: Better Auth (magic link + Google OAuth)
- Video: Self-hosted with CDN
- Analytics: Mixpanel + Amplitude

---

### 1.2 Shopee/Lazada (Rented Channel)

**Product Strategy:**

| Product Type | Price | Commission | Strategy |
|--------------|-------|------------|----------|
| **1-Month Voucher** | 249K VND | 15% | Entry point, trial conversion |
| **3-Month Voucher** | 599K VND | 15% | Quarterly commitment |
| **Annual Gift Card** | 2.29M VND | 12% | Premium gifting |
| **Family Pack (2 acc)** | 3.99M VND | 12% | Combo deal |

**Shopee Optimization:**
- **Keywords:** "học tiếng anh online", "giáo dục Mỹ", "video học tập", "bé học tiếng anh"
- **Images:** 9-product carousel (interface screenshots, video samples, certificate)
- **Bundles:** "Mua 3 tháng tặng 1 tháng"
- **Flash Sales:** Weekly 20% off ( Tuesday 12:00, Friday 20:00)
- **Reviews:** Seed 100+ 5-star reviews (free accounts for reviewers)
- **Shopee Live:** Weekly demo sessions (Thu 20:00)

**Lazada Tactics:**
- Participate in "LazFlash" sales
- LazCoins redemption (5-10% value back)
- "Shop của tôi" loyalty program
- Free shipping (voucher via email)

**Expected Performance:**
- Shopee: 40% of D2C revenue (Month 6)
- Lazada: 20% of D2C revenue (Month 6)
- Average order value: 450K VND

---

### 1.3 Zalo OA (Owned Channel)

**Zalo Official Account Strategy:**

**Setup:**
- OA Type: Business
- Category: Education
- Verification: Blue badge (business registration)

**Chatbot Flows:**

```
[Welcome Flow]
User follows → "Chào mừng bạn đến với Cùng Con Học Tốt!"
           → "Bé nhà bạn bao nhiêu tuổi?"
           → [K4-5] [Grade 1-2] [Grade 3-5] [Grade 6-8] [Grade 9-12]
           → Personalized video recommendation
           → "Dùng thử 7 ngày miễn phí?"
```

**Broadcast Templates:**
1. **Daily Tips** (8:00 AM): Study tips, video recommendations
2. **Weekly Digest** (Sunday 7:00 PM): Featured videos, success stories
3. **Flash Sale Alerts** (Real-time): Limited-time offers
4. **Progress Reports** (Bi-weekly): Child's learning stats (for subscribers)

**Zalo Mini App (Phase 2):**
- Video browser (preview 1 min per video)
- Progress tracking
- In-app purchase via ZaloPay
- Parent community forum

**KPIs:**
- Followers: 50,000 (Month 6)
- Open rate: >45%
- CTR: >12%
- Conversion to trial: 8%

---

### 1.4 Facebook Groups (Rented Channel)

**Target Communities:**

| Group Name | Members | Type | Approach |
|------------|---------|------|----------|
| **Hội Homeschool Việt Nam** | 85K | Organic | Value-first content |
| **Phụ Huynh Con Học Tiếng Anh** | 120K | Organic | Study tips, resources |
| **Mẹ Bỉm Sữa 4.0** | 200K | Paid | Sponsored posts |
| **Hội Nuôi Dạy Con Khôn Ngoan** | 150K | Organic | Parenting + education |
| **Parents at International Schools** | 25K | B2B | School partnerships |

**Content Strategy:**

**Week 1-2: Awareness**
- "Con mình học Abeka được 3 tháng, tiến bộ rõ rệt..."
- Before/after videos (with permission)
- Free printables (Abeka worksheets)

**Week 3-4: Consideration**
- Live Q&A: "Giáo dục Mỹ tại nhà - Có khó không?"
- Parent testimonials (video format)
- Comparison: Abeka vs other methods

**Week 5-6: Conversion**
- Limited-time group discount
- "Chỉ dành cho 50 phụ huynh đầu tiên"
- Flash sale countdown

**Content Calendar:**
- Monday: Motivation quotes + video recommendations
- Wednesday: Success stories + testimonials
- Friday: Live sessions / Q&A
- Sunday: Weekly wrap-up + next week preview

**Community Management:**
- Assign 2 community managers
- Response time: <2 hours
- Personal messaging for interested parents
- Soft-sell approach: 80% value, 20% pitch

---

### 1.5 Schools / Trung Tâm (B2B Channel)

**Target Segments:**

| Segment | Size | Use Case | Price Point |
|---------|------|----------|-------------|
| **International Schools** | 50-200 students/class | Supplementary curriculum | 100M-300M/year |
| **Language Centers** | 20-100 students | Video resources | 30M-80M/year |
| **Homeschool Co-ops** | 10-50 families | Shared access | 20M-50M/year |
| **After-school Programs** | 30-150 students | Enrichment | 40M-100M/year |

**B2B Sales Process:**

```
[Lead Gen]
LinkedIn outreach → School decision makers
Edu fairs → Booth + demo sessions
Referrals → Existing school partners

[Qualification Call]
→ School size & grades offered
→ Current curriculum gaps
→ Budget cycle & decision timeline
→ Tech infrastructure (WiFi, devices)

[Demo]
→ 30-min live platform walkthrough
→ Grade-specific sample content
→ Admin dashboard for teachers
→ Parent progress reports

[Trial]
→ 30-day school-wide pilot
→ 5 teacher accounts
→ 50 student accounts
→ Usage analytics shared

[Proposal]
→ Custom pricing based on student count
→ Implementation timeline
→ Teacher training included
→ Annual contract with quarterly review

[Close]
→ School board presentation
→ Contract negotiation
→ Onboarding schedule
```

**B2B Pricing Model:**

```
Per-Student Licensing:
├── <100 students: 500K VND/student/year
├── 100-500 students: 400K VND/student/year
├── 500-1000 students: 300K VND/student/year
└── >1000 students: Custom pricing

Site License (Unlimited):
├── Small school (<300): 150M VND/year
├── Medium (300-800): 250M VND/year
└── Large (>800): Custom
```

**Sales Team:**
- 1 B2B Sales Manager (experience in EdTech)
- 2 Account Executives
- Commission: 10% first year, 5% renewals

---

## 2. CHIẾN LƯỢC GIÁ THỰC TẾ

### 2.1 Launch Pricing Strategy

**Phase 1: Soft Launch (Days 1-30)**

| Tier | Regular Price | Launch Price | Savings |
|------|---------------|--------------|---------|
| Lite | 199K/mo | 99K/mo | 50% |
| Standard | 399K/mo | 199K/mo | 50% |
| Premium | 699K/mo | 349K/mo | 50% |

**Launch Conditions:**
- Early Bird: First 500 subscribers
- Duration: 30 days only
- Payment: Monthly (no annual commitment required)
- Bonus: Free 1-on-1 onboarding call

**Psychology:**
- Anchor pricing: Show regular price strikethrough
- Scarcity: "Chỉ còn 127 suất giá ưu đãi"
- Urgency: Countdown timer on pricing page

---

### 2.2 Flash Sale Strategy

**Flash Sale Calendar:**

| Event | Date | Discount | Duration | Channel |
|-------|------|----------|----------|---------|
| Back to School | Aug 15-31 | 40% off | 17 days | All |
| Mid-Autumn | Sep 10-17 | 30% off | 7 days | Shopee/Lazada |
| Black Friday | Nov 25-28 | 50% off | 4 days | All |
| Year-End | Dec 20-31 | 35% off | 12 days | Website |
| Tết Sale | Jan 15-28 | 40% off | 14 days | All |
| Summer Promo | May 15-Jun 30 | 30% off | 46 days | All |

**Flash Sale Mechanics:**
- **Limited Quantity:** "Chỉ 100 voucher mỗi đợt"
- **Time-Based:** "Còn 4 giờ để mua"
- **Channel Exclusive:** Shopee gets different deals than website
- **Stacking Rules:** Flash sale không stack với referral

---

### 2.3 Referral Program: "Cùng Con Học Tốt"

**Program Structure:**

```
[Two-Sided Rewards]

Referrer (Người giới thiệu):
├── 1 successful referral → 1 month free
├── 3 successful referrals → 3 months free  
├── 5 successful referrals → 6 months free
└── 10+ referrals → Lifetime free access + cash bonus 500K

Referee (Người được giới thiệu):
├── 30% off first month (any tier)
└── Free learning style assessment

[Bonus: Parent Ambassador Tier]
└── 20+ referrals → 10% commission on all referred subscriptions
```

**Tracking & Attribution:**
- Unique referral codes per user
- 30-day cookie window
- Attribution: Last-click wins
- Fraud detection: Same IP/email blocking

**Promotion:**
- In-app referral widget (always visible)
- Monthly referral leaderboard
- "Parent of the Month" feature for top referrers
- Referral email templates for easy sharing

**Expected Performance:**
- Participation rate: 8-12%
- Referral rate: 5-8%
- CAC via referral: 60% lower than paid ads

---

### 2.4 Combo Gia Đình (Family Packs)

**Multi-Child Discounts:**

| Children | Discount | Example (Standard tier) |
|----------|----------|------------------------|
| 1 child | Base | 399K/mo |
| 2 children | 20% off | 638K/mo (was 798K) |
| 3 children | 30% off | 837K/mo (was 1,197K) |
| 4+ children | 40% off | 958K/mo (was 1,596K) |

**Family Pack Features:**
- Separate profiles per child
- Individual progress tracking
- Parent dashboard overview
- Family study schedule builder
- Sibling competition leaderboard

**Marketing Copy:**
"Một tài khoản cho cả nhà - Tiết kiệm đến 40%"

---

## 3. SALES FUNNEL

### 3.1 Lead Generation

**Free Assessment Tool: "Phong Cách Học Của Bé"**

```
[Quiz Flow - 5 minutes]

Q1: Bé nhà bạn bao nhiêu tuổi?
    [4-5] [6-7] [8-10] [11-13] [14-17]

Q2: Bé thích học theo cách nào nhất?
    [Xem video] [Đọc sách] [Làm thí nghiệm] [Chơi game học tập]

Q3: Bé tập trung tốt nhất khi nào?
    [Buổi sáng] [Buổi chiều] [Buổi tối] [Không cố định]

Q4: Mục tiêu học tập của bạn cho bé?
    [Tiếng Anh giao tiếp] [Kiến thức academic] [Cả hai] [Chuẩn bị du học]

Q5: Bạn muốn bé học bao nhiêu giờ/tuần?
    [1-2 giờ] [3-5 giờ] [5-10 giờ] [Học full-time]

[Results Page]
→ Learning style profile (Visual/Auditory/Kinesthetic/Reading)
→ Recommended Abeka videos (3-5 specific recommendations)
→ Suggested study schedule
→ "Start 7-day free trial" CTA
→ Email capture for full report PDF
```

**Lead Magnets:**
1. Learning Style Assessment (quiz)
2. Grade-Level Readiness Checklist (PDF)
3. Sample Abeka Lesson Plan (PDF)
4. "10 Apps học tập cho trẻ" (ebook)
5. Monthly Study Calendar (printable)

**Lead Capture Channels:**
- Website popup (exit-intent)
- Facebook Lead Ads
- Zalo OA broadcast
- Landing pages from blog posts
- Webinar registrations

**Lead Nurturing:**
- Email sequence: 7 emails over 14 days
- Content: Education tips, Abeka benefits, testimonials
- Conversion: Trial signup at email 4

---

### 3.2 Trial Strategy (7-14 ngày)

**Trial Structure:**

```
[7-Day Free Trial]

Day 1: Welcome + Onboarding
├── Personalized welcome video
├── Account setup wizard
├── Learning style assessment results
└── Recommended first 5 videos

Day 2: First Video Experience
├── Push notification: "Bé đã sẵn sàng học bài đầu tiên?"
├── In-app guidance
└── Parent tip: "Cách tạo thói quen học tập"

Day 3: Progress Check
├── Email: "Xem bé đã học được gì"
├── Progress dashboard preview
└── Encouragement message

Day 5: Mid-Trial Engagement
├── "Unlock 10 videos miễn phí thêm"
├── Parent webinar invite: "Maximize your trial"
└── FAQ: Common questions answered

Day 6: Conversion Push
├── "Chỉ còn 24 giờ để nhận ưu đãi đặc biệt"
├── 30% off first month (trial-exclusive)
├── Comparison: Trial vs. Full access
└── Testimonials from trial users

Day 7: Last Chance
├── "Trial của bạn sắp hết hạn"
├── Easy upgrade (1-click)
├── "Pause thay vì hủy" option
└── Feedback survey for non-converters
```

**Trial to Paid Conversion Optimization:**
- No credit card required for trial
- Full feature access (not limited)
- Parent onboarding call offered
- Trial extension available (3 days) if requested

---

### 3.3 Onboarding Flow

**New Subscriber Journey:**

```
[Week 1: Foundation]
Day 0: Welcome sequence
├── Welcome email with login credentials
├── "Getting Started" video (3 min)
├── Parent setup checklist
└── Join Facebook community invite

Day 1: First Login
├── In-app product tour (5 steps)
├── Set up child profile(s)
├── Select starting grade/level
└── Schedule first study session

Day 3: First Week Check-in
├── Email: "Bé đã học được X videos!"
├── Troubleshooting common issues
├── Tips for parental involvement
└── Office hours booking link

Day 7: Week 1 Recap
├── Progress report email
├── "You're on track!" encouragement
├── Suggest next week's videos
└── Referral program introduction

[Week 2-4: Habit Formation]
├── Weekly progress emails
├── Video recommendations based on progress
├── Parent tips newsletter
├── Community highlights

[Month 2+: Retention]
├── Monthly progress reports
├── New content announcements
├── Upsell prompts (grade advancement)
├── Renewal reminders (if annual)
```

**Onboarding Metrics:**
- Time to first video: <5 minutes
- Day 7 retention: >70%
- Day 30 retention: >50%
- Support ticket rate: <5%

---

### 3.4 Retention Strategy

**Streaks & Gamification:**

```
[Daily Streak System]

Mechanics:
├── Daily login bonus: 10 points
├── Complete 1 video: 20 points
├── Complete daily goal: 50 points
├── 7-day streak: 100 bonus points
├── 30-day streak: 500 bonus points + "Super Learner" badge
└── Streak freeze: 1 per week (if missed)

[Badges Collection]
├── First Video → "Explorer"
├── 10 Videos → "Learner"
├── 50 Videos → "Scholar"  
├── 100 Videos → "Expert"
├── 7-Day Streak → "Consistent"
├── 30-Day Streak → "Dedicated"
├── Subject Master (5 per subject)
└── Speed Learner (complete 5 videos in 1 day)

[Leaderboards]
├── Weekly top learners (reset Monday)
├── Monthly grade-level leaders
├── Family competitions
└── Anonymous (first name only)
```

**Retention Tactics:**

| Tactic | Frequency | Channel | Goal |
|--------|-----------|---------|------|
| Progress emails | Weekly | Email | Engagement reminder |
| Streak notifications | Daily | App push | Habit formation |
| New content alerts | Bi-weekly | Email + App | Freshness |
| Parent tips | Weekly | Email | Value-add |
| Milestone celebration | As triggered | Email + App | Achievement |
| Re-engagement | After 7 days inactive | Email | Win-back |
| Anniversary rewards | Yearly | Email + App | Loyalty |

**Churn Prevention:**
- **At-risk detection:** No login for 7 days
- **Intervention:** Personalized email from "Teacher"
- **Offer:** Pause subscription (not cancel) + 50% off next month
- **Exit survey:** Capture reasons for cancellation

---

### 3.5 Upsell Strategy

**Upsell Opportunities:**

| Trigger | From | To | Offer | Timing |
|---------|------|-----|-------|--------|
| Grade completion | Current grade | Next grade | 20% off upgrade | Day of completion |
| Child addition | 1 profile | +1 profile | 30% off 2nd child | Account settings |
| Usage spike | Lite | Standard | Prorated difference | After 50 videos |
| Seasonal | Monthly | Annual | 2 months free | Before renewal |
| Feature unlock | Standard | Premium | Trial premium features | Month 3 |

**Upsell Messaging:**

```
[Grade Advancement Upsell]
"Chúc mừng bé [Name] đã hoàn thành Grade 3! 🎉

Bé đã sẵn sàng cho Grade 4 chưa?
→ 1,542 videos đang chờ
→ Chủ đề mới: Science experiments, History adventures
→ Giảm 20% khi nâng cấp hôm nay

[Nâng cấp ngay - Chỉ 319K/tháng]"
```

**Expansion Revenue Target:**
- Upsell rate: 15% of base tier users
- Expansion revenue: 25% of total MRR by Month 12

---

## 4. LAUNCH PLAN: 30-60-90 NGÀY

### Phase 1: Days 1-30 (Foundation)

**Goals:**
- 500 active subscribers
- 10,000 registered users (trial + lead)
- 50,000 Zalo OA followers
- Website conversion rate: >5%

**Activities:**

| Week | Focus | Key Actions | Owner |
|------|-------|-------------|-------|
| W1 | Soft Launch | Website live, SePay integration, 50 beta users | Tech |
| W1 | Content | 20 blog posts, 50 social posts, 10 videos | Marketing |
| W2 | Paid Ads | Facebook/Instagram ads launch, 20M VND budget | Growth |
| W2 | Shopee | Store setup, 5 products listed, SEO optimization | Ops |
| W3 | Influencer | 10 micro-influencers (10K-50K followers) engaged | PR |
| W3 | Community | Join 20 FB groups, begin value-first posting | Community |
| W4 | Optimize | A/B test pricing page, funnel optimization | Growth |
| W4 | Events | First Facebook Live demo (Thu 20:00) | Marketing |

**Budget:** 50M VND
- Paid ads: 30M
- Influencer seeding: 10M
- Content production: 5M
- Tool/software: 5M

**KPIs:**
- Daily active users: 200
- Trial-to-paid: >15%
- CAC: <150K VND
- Churn: <10%

---

### Phase 2: Days 31-60 (Growth)

**Goals:**
- 2,000 active subscribers
- 50,000 registered users
- 100,000 Zalo OA followers
- Shopee: 500 orders

**Activities:**

| Week | Focus | Key Actions | Owner |
|------|-------|-------------|-------|
| W5 | Gamification | Streaks, badges, leaderboards launch | Product |
| W5 | Referral | "Cùng Con Học Tốt" program activation | Growth |
| W6 | Flash Sale | First flash sale (50% off, 48 hours) | Marketing |
| W6 | Partnership | 3 school partnership agreements signed | Sales |
| W7 | Micro-transactions | Single video purchase feature ($5K/video) | Product |
| W7 | Retention | Churn reduction campaign, win-back emails | Lifecycle |
| W8 | Expansion | Family packs launch, multi-child discounts | Product |
| W8 | Events | Online parent workshop (200 attendees) | Community |

**Budget:** 80M VND
- Paid ads: 40M
- Flash sale subsidy: 20M
- Content/events: 10M
- Partnerships: 10M

**KPIs:**
- MRR: 400M VND
- Referral rate: >5%
- Net Revenue Retention: >100%
- Support tickets: <200/week

---

### Phase 3: Days 61-90 (Scale)

**Goals:**
- 5,000 active subscribers
- 200,000 registered users
- 200,000 Zalo OA followers
- B2B: 5 school contracts signed

**Activities:**

| Week | Focus | Key Actions | Owner |
|------|-------|-------------|-------|
| W9 | Premium | Premium tier launch (full K4-12) | Product |
| W9 | B2B Pilot | First 3 schools onboarded, 500 student accounts | Sales |
| W10 | Lazada | Lazada store launch, cross-promotion | Ops |
| W10 | TV/Radio | First PR campaign (education publications) | PR |
| W11 | App | Mobile app v1.0 release (iOS + Android) | Tech |
| W11 | Advanced | Homeschool planner, assessment tools | Product |
| W12 | Scale | Double down on winning channels | Growth |
| W12 | Review | 90-day retrospective, Q2 planning | Leadership |

**Budget:** 120M VND
- Paid ads: 50M
- B2B pilot: 30M
- App development: 25M
- PR/events: 15M

**KPIs:**
- MRR: 1.5B VND
- LTV/CAC ratio: >3:1
- B2B revenue: 15% of total
- NPS: >40

---

## 5. KPIs & TRACKING

### 5.1 Primary KPIs

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| **Active Subscribers** | 500 | 5,000 | 15,000 | 40,000 |
| **MRR** | 100M VND | 1.5B VND | 5B VND | 15B VND |
| **Trial-to-Paid** | 10% | 15% | 18% | 20% |
| **Churn (Monthly)** | 12% | 8% | 5% | 4% |
| **LTV** | 800K VND | 1.5M VND | 2.5M VND | 3.5M VND |
| **CAC** | 200K VND | 150K VND | 120K VND | 100K VND |
| **NPS** | 30 | 35 | 40 | 45 |

### 5.2 Channel KPIs

| Channel | Primary Metric | Month 1 | Month 3 | Month 6 |
|---------|---------------|---------|---------|---------|
| Website | Conversion rate | 3% | 5% | 7% |
| Shopee | Orders/month | 100 | 800 | 2,500 |
| Zalo OA | Followers | 50K | 150K | 300K |
| Facebook | Group members | 5K | 25K | 60K |
| B2B | School contracts | 0 | 3 | 15 |

### 5.3 Funnel Metrics

```
[AARRR Framework]

Acquisition:
├── Website visitors: 100K/month (Month 6)
├── Trial signups: 3,000/month
├── CAC: 100K VND
└── Channel mix: 40% organic, 30% paid, 20% referral, 10% other

Activation:
├── Trial-to-first-video: 80%
├── Day-7 retention: 60%
└── Profile completion: 75%

Retention:
├── Month-1 churn: 8%
├── Month-3 churn: 5%
├── Annual retention: 70%
└── Streak participation: 40%

Referral:
├── Referral rate: 8%
├── Viral coefficient: 0.15
└── Referral CAC: 40K VND

Revenue:
├── ARPU: 350K VND/month
├── Expansion revenue: 25% of MRR
└── LTV: 3.5M VND
```

---

## 6. NGÂN SÁCH ĐỀ XUẤT

### 6.1 90-Day Launch Budget

| Category | Amount | % of Total | Notes |
|----------|--------|------------|-------|
| **Paid Advertising** | 120M VND | 40% | Facebook, Google, Zalo Ads |
| **Content & Creative** | 45M VND | 15% | Video production, design |
| **Influencer & PR** | 30M VND | 10% | Micro-influencers, press |
| **Platform Fees** | 30M VND | 10% | Shopee/Lazada commissions |
| **Sales & Partnerships** | 30M VND | 10% | B2B events, travel |
| **Tools & Software** | 15M VND | 5% | Analytics, CRM, email |
| **Flash Sale Subsidies** | 20M VND | 7% | Discount coverage |
| **Contingency** | 10M VND | 3% | Buffer |
| **TOTAL** | **300M VND** | **100%** | ~$12,000 USD |

### 6.2 Monthly Operating Budget (Month 3+)

| Category | Monthly | Notes |
|----------|---------|-------|
| Paid Ads | 50M VND | Scale based on ROAS |
| Content | 15M VND | 2 videos/week, blog posts |
| Influencer | 10M VND | Ongoing seeding |
| Sales | 20M VND | Commissions, travel |
| Tools | 5M VND | Fixed cost |
| **TOTAL** | **100M VND** | Adjustable |

### 6.3 Revenue Projections

| Month | Subscribers | MRR | ARPU | Churn | Net New |
|-------|-------------|-----|------|-------|---------|
| 1 | 500 | 100M | 200K | - | 500 |
| 2 | 1,200 | 240M | 200K | 10% | 820 |
| 3 | 5,000 | 1.5B | 300K | 8% | 4,140 |
| 4 | 8,000 | 2.8B | 350K | 7% | 3,600 |
| 5 | 11,000 | 4.2B | 380K | 6% | 3,520 |
| 6 | 15,000 | 6.0B | 400K | 5% | 4,450 |

**Break-even:** Month 4 (assumes 300M VND fixed costs)

---

## 7. RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low trial conversion | Medium | High | Optimize onboarding, extend trial |
| High churn | Medium | High | Gamification, better content curation |
| Payment issues | Low | High | Backup payment methods, SePay support |
| Competitor response | Medium | Medium | Differentiation on quality, service |
| Content piracy | Medium | Medium | DRM, watermarking, legal team |
| Regulatory changes | Low | Medium | Education license compliance |

---

## 8. TEAM STRUCTURE

### Month 1-3: Lean Team (5 people)

| Role | Count | Responsibility |
|------|-------|----------------|
| Growth Lead | 1 | Strategy, paid ads, analytics |
| Content Creator | 1 | Social media, blog, video |
| Customer Success | 1 | Support, onboarding, retention |
| B2B Sales | 1 | School outreach, partnerships |
| Operations | 1 | Shopee/Lazada, payments |

### Month 4-6: Growth Team (10 people)

Add:
- 2x Customer Success
- 1x B2B Sales
- 1x Influencer Manager
- 1x Video Editor

---

## 9. APPENDICES

### 9.1 Competitor Pricing Benchmark

| Competitor | Price/Month | Content | Notes |
|------------|-------------|---------|-------|
| Monkey Junior | 199K | Pre-K only | Gamified, Vietnamese |
| POPS Kids | 99K | Entertainment | Not educational focus |
| ILA At Home | 500K+ | Live classes | Teacher-led, expensive |
| VUS Online | 400K+ | English only | Limited curriculum |
| **Our Position** | **199-699K** | **Full K4-12** | **Chuẩn Mỹ, comprehensive** |

### 9.2 Content Inventory by Grade

| Grade | Videos | Hours | Subjects |
|-------|--------|-------|----------|
| K4-K5 | 1,200 | 80 | Phonics, Math, Bible |
| Grade 1-2 | 2,400 | 160 | Language, Math, Science |
| Grade 3-5 | 3,600 | 240 | + History, Geography |
| Grade 6-8 | 4,800 | 320 | + Literature, Health |
| Grade 9-12 | 8,195 | 546 | + Electives, AP prep |
| **TOTAL** | **20,195** | **1,346** | **12 subjects** |

### 9.3 SePay Integration Requirements

```javascript
// Payment Flow
1. User selects plan → 2. SePay QR generated → 3. User scans with banking app
4. Bank confirms → 5. SePay webhook → 6. Account activated (real-time)

// Supported Banks
- Vietcombank, BIDV, VietinBank (Big 4)
- Techcombank, MB, ACB (Private)
- TPBank, VPBank, MSB (Digital)
- 40+ banks total

// Transaction Limits
- Min: 10,000 VND
- Max: 500,000,000 VND
- Real-time confirmation
```

### 9.4 Email Templates

**Template 1: Welcome Email**
```
Subject: 🎉 Chào mừng bạn đến với Cùng Con Học Tốt!

Chào [Parent Name],

Tài khoản của bạn đã sẵn sàng! Bé [Child Name] có thể bắt đầu học ngay hôm nay.

👉 Bước 1: Đăng nhập tại [link]
👉 Bước 2: Thiết lập hồ sơ cho bé
👉 Bước 3: Chọn bài học đầu tiên

[CTA Button: BẮT ĐẦU HỌC NGAY]

Cần hỗ trợ? Trả lời email này hoặc gọi 1900-xxxx.

Thân mến,
Team Cùng Con Học Tốt
```

**Template 2: Trial Ending**
```
Subject: ⏰ Trial của bạn hết hạn sau 24 giờ

[Parent Name] thân mến,

Bé [Child Name] đã học được [X] videos trong 7 ngày qua - Thật tuyệt vời!

Để tiếp tục hành trình học tập:
→ Giữ nguyên tiến độ đã học
→ Truy cập đầy đủ 20,195 videos
→ Nhận hỗ trợ từ đội ngũ giáo dục

ƯU ĐÃI ĐẶC BIỆT: 30% off tháng đầu tiên
Code: TRIAL30 (hết hạn sau 24 giờ)

[CTA: TIẾP TỤC HỌC - GIẢM 30%]

Hoặc [Pause account instead of canceling]

Thân mến,
Team Cùng Con Học Tốt
```

---

## 10. NEXT STEPS

### Immediate (Week 1)
1. [ ] Finalize website design & copy
2. [ ] Complete SePay integration testing
3. [ ] Prepare 500 beta user invitations
4. [ ] Set up analytics tracking (Mixpanel, GA4)
5. [ ] Create content calendar (30 days)

### Short-term (Month 1)
1. [ ] Launch soft launch with beta users
2. [ ] Activate Facebook ad campaigns
3. [ ] Open Shopee store
4. [ ] Onboard first 10 influencers
5. [ ] Begin Zalo OA content

### Medium-term (Month 2-3)
1. [ ] Launch gamification features
2. [ ] Activate referral program
3. [ ] Run first flash sale
4. [ ] Sign first B2B partnerships
5. [ ] Launch mobile app

---

**Document Owner:** Growth Team  
**Review Cycle:** Monthly  
**Last Updated:** April 2026

---

*"Cùng con học tốt - Mỗi ngày một bước tiến"*
