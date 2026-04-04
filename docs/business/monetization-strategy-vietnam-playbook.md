# Monetization Strategy Vietnam Playbook

**Product:** Cung Con Tu Hoc (Abeka-based K4-12 Education Platform)  
**Market:** Vietnam  
**Date:** April 2026  
**Status:** Strategic Framework

---

## Executive Summary

| Metric | Target |
|--------|--------|
| **LTV Goal** | 1,200,000 - 3,600,000 VND/user |
| **Target ARPU** | 180,000 VND/month |
| **Conversion Rate** | 8-12% (free → paid) |
| **Churn Rate** | <5%/month |
| **Payment Mix** | 70% Momo/ZaloPay, 25% VietQR, 5% Cards |

**Strategic Position:** Positioned as "Giáo dục Mỹ chuẩn quốc tế giá Việt Nam" (International US-standard education at Vietnamese prices)

---

## 1. Pricing Tier Architecture

### 1.1 Four-Tier Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PRICING PYRAMID VIETNAM                                   │
├─────────────┬──────────────┬──────────────┬──────────────┬─────────────────────┤
│             │   FREE       │   LITE       │  STANDARD    │   PREMIUM           │
│             │  (0đ)        │  (99k/月)    │ (199k/月)    │  (349k/月)          │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Target      │ Trial users  │ Price-sens.  │ Mainstream   │ Premium families    │
│ Segment     │              │ families     │ families     │                     │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ % of Base   │ 100% entry   │ 15% conv.    │ 60% conv.    │ 25% conv.           │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Child Slots │ 1 child      │ 1 child      │ 2 children   │ 4 children          │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Video Lib   │ 50 videos    │ 500 videos   │ Full 20,195  │ Full + early access │
│             │ (trial)      │ K4-8 only    │ K4-12        │                     │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Curriculum  │ Level 1 only │ Level 1-2    │ All 5 levels │ All + IXL Math      │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Gamification│ Basic        │ Standard     │ Full         │ Full + exclusive    │
│             │              │              │              │ badges              │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Features    │              │              │              │                     │
│ • Offline   │ ✗            │ ✗            │ ✓            │ ✓                   │
│   Download  │              │              │              │                     │
│ • Progress  │ Basic        │ Standard     │ Advanced     │ Advanced + AI       │
│   Reports   │              │              │              │ insights            │
│ • Parent    │ ✗            │ Email only   │ In-app +     │ Weekly video        │
│   Updates   │              │              │ email        │ summary             │
│ • Support   │ Community    │ Email        │ Chat + Email │ Priority phone      │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Streak      │ 3-day max    │ 7-day max    │ Unlimited    │ Unlimited + freeze  │
│ Protection  │              │              │              │ (2/month)           │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Ads         │ Light        │ ✗            │ ✗            │ ✗                   │
└─────────────┴──────────────┴──────────────┴──────────────┴─────────────────────┘
```

### 1.2 Yearly Discount Structure

| Tier | Monthly | Yearly | Discount | Effective Monthly |
|------|---------|--------|----------|-------------------|
| **Lite** | 99,000đ | 949,000đ | **20%** | ~79,000đ |
| **Standard** | 199,000đ | 1,899,000đ | **20%** | ~158,000đ |
| **Premium** | 349,000đ | 3,349,000đ | **20%** | ~279,000đ |

**Psychological Pricing Note:** Use 949k instead of 950k for better conversion (charm pricing less effective in VN for high-value items; round numbers signal quality)

### 1.3 Add-ons Menu

| Add-on | Price | Target Segment |
|--------|-------|----------------|
| **Extra Child Slot** | +49,000đ/child/month | Lite/Standard |
| **Streak Freeze Pack** | 29,000đ (3 freezes) | All tiers |
| **Offline Download Bundle** | 99,000đ (30 videos) | Lite users |
| **IXL Math Integration** | +79,000đ/month | Standard upgrade |
| **Parent Coaching Session** | 199,000đ/30min | Premium families |
| **Summer Intensive Access** | 299,000đ (2 months) | All tiers (seasonal) |

---

## 2. Payment Model Strategy

### 2.1 Payment Method Mix (Vietnam-Optimized)

```
┌────────────────────────────────────────────────────────────────┐
│           PAYMENT INFRASTRUCTURE STACK                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │   MoMo       │  │   ZaloPay    │  │   VietQR     │        │
│   │   (40%)      │  │   (30%)      │  │   (25%)      │        │
│   │              │  │              │  │              │        │
│   │ • One-tap    │  │ • Zalo mini  │  │ • Any bank   │        │
│   │ • Wallets    │  │   app        │  │ • Zero fee   │        │
│   │ • Promotions │  │ • Cashback   │  │ • Direct     │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│   ┌──────────────┐  ┌──────────────┐                          │
│   │   Cards      │  │   Bank       │                          │
│   │   (4%)       │  │   Transfer   │                          │
│   │              │  │   (1%)       │                          │
│   │ • Visa/MC    │  │ • Manual     │                          │
│   │ • JCB        │  │ • Enterprise │                          │
│   └──────────────┘  └──────────────┘                          │
│                                                                │
│   ┌──────────────────────────────────────────┐                │
│   │           SePay Integration              │                │
│   │     (Bank monitoring + VietQR gen)       │                │
│   └──────────────────────────────────────────┘                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Payment Flow by Tier

**Free → Lite Conversion:**
```
1. Trigger: 5th video completed OR parent dashboard visit
2. Offer: "Unlock 10x more videos for less than 1 bánh mì/day"
3. Checkout: MoMo/ZaloPay one-tap (priority)
4. Fallback: VietQR auto-generation
5. Post-payment: Immediate unlock + celebration animation
```

**Upgrade Flow (Lite → Standard → Premium):**
```
1. Trigger: Feature gate hit OR usage-based prompt
2. Offer: Prorated upgrade (pay difference only)
3. Checkout: Same method as original payment
4. Post-payment: Kisu mascot celebration + new badge unlock
```

### 2.3 Subscription Lifecycle

| Stage | Action | Timing |
|-------|--------|--------|
| **Trial End** | Soft paywall with countdown | Day 7 of free trial |
| **Pre-renewal** | Reminder + yearly upsell offer | 3 days before renewal |
| **Dunning** | Retry logic: Day 1, 3, 7 | On payment failure |
| **Grace Period** | Maintain access, daily nudges | 7 days post-failure |
| **Win-back** | 50% off 1 month offer | Day 14 post-cancellation |

---

## 3. Upsell Strategy

### 3.1 Free → Paid Conversion Triggers

```
┌─────────────────────────────────────────────────────────────────┐
│              UPSELL TRIGGER MAP                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FREE TIER LIMITS → LITE OFFER                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • 5 videos watched            → "Unlock 500 videos"        │ │
│  │ • 3-day streak achieved       → "Keep streak going"        │ │
│  │ • 1st child progress report     → "Track all subjects"       │ │
│  │ • 7 days since signup         → "Limited: 50% off Lite"     │ │
│  │ • Parent visits dashboard 3x  → "Advanced insights"        │ │
│  │ • Child asks for more content → "Upgrade for 4.9★ rated"   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  TIMING STRATEGY:                                                │
│  • First trigger: Day 3 (after habit formation starts)           │
│  • Escalation: Every 2 days with different angle               │
│  • Final offer: Day 14 (50% off first month - win-back backup)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Lite → Standard Conversion Triggers

| Trigger | Context | Offer |
|---------|---------|-------|
| Child hits grade 6-7 (K6-7 content locked) | Curriculum progression | "Tiếp tục hành trình K6-12 - Nâng cấp ngay" |
| 2nd child added to profile | Multi-child family identified | "Tiết kiệm 30% với gói Standard cho 2 con" |
| Download attempt | Offline feature gated | "Học mọi lúc mọi nơi - Thêm 100k/tháng" |
| 7-day streak achieved | Engagement milestone | "Nâng cấp để bảo vệ streak" |
| Lite for 60 days | Power user identification | "Bạn là phụ huynh tuyệt vời - Ưu đãi đặc biệt" |

### 3.3 Standard → Premium Conversion Triggers

| Trigger | Context | Offer |
|---------|---------|-------|
| IXL Math interest shown | Advanced learning needs | "Toán Mỹ chuẩn IXL - Trọn bộ Premium" |
| 3rd child added | Large family | "Gia đình 3+ con - Premium tiết kiệm nhất" |
| Support ticket submitted | Support needs | "Support ưu tiên với Premium" |
| 30-day streak achieved | Super engaged user | "Badge Vàng + Streak Freeze miễn phí" |
| Annual Standard renewal | Upsell timing | "Chỉ thêm 120k/tháng cho trải nghiệm cao cấp" |

### 3.4 Add-on Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│              ADD-ON PLACEMENT STRATEGY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STREAK FREEZE (Revenue: ~15% of add-on revenue)                 │
│  ├── Trigger: Streak about to break (Day 6 of 7, Day 13 of 14)  │
│  ├── Offer: "Mua Streak Freeze để giữ 15 ngày liên tiếp!"      │
│  └── Price: 29k (3-pack) - anchor to daily coffee               │
│                                                                  │
│  EXTRA CHILD SLOT (Revenue: ~40% of add-on revenue)              │
│  ├── Trigger: "Add child" button click on tier limit           │
│  ├── Offer: Modal with 2 options:                               │
│  │   • Add slot: +49k/month                                     │
│  │   • Upgrade tier: Better value for 2+ children               │
│  └── Smart recommendation based on current tier                 │
│                                                                  │
│  OFFLINE DOWNLOAD (Revenue: ~25% of add-on revenue)              │
│  ├── Trigger: Download button click (Lite users)               │
│  ├── Offer: "Tải 30 video - Chỉ 99k cho cả tháng học mọi nơi"   │
│  └── Seasonal spike: Summer holidays, Tet                       │
│                                                                  │
│  IXL MATH UPGRADE (Revenue: ~20% of add-on revenue)              │
│  ├── Trigger: Math content engagement OR parent survey         │
│  ├── Offer: "Toán Mỹ chuẩn IXL - Luyện tập 5 cấp độ"            │
│  └── Bundle: IXL + Premium = 399k (save 49k)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Retention Strategy

### 4.1 Churn Prevention (Vietnam-Specific)

```
┌─────────────────────────────────────────────────────────────────┐
│              CHURN RISK SIGNALS & INTERVENTIONS                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EARLY WARNING (Day 1-7 before likely churn)                    │
│  ├── Signal: No activity for 3 days                               │
│  └── Action: Streak alert notification + Kisu "nhớ bạn"          │
│                                                                  │
│  MEDIUM RISK (Churn probability 40-60%)                        │
│  ├── Signal: 7 days no activity OR support ticket unresolved    │
│  └── Action: Personal outreach (Zalo/WhatsApp) + offer help     │
│                                                                  │
│  HIGH RISK (Churn probability >60%)                              │
│  ├── Signal: 14 days no activity OR failed payment              │
│  └── Action: "We miss you" email + 50% off 1 month offer        │
│                                                                  │
│  CANCELLATION PREVENTION                                         │
│  ├── Trigger: Cancel button click                               │
│  └── Flow:                                                       │
│      1. Exit survey (required)                                  │
│      2. Offer based on reason:                                  │
│         • Too expensive → 50% off 2 months                       │
│         • Child not interested → Content recommender unlock     │
│         • Technical issues → Priority support + 1 month free    │
│         • Not using enough → Pause subscription option          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Win-Back Campaigns

| Segment | Timing | Offer | Channel |
|---------|--------|-------|---------|
| **Quick Win** | Day 3-7 post-cancel | 50% off 1 month | Push + Email |
| **Value Reminder** | Day 14 post-cancel | Free 7-day reactivation | Email |
| **Price Objection** | Day 30 post-cancel | Lite tier trial (14 days) | SMS |
| **Content Refresh** | Day 60 post-cancel | "200 new videos added" | Email |
| **Final Offer** | Day 90 post-cancel | 3 months for price of 2 | Phone call |

### 4.3 Referral Program (Vietnam Cultural Adaptation)

```
┌─────────────────────────────────────────────────────────────────┐
│              REFERRAL PROGRAM: "CÙNG CON HỌC TỐT"               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CULTURAL ADAPTATION PRINCIPLES:                                 │
│  • Vietnamese value education investment highly                  │
│  • Word-of-mouth trusted more than ads                           │
│  • "Con nhà người ta" comparison motivates parents               │
│  • Group/community benefits > individual benefits                │
│                                                                  │
│  REWARD STRUCTURE:                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ REFERRER (Người giới thiệu)                                 ││
│  │ • 1 referral → 1 month free OR 150k discount               ││
│  │ • 3 referrals → 3 months free OR 450k discount             ││
│  │ • 5 referrals → 6 months free + "Phụ huynh Vàng" badge       ││
│  │ • 10 referrals → 1 year free + Premium upgrade             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ REFEREE (Người được giới thiệu)                             ││
│  │ • 50% off first month (any tier)                           ││
│  │ • Free Streak Freeze pack (3x)                             ││
│  │ • Exclusive "Bạn cùng lớp" badge                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  MESSAGING FRAMEWORK (Vietnamese):                               │
│  • Lead with child's benefit, not parent's reward               │
│  • Use "Chia sẻ cơ hội" not "Kiếm tiền"                        │
│  • Social proof: "1,200+ phụ huynh đã giới thiệu thành công"   │
│  • Community angle: "Xây dựng cộng đồng học tập chất lượng"     │
│                                                                  │
│  PLACEMENT:                                                      │
│  • Post-lesson celebration screen                               │
│  • Parent dashboard (prominent)                               │
│  • Weekly report email footer                                   │
│  • Streak milestone celebration                                 │
│                                                                  │
│  REFERRAL CODE FORMAT:                                           │
│  • Pattern: CCT-[PARENT_NAME]-[NUMBER]                          │
│  • Example: CCT-HUONG-123                                       │
│  • Easy to remember and share verbally                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Customer Journey Map

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER JOURNEY                                    │
│                    (K4-12 Education Platform - Vietnam)                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AWARENESS          CONSIDERATION        CONVERSION          RETENTION          │
│                                                                                  │
│  ┌─────────┐        ┌─────────────┐      ┌──────────┐       ┌──────────┐       │
│  │ Facebook│        │ Landing Page│      │ Free Sign│       │ Onboarding│       │
│  │ TikTok  │───────▶│ Video Demo  │─────▶│ Up (L1)  │──────▶│ 7-Day     │       │
│  │ Zalo OA │        │ Curriculum  │      │          │       │ Mission   │       │
│  │         │        │ Showcase    │      │          │       │           │       │
│  └─────────┘        └─────────────┘      └──────────┘       └──────────┘       │
│       │                   │                      │                  │              │
│       ▼                   ▼                      ▼                  ▼              │
│  "Giáo dục    "20k+       "Học thử        "Chào mừng!  "Hoàn thành    │
│   Mỹ chuẩn     videos"    miễn phí"        Khởi động"   bài học 1"     │
│   giá VN"                                                   ↓                  │
│                                                  ┌──────────┐                  │
│                                                  │ Day 3:   │                  │
│                                                  │ 1st      │                  │
│                                                  │ upsell   │                  │
│                                                  │ trigger  │                  │
│                                                  └──────────┘                  │
│                                                       │                          │
│                                                       ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐          │
│  │                        MONETIZATION FUNNEL                        │          │
│  ├──────────────────────────────────────────────────────────────────┤          │
│  │                                                                  │          │
│  │   FREE (100%)                                                    │          │
│  │      │                                                           │          │
│  │      ▼ 8-12% conversion                                          │          │
│  │   LITE (15% of paid)                                             │          │
│  │      │                                                           │          │
│  │      ▼ 35% upgrade in 60 days                                  │          │
│  │   STANDARD (60% of paid) ◄─── Main Revenue Driver                │          │
│  │      │                                                           │          │
│  │      ▼ 15% upgrade in 90 days                                  │          │
│  │   PREMIUM (25% of paid)                                          │          │
│  │                                                                  │          │
│  │   Add-ons: +15-25% ARPU uplift                                   │          │
│  │   Referral: -10-20% acquisition cost                             │          │
│  │   Yearly: +20% upfront cash flow                                 │          │
│  │                                                                  │          │
│  └──────────────────────────────────────────────────────────────────┘          │
│                                                                                  │
│  KEY CONVERSION MOMENTS:                                                         │
│  • Day 3: First upsell after initial engagement                                  │
│  • Day 7: Soft paywall (end of trial period)                                     │
│  • Day 14: Final conversion push with discount                                   │
│  • Day 30: Upgrade prompts based on usage patterns                               │
│  • Day 60: Yearly plan upsell                                                    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. A/B Test Roadmap

### 6.1 Priority Test Queue

| Priority | Test | Hypothesis | Metric | Timeline |
|----------|------|------------|--------|----------|
| **P0** | Pricing anchor | "Standard as recommended" increases Standard uptake by 20% | Tier mix | Week 1-2 |
| **P0** | Yearly discount | 20% vs 25% yearly discount | Yearly %, LTV | Week 3-4 |
| **P1** | Payment method order | MoMo first increases conversion 15% vs VietQR first | Conversion rate | Week 5-6 |
| **P1** | Trial length | 7-day vs 14-day free trial | Activation, conv. | Week 7-8 |
| **P1** | Streak freeze pricing | 29k vs 49k for 3-pack | Add-on attach rate | Week 9-10 |
| **P2** | Referral reward | Cash discount vs free months | Referral rate | Week 11-12 |
| **P2** | Lite pricing | 99k vs 79k vs 149k | Volume, ARPU | Week 13-14 |
| **P2** | Upsell messaging | "Giá rẻ" vs "Giá trị" vs "Con bạn xứng đáng" | Click-through | Week 15-16 |

### 6.2 Test Success Criteria

```
┌─────────────────────────────────────────────────────────────────┐
│              A/B TEST SUCCESS METRICS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRICING TESTS:                                                  │
│  • Winner requires: 95% statistical significance                 │
│  • Minimum 100 conversions per variant                         │
│  • Run for full 2-week cycle (account for weekly patterns)     │
│  • Monitor: Conversion rate, ARPU, Churn (30-day)               │
│                                                                  │
│  MESSAGING TESTS:                                                │
│  • Winner requires: 90% statistical significance                 │
│  • Minimum 500 impressions per variant                         │
│  • Primary: Click-through rate                                   │
│  • Secondary: Conversion rate, Revenue per visitor             │
│                                                                  │
│  STOP CRITERIA (Early termination):                              │
│  • >50% drop in conversion (emergency rollback)                │
│  • >30% increase in churn (value perception damage)            │
│  • Technical issues affecting >5% of users                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. KPI Dashboard

### 7.1 Primary Metrics

| Category | Metric | Target | Measurement |
|----------|--------|--------|-------------|
| **Acquisition** | Trial signups/month | 5,000 | Registration tracking |
| | Paid conversions/month | 400-600 | 8-12% of trials |
| | CAC (Customer Acquisition Cost) | <150,000đ | Total marketing spend / new paid |
| | Referral rate | 5-10% | % of users making ≥1 referral |
| **Revenue** | ARPU (Monthly) | 180,000đ | Total MRR / paying users |
| | ARPPU (Paid user only) | 220,000đ | MRR / active paid users |
| | MRR Growth | 15%/month | Month-over-month |
| | Yearly plan % | 30%+ | Of all paid subscriptions |
| **Retention** | Day 7 retention | 65%+ | % active after 7 days |
| | Day 30 retention | 45%+ | % active after 30 days |
| | Monthly churn | <5% | Cancelled / total paid base |
| | Streak participation | 60%+ | % users with active streak |
| **Engagement** | Lessons completed/user/month | 12+ | Average across all users |
| | Session length | 15+ min | Average per session |
| | Feature adoption (offline) | 30%+ | % paid users downloading |

### 7.2 Tier-Specific KPIs

| Tier | Target % of Revenue | Target ARPU | Upgrade Rate |
|------|---------------------|-------------|--------------|
| **Lite** | 15% | 99,000đ | 35% → Standard in 60 days |
| **Standard** | 55% | 199,000đ | 15% → Premium in 90 days |
| **Premium** | 30% | 349,000đ | N/A (top tier) |

### 7.3 Alert Thresholds

```
┌─────────────────────────────────────────────────────────────────┐
│              ALERT TRIGGER CONFIGURATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔴 CRITICAL ALERTS (Immediate action required)                 │
│  ├── Daily conversion rate drops >30% vs 7-day avg             │
│  ├── Churn rate spikes >8% in any 7-day window                 │
│  ├── Payment failure rate >25%                                 │
│  └── Critical bug affecting >10% of checkout flow              │
│                                                                  │
│  🟡 WARNING ALERTS (Investigate within 24h)                     │
│  ├── Conversion rate drops 15-30%                              │
│  ├── Churn rate 5-8%                                           │
│  ├── Tier mix shifts >10% from target                          │
│  └── Referral participation drops below 3%                     │
│                                                                  │
│  🟢 MONITORING (Weekly review)                                  │
│  ├── Add-on attach rate trends                                 │
│  ├── Payment method mix shifts                                 │
│  ├── Seasonal pattern deviations                               │
│  └── Upsell funnel step drop-offs                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Seasonal Campaigns

### 8.1 Vietnam Education Calendar

| Period | Campaign | Offer | Target |
|--------|----------|-------|--------|
| **Aug-Sep** | "Năm học mới" (New School Year) | 30% off 3 months | New signups |
| **Nov** | "Mid-term boost" | Free IXL Math upgrade | Standard users |
| **Dec-Jan** | "Tết Sớm" (Early Tet) | Gift subscriptions | Gifting |
| **Jan-Feb** | "Tăng tốc học Tết" | Streak freeze bundle | Retention |
| **May-Jun** | "Ôn thi cuối năm" | Summer intensive access | All tiers |
| **Jun-Aug** | "Hè không ngừng học" | 50% off summer months | Churn prevention |

### 8.2 Flash Sale Triggers

| Trigger | Mechanism | Discount | Duration |
|---------|-----------|----------|----------|
| **Streak milestone** | 7, 30, 100 days | 20% off next month | 48 hours |
| **Abandoned cart** | Checkout started, not completed | 15% off | 24 hours |
| **Win-back** | 30 days inactive | 50% off 1 month | 72 hours |
| **Referral milestone** | 1st successful referral | Free month | Instant |

---

## 9. Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)

- [ ] Implement 4-tier pricing in billing system
- [ ] Configure SePay integration (VietQR + bank monitoring)
- [ ] Set up MoMo/ZaloPay payment options
- [ ] Create tier-based feature gates
- [ ] Build upsell trigger system
- [ ] Implement streak protection mechanism

### Phase 2: Conversion (Weeks 3-4)

- [ ] Deploy free trial onboarding (7-day mission)
- [ ] Launch first upsell trigger (Day 3)
- [ ] Enable yearly plan discounts
- [ ] Set up A/B test framework
- [ ] Configure churn risk alerts

### Phase 3: Retention (Weeks 5-6)

- [ ] Launch win-back email campaigns
- [ ] Implement referral program "Cùng con học tốt"
- [ ] Enable add-on purchases
- [ ] Deploy seasonal campaign templates
- [ ] Set up KPI dashboard

### Phase 4: Optimization (Ongoing)

- [ ] Weekly pricing review meetings
- [ ] Monthly cohort analysis
- [ ] Quarterly pricing strategy review
- [ ] Seasonal campaign execution
- [ ] A/B test backlog execution

---

## 10. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Price sensitivity too high** | Medium | High | Ready 99k→79k Lite fallback; bundle strategies |
| **Payment method friction** | Low | High | Multi-gateway redundancy; manual bank transfer backup |
| **Streak mechanic fatigue** | Medium | Medium | Cap daily requirements; alternative engagement paths |
| **Seasonal churn spike** | High | Medium | Pre-Tet engagement campaigns; pause option |
| **Competitor price war** | Low | High | Differentiation on content quality, not price |
| **Technical payment failures** | Low | Critical | Grace periods; manual support process; SePay monitoring |

---

## Appendix A: Pricing Calculator

### Monthly Revenue Projection (Month 6 Target)

```
Assumptions:
- 5,000 active users
- 10% paid conversion = 500 paid users
- Tier mix: 15% Lite, 60% Standard, 25% Premium
- Add-on ARPU: +20,000đ average

Calculation:
Lite:       75 users × 99k    = 7,425,000đ
Standard:  300 users × 199k   = 59,700,000đ
Premium:   125 users × 349k   = 43,625,000đ
Add-ons:   500 users × 20k    = 10,000,000đ
─────────────────────────────────────────────
Monthly Revenue:                 120,750,000đ
Annual Run Rate:              1,449,000,000đ
```

---

## Appendix B: Competitor Price Benchmarks

| Competitor | Price Point | Positioning |
|------------|-------------|-------------|
| **Vuihoc.vn** | 150k-300k/month | Local curriculum focus |
| **ViettelStudy** | 99k-199k/month | Telecom bundle advantage |
| **Toppy** | 199k-399k/month | Live tutoring emphasis |
| **Monkey Junior** | 299k-599k/year | Gamification leader |
| **Cung Con Tu Hoc** | 99k-349k/month | **US standard advantage** |

**Positioning:** Giá cạnh tranh, chất lượng Mỹ (Competitive price, US quality)

---

## Appendix C: Vietnamese Messaging Framework

### Tone Guidelines
- **Respectful:** Acknowledge parent dedication
- **Aspirational:** "Con bạn xứng đáng" (Your child deserves)
- **Community-oriented:** "Cùng nhau" (Together)
- **Value-focused:** "Đầu tư" (Investment) not "Chi phí" (Cost)

### Key Phrases
| English | Vietnamese | Usage |
|---------|------------|-------|
| Upgrade | Nâng cấp | Upsell CTAs |
| Save | Tiết kiệm | Discount messaging |
| Unlock | Mở khóa | Feature gating |
| Protect streak | Bảo vệ chuỗi | Gamification |
| Less than coffee | Chỉ bằng 1 ly cà phê | Price anchoring |
| Your amazing child | Con bạn tuyệt vời | Parent motivation |

---

**Document Owner:** Business Strategy Team  
**Review Cycle:** Monthly  
**Next Review:** May 2026
