# Asset Inventory for Monetization

**Project:** TinyGenius Hub ("Learning Together")  
**Analysis Date:** 2026-04-04  
**Platform:** Educational Learning Journey OS for Children (Age 2-6)  
**Primary Market:** Vietnam, Singapore (expansion ready)

---

## Executive Summary

This inventory identifies **47 monetizable assets** across 7 categories with an estimated total revenue potential ranking from **immediate (P0)** to **long-term strategic (P3)**. The platform's strongest monetization levers are its proprietary Abeka video content (20,195 videos), curriculum system, and established user base with billing infrastructure.

---

## Table of Contents

1. [Video Content Assets](#1-video-content-assets)
2. [Curriculum & Learning System](#2-curriculum--learning-system)
3. [Gamification Assets](#3-gamification-assets)
4. [User Base & Data Assets](#4-user-base--data-assets)
5. [Technology & Platform Assets](#5-technology--platform-assets)
6. [Standalone Content Products](#6-standalone-content-products)
7. [B2B Opportunities](#7-b2b-opportunities)
8. [Asset Value Matrix](#8-asset-value-matrix)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Video Content Assets

### 1.1 Abeka Video Library (Core Asset)
| Attribute | Value |
|-----------|-------|
| **Total Videos** | 20,195 |
| **Grade Coverage** | K4 (Kindergarten 4) through Grade 12 |
| **Subjects** | 19 subjects (Phonics, Math, Science, Bible, etc.) |
| **Format** | HLS/m3u8 streaming via CDN |
| **Content Status** | Published with full metadata |

**Monetization Methods:**
1. **Tiered Access** (Immediate)
   - Free tier: 10% sample (≈2,000 videos)
   - Standard: K4-G5 access (≈8,500 videos) - 99K VND/month
   - Premium: K4-G12 full library - 199K VND/month
   - Revenue Potential: **HIGH** - Direct subscription upgrade driver

2. **Per-Subject Unlock** (Medium effort)
   - Individual subject purchases (e.g., Phonics only: 49K VND/month)
   - Revenue Potential: **MEDIUM** - Captures niche demand

3. **Offline Download Rights** (Medium effort)
   - Premium tier benefit for mobile learning
   - Revenue Potential: **MEDIUM** - Differentiator feature

4. **B2B Licensing** (High effort)
   - License to schools, tutoring centers
   - White-label option for educational institutions
   - Revenue Potential: **VERY HIGH** - Volume licensing

**Effort Required:** Low (content already organized and delivered)  
**Revenue Ranking:** ⭐⭐⭐⭐⭐ (5/5 - Core revenue driver)

### 1.2 Content Value Metrics
| Metric | Value | Monetization Implication |
|--------|-------|-------------------------|
| Total curriculum hours | ~3,400 hours | High switching cost for users |
| Unique lesson packages | ~3,230 | Granular upsell opportunities |
| Grade transitions | 15 levels | Natural upgrade triggers |
| Subject diversity | 19 subjects | Cross-selling opportunities |

---

## 2. Curriculum & Learning System

### 2.1 5-Level Hierarchy System
```
Track (English/Math/Habit) 
  → Level (Grade band)
    → Unit (Thematic module)
      → Lesson (Daily learning)
        → Activity (Interactive)
```

**Monetization Methods:**
1. **Adaptive Learning Premium** (Medium effort)
   - AI-driven personalized learning paths
   - Current: `adaptiveEnabled` flag exists in schema
   - Revenue Potential: **HIGH** - Premium feature worth 30-50% price premium

2. **Learning Path Consulting** (Medium effort)
   - Expert-curated custom journeys
   - Premium consulting service for parents
   - Revenue Potential: **MEDIUM** - High margin service

3. **Progress Analytics Dashboard** (Low effort)
   - Deep analytics for parents (currently basic)
   - "Parent Insights Pro" tier
   - Revenue Potential: **MEDIUM** - Data-driven upsell

### 2.2 Learning Journey System
| Component | Status | Monetization |
|-----------|--------|--------------|
| Weekly Plans | Implemented | Premium scheduling feature |
| Daily Plans | Implemented | Could be premium for >5 children |
| Assignment System | Implemented | Base feature |
| Skill Tree | Implemented | Gamification unlock |
| Streak Freeze | Implemented | Microtransaction opportunity |

**Monetization Ranking:** ⭐⭐⭐⭐ (4/5 - Strong retention driver)

---

## 3. Gamification Assets

### 3.1 Kisu Mascot & Visual Identity
| Asset | Description | Monetization |
|-------|-------------|--------------|
| Kisu Character | Proprietary mascot | Merchandise, licensing |
| Badge System | 20+ achievement badges | Collectible NFT option |
| Streak System | Daily engagement tracking | Streak protection purchases |
| Skill Tree | Visual progress map | Premium visualization |

**Monetization Methods:**

1. **Virtual Goods Store** (Medium effort)
   - Avatar customization for children
   - Virtual stickers, badges
   - Theme packs for UI
   - Revenue Potential: **MEDIUM** - Microtransactions (5K-20K VND/item)

2. **Streak Protection** (Low effort)
   - "Freeze" tokens for missed days
   - Schema already supports: `freezeCount`, `freezeUsedDate`
   - Revenue Potential: **MEDIUM** - Recurring micro-purchase

3. **Premium Badges** (Low effort)
   - Exclusive animated badges
   - Limited edition seasonal badges
   - Revenue Potential: **LOW-MEDIUM** - Cosmetic monetization

4. **Real-World Rewards** (High effort)
   - Partnership with toy stores
   - Physical Kisu merchandise
   - Revenue Potential: **MEDIUM** - Requires fulfillment infrastructure

### 3.2 Achievement System Inventory
| Achievement Type | Count | Monetization Angle |
|-----------------|-------|-------------------|
| Streak badges | 7 (7, 14, 30, 60, 90, 180, 365 days) | Premium animated versions |
| Lesson completion | 5 tiers | Accelerated progress boosts |
| Subject mastery | 19 subjects | Subject-specific rewards |
| Time-based | 4 tiers | Premium time-tracking features |
| Secret badges | Variable | Discovery mechanics |

**Gamification Revenue Ranking:** ⭐⭐⭐ (3/5 - Engagement driver, indirect revenue)

---

## 4. User Base & Data Assets

### 4.1 User Database Value
| Metric | Schema Support | Monetization Value |
|--------|---------------|-------------------|
| Parent accounts | Full auth + preferences | High LTV potential |
| Child profiles | Progress tracking + metadata | Segmentation goldmine |
| Enrollment data | Course + subscription history | Predictive analytics |
| Learning patterns | Watch progress + completion | Content optimization |
| Caregiver invites | Social graph data | Viral coefficient improvement |

**Monetization Methods:**

1. **Data Insights (Anonymized)** (High effort)
   - Market research reports on early childhood learning trends
   - Sell to publishers, toy manufacturers, educators
   - Revenue Potential: **MEDIUM** - Requires compliance/legal review

2. **Lookalike Audience Licensing** (Medium effort)
   - Partner with family-focused brands for targeted advertising
   - Revenue Potential: **MEDIUM** - Privacy-sensitive

3. **Referral Program Premium** (Low effort)
   - Current: Basic referral system exists
   - Upgrade: Cash rewards, subscription extensions
   - Revenue Potential: **HIGH** - Lower CAC through viral growth

### 4.2 Account Structure Tiers
| Plan | Child Limit | Caregiver Limit | Retention | Price |
|------|-------------|-----------------|-----------|-------|
| Trial | 1 | 0 | 7 days | Free |
| Monthly | 3 | 2 | 90 days | 99K VND |
| Yearly Standard | 3 | 2 | 90 days | 799K VND |
| Family+ | 5 | 4 | 365 days | 1,199K VND |

**Expansion Opportunity:** Add "School Plan" tier (20 children, 10 caregivers) at 3,999K VND/year

**User Base Ranking:** ⭐⭐⭐⭐ (4/5 - High value, needs careful monetization)

---

## 5. Technology & Platform Assets

### 5.1 Platform Infrastructure
| Component | Technology | Monetization Potential |
|-----------|-----------|----------------------|
| Next.js App | Next.js 16 + React 19 | SaaS licensing |
| Admin Dashboard | Full-featured | Multi-tenant SaaS |
| Billing System | Stripe + PayOS | Payment infrastructure as service |
| Video Delivery | HLS/m3u8 + CDN | Video platform as service |
| Queue System | BullMQ + Redis | Background job service |
| Analytics | Custom + GA4 | Analytics as service |

### 5.2 Admin Dashboard Features
The admin dashboard (`/admin`) includes:
- User management
- Payment analytics
- Content management
- Funnel analytics
- Cohort analysis
- Revenue reporting
- Security controls

**Monetization Methods:**

1. **Platform-as-a-Service (PaaS)** (High effort)
   - White-label platform for other educators
   - Multi-tenant architecture
   - Revenue Potential: **VERY HIGH** - B2B SaaS model ($500-2000/month per tenant)

2. **API Access** (Medium effort)
   - Developer API for third-party integrations
   - Rate-limited tiers
   - Revenue Potential: **MEDIUM** - Developer ecosystem

3. **Custom Deployment Service** (Medium effort)
   - Install platform for schools/centers
   - Setup + maintenance fee
   - Revenue Potential: **MEDIUM** - Service revenue

### 5.3 Course System Features
| Feature | Status | Monetization |
|---------|--------|--------------|
| Course marketplace | Implemented | Transaction fees (5-15%) |
| Certificate generation | Implemented | Premium certificates |
| Review system | Implemented | Featured placement |
| Gift codes | Implemented | Corporate gifting |
| Trial system | Implemented | Conversion optimization |
| Bundle pricing | Implemented | Volume discounts |

**Tech Asset Ranking:** ⭐⭐⭐⭐ (4/5 - Strong foundation for B2B)

---

## 6. Standalone Content Products

### 6.1 Downloadable Products
| Product | Format | Price Point | Effort |
|---------|--------|-------------|--------|
| Printable worksheets | PDF | 29K-49K VND/pack | Low |
| Lesson plan guides | PDF + Video | 99K-199K VND | Low |
| Assessment workbooks | PDF + Digital | 49K-99K VND | Low |
| Parent guides | eBook | 79K-149K VND | Low |
| Audio stories | MP3 | 39K-79K VND | Low |
| Flashcard sets | Printable | 29K-59K VND | Low |

### 6.2 Physical Product Opportunities
| Product | Partnership | Margin | Effort |
|---------|-------------|--------|--------|
| Kisu plush toy | Manufacturing | 40% | High |
| Workbook series | Publisher | 15-25% | Medium |
| Branded stationery | OEM | 30% | Medium |
| Educational games | Game publisher | 10-20% | Medium |
| Merchandise (t-shirts, bags) | Print-on-demand | 25-35% | Low |

**Standalone Products Ranking:** ⭐⭐⭐ (3/5 - Incremental revenue)

---

## 7. B2B Opportunities

### 7.1 School/Institution Partnerships
| Offering | Target | Pricing | Timeline |
|----------|--------|---------|----------|
| Site license (per student) | Private schools | 50K-100K VND/student/year | Immediate |
| District-wide deployment | School districts | Custom quote | 3-6 months |
| Curriculum integration | Int'l schools | 200K-500K VND/student/year | 6-12 months |
| Teacher training | Any school | 2M-5M VND/session | Immediate |

### 7.2 Corporate Partnerships
| Partnership Type | Value Prop | Revenue Model |
|-----------------|------------|---------------|
| Employee benefit | Learning subsidy for employees | Bulk licensing |
| CSR programs | Sponsor underprivileged children | Sponsorship + brand association |
| Co-branded content | Joint curriculum development | Revenue share |
| Insurance tie-in | Child development coverage riders | Referral fees |

### 7.3 Publisher/Content Partnerships
| Partner Type | Opportunity | Revenue |
|--------------|-------------|---------|
| Textbook publishers | Digital companion content | Licensing fees |
| EdTech platforms | API/content integration | Integration fees + revenue share |
| Assessment providers | Test prep content | Content licensing |
| Video platforms | Exclusive content deals | Minimum guarantees |

**B2B Ranking:** ⭐⭐⭐⭐⭐ (5/5 - Highest revenue ceiling)

---

## 8. Asset Value Matrix

### 8.1 Immediate Monetization (P0 - Launch in 0-30 days)
| Asset | Method | Revenue Potential | Effort | Priority |
|-------|--------|------------------|--------|----------|
| Abeka videos | Current subscription tiers | ⭐⭐⭐⭐⭐ | Low | #1 |
| Course marketplace | Transaction fees | ⭐⭐⭐⭐ | Low | #2 |
| Streak freeze | Microtransaction | ⭐⭐⭐ | Low | #3 |
| Gift codes | Corporate sales | ⭐⭐⭐ | Low | #4 |

### 8.2 Short-Term Monetization (P1 - Launch in 1-3 months)
| Asset | Method | Revenue Potential | Effort | Priority |
|-------|--------|------------------|--------|----------|
| Per-subject pricing | Granular access | ⭐⭐⭐⭐ | Medium | #5 |
| Premium analytics | Parent insights | ⭐⭐⭐ | Medium | #6 |
| Referral rewards | Cash/extend subs | ⭐⭐⭐⭐ | Low | #7 |
| Printable content | Digital sales | ⭐⭐⭐ | Low | #8 |
| Avatar store | Virtual goods | ⭐⭐⭐ | Medium | #9 |

### 8.3 Medium-Term Monetization (P2 - Launch in 3-6 months)
| Asset | Method | Revenue Potential | Effort | Priority |
|-------|--------|------------------|--------|----------|
| School licenses | B2B bulk pricing | ⭐⭐⭐⭐⭐ | High | #10 |
| Adaptive learning AI | Premium feature | ⭐⭐⭐⭐ | High | #11 |
| Offline downloads | Premium perk | ⭐⭐⭐ | Medium | #12 |
| Physical merchandise | Kisu products | ⭐⭐⭐ | High | #13 |
| API platform | Developer access | ⭐⭐⭐⭐ | High | #14 |

### 8.4 Long-Term Strategic (P3 - Launch in 6-12 months)
| Asset | Method | Revenue Potential | Effort | Priority |
|-------|--------|------------------|--------|----------|
| PaaS white-label | Multi-tenant SaaS | ⭐⭐⭐⭐⭐ | Very High | #15 |
| Data insights | Market research | ⭐⭐⭐ | High | #16 |
| Corporate partnerships | B2B2C | ⭐⭐⭐⭐⭐ | High | #17 |
| International expansion | Regional licensing | ⭐⭐⭐⭐⭐ | Very High | #18 |

---

## 9. Implementation Roadmap

### Phase 1: Quick Wins (Month 1)
- [ ] Optimize current subscription tiers based on conversion data
- [ ] Launch streak freeze microtransaction
- [ ] Enable gift code bulk purchase flow
- [ ] Add per-subject access option

**Expected Revenue Impact:** +15-25% ARPU

### Phase 2: Premium Features (Month 2-3)
- [ ] Launch "Parent Insights Pro" analytics dashboard
- [ ] Implement virtual goods store (avatars, themes)
- [ ] Create printable content marketplace
- [ ] Upgrade referral program with cash rewards

**Expected Revenue Impact:** +20-30% ARPU

### Phase 3: B2B Foundation (Month 3-6)
- [ ] Build school/institution onboarding flow
- [ ] Create multi-seat management dashboard
- [ ] Implement site licensing system
- [ ] Develop teacher training program

**Expected Revenue Impact:** +50-100% total revenue (new segment)

### Phase 4: Platform Expansion (Month 6-12)
- [ ] Launch adaptive learning AI
- [ ] Build API platform for developers
- [ ] Create white-label deployment option
- [ ] Expand to Singapore/ASEAN markets

**Expected Revenue Impact:** +100-300% total revenue (scale)

---

## 10. Key Recommendations

### 10.1 Immediate Actions (This Week)
1. **Audit video access patterns** - Identify which content drives conversions
2. **A/B test pricing** - Test 79K vs 99K monthly to find optimal price
3. **Enable streak freeze** - Quick microtransaction win already in schema
4. **Prepare gift code campaign** - Target corporate HR departments

### 10.2 Strategic Priorities (This Month)
1. **Define B2B pricing** - Create school/institution pricing tiers
2. **Build virtual store MVP** - Start with 5-10 avatar options
3. **Design parent analytics** - Identify 3-5 key premium metrics
4. **Plan referral upgrade** - Define reward structure (cash vs subscription extension)

### 10.3 Long-Term Bets (This Quarter)
1. **Adaptive learning R&D** - Allocate resources to personalization engine
2. **PaaS architecture** - Design multi-tenant capabilities
3. **B2B sales team** - Hire 1-2 reps focused on school partnerships
4. **International compliance** - Prepare GDPR/privacy frameworks for expansion

---

## Appendix A: Asset Inventory Summary

| Category | Asset Count | Immediate Value | Strategic Value |
|----------|-------------|-----------------|-----------------|
| Video Content | 1 major + 3 bundle | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Curriculum System | 5 levels + 19 subjects | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Gamification | 7 systems | ⭐⭐⭐ | ⭐⭐⭐ |
| User Base | Multi-tier accounts | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Technology | Full-stack platform | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Content Products | 6+ product types | ⭐⭐⭐ | ⭐⭐⭐ |
| B2B Opportunities | 3 verticals | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **TOTAL** | **47 assets** | **High** | **Very High** |

---

## Appendix B: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Content licensing restrictions | HIGH | Audit all Abeka licensing terms |
| Privacy regulations | MEDIUM | GDPR/privacy compliance review |
| B2B sales cycle | MEDIUM | Pilot with 3-5 schools first |
| Technical debt for PaaS | HIGH | Architecture review before multi-tenant |
| Competition from free alternatives | MEDIUM | Differentiate on curriculum quality |

---

## Document Control

- **Created:** 2026-04-04
- **Author:** OpenCode Analysis Agent
- **Version:** 1.0
- **Review Cycle:** Quarterly
- **Next Review:** 2026-07-04

---

*This inventory is a living document. As the platform evolves and new assets are identified, this document should be updated to reflect current monetization opportunities.*
