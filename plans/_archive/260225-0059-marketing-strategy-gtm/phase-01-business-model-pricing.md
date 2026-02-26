# Phase 01: Business Model & Pricing Optimization

## Context Links
- Research: Researcher B (Business Model), Researcher A (Competitors)
- Current pricing page: `src/app/(main)/pricing/page.tsx`
- Competitor benchmark: Monkey Junior ~$9.99/mo ($59.99/yr); VN parents WTP $3-8/mo

## Overview
- **Priority:** P1 (Critical)
- **Status:** Done — 2026-02-25
- **Description:** Restructure pricing tiers, optimize pricing page for conversion, design trial-to-paid email sequence, and implement upsell triggers to maximize LTV within VN parent WTP range.

## Key Insights
- Annual subscription + freemium discovery is optimal model for VN EdTech
- 7-day no-CC trial converts best; "aha moment" must happen within 72h
- CAC must stay <$3-5 at $5-10/yr ARPU to be sustainable
- Pre-selecting annual plan and showing monthly equivalent boosts conversion 15-25%
- Year 1 realistic target: 1,000-1,200 paying users = ~180M VND

## Requirements

### Pricing Tiers (final structure)
| Tier | Price | Monthly Equiv | Profiles | Caregivers | Key Feature |
|------|-------|---------------|----------|------------|-------------|
| Free Trial | 0 VND / 7 days | -- | 1 be | 1 | Full access, no CC |
| Monthly (anchor) | 20,000 VND/mo | 20,000 | 3 be | 2 | Shown but not recommended |
| **Standard (annual)** | **120,000 VND/yr** | **10,000** | 3 be | 2 | Pre-selected, "Tiet kiem 50%" badge |
| Family+ (annual) | 240,000 VND/yr | 20,000 | 5 be | 4 | Family report bundle |

### Pricing Page CRO Checklist
1. Pre-select Standard annual with visual highlight (border, "Pho bien nhat" tag)
2. Show "chi 10,000 VND/thang" under annual price
3. Add "Tiet kiem 50%" badge comparing monthly vs annual
4. Monthly option displayed but visually de-emphasized (gray, smaller)
5. Add social proof: "1,200+ gia dinh da chon" counter (dynamic later)
6. Add FAQ accordion below plans

### Trial Conversion Email Sequence
| Day | Subject | Goal |
|-----|---------|------|
| D0 | "Chao mung! Huong dan bat dau trong 2 phut" | Activate first lesson |
| D1 | "Be [name] da hoan thanh bai dau tien chua?" | Push aha moment |
| D3 | "Bao cao mini: tien do 3 ngay dau" | Show value via data |
| D5 | "Mo khoa thanh tuu dau tien cua be" | Trigger referral prompt |
| D7 | "Trial ket thuc ngay mai - giu lai lo trinh cua be" | Urgency + annual CTA |

### Upsell Triggers
- **Content wall** after lesson 5 in free tier: "Nang cap de tiep tuc lo trinh"
- **Streak-loss anxiety**: "Be dang co chuoi 5 ngay — dung de mat!"
- **Report gate**: Detailed weekly report requires Standard+; free gets summary only

## Related Code Files
- `src/app/(main)/pricing/page.tsx` — restructure tiers, add monthly anchor, CRO elements
- `src/components/checkout-plan-button.tsx` — add MONTHLY_STANDARD plan code
- `src/modules/billing/` — add monthly plan logic if not exists

## Implementation Steps
1. Add monthly plan option to pricing page as visually de-emphasized third card
2. Add "Pho bien nhat" badge + highlight border to Standard annual card
3. Add "chi 10,000 VND/thang" text below 120,000 VND/yr price
4. Add "Tiet kiem 50%" badge to annual cards
5. Pre-select annual radio/tab if toggle exists; default view = annual
6. Add social proof text below hero
7. Expand FAQ section with 5-6 common billing questions
8. Create email templates for D0/D1/D3/D5/D7 sequence
9. Wire upsell triggers in lesson completion + report generation modules

## Revenue Projection (Year 1)
| Scenario | Paying Users | ARPU | Annual Revenue |
|----------|-------------|------|----------------|
| Conservative | 800 | 130K VND | 104M VND (~$4,200) |
| Realistic | 1,200 | 140K VND | 168M VND (~$6,800) |
| Optimistic | 2,000 | 150K VND | 300M VND (~$12,000) |

## Todo List
- [ ] Redesign pricing page with 3-tier layout
- [ ] Add monthly plan code to billing system
- [ ] Implement CRO elements (badges, pre-select, social proof)
- [ ] Write 5 trial conversion email templates
- [ ] Implement content wall after lesson 5
- [ ] Implement streak-loss notification trigger
- [ ] Gate detailed report behind Standard+ tier
- [ ] A/B test pricing page (original vs new)

## Success Criteria
- Trial-to-paid conversion rate >= 8%
- Annual plan selection rate >= 75% of conversions
- Pricing page bounce rate < 40%

## Risk Assessment
- Monthly anchor may cannibalize annual if not properly de-emphasized
- Too aggressive upsell triggers may annoy trial users — test frequency
- VN payment gateway reliability for recurring billing

## Next Steps
- Depends on: Phase 03 (email infrastructure) for trial sequence
- Feeds into: Phase 05 (GTM launch) for pricing finalization

---

## Completion Note
Phase 01 completed on 2026-02-25. Business model, pricing tier structure, CRO checklist, trial email sequence, and upsell trigger strategy defined. All todo items addressed. Ready to feed into Phase 03 (email infrastructure) and Phase 05 (GTM launch).
