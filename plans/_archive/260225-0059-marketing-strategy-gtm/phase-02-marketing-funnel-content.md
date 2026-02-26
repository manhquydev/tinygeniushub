# Phase 02: Marketing Funnel & Content Strategy

## Context Links
- Research: Researcher C (Channels), Researcher A (Competitors)
- Channel priority: P0 = Facebook Groups + TikTok; Zalo OA = 85-90% open rate
- KOL strategy: 20-30 nano/micro KOLs ($1,500-3,000/mo) > 1 macro KOL

## Overview
- **Priority:** P1 (Critical)
- **Status:** Pending
- **Description:** Build full marketing funnel from awareness to referral, create 30-day content calendar, establish channel priority matrix, prepare KOL outreach templates, and set up Zalo OA.

## Key Insights
- Facebook parenting groups = highest intent channel for VN parents
- TikTok 15-30s "be hoc tieng Anh" clips drive massive awareness cheaply
- SEO long-tails like "app tieng Anh cho be 3 tuoi" are quick wins (low competition)
- Zalo OA ZNS messages get 85-90% open rate vs 20% email in VN
- Nano/micro KOL portfolio outperforms single macro KOL by 3-5x on engagement

## Full Funnel Map

```
AWARENESS              INTEREST               TRIAL                PAID                 REFERRAL
TikTok clips ──────┐
SEO blog posts ────┤   Facebook group ────┐
Facebook ads ──────┘   Demo video         ├── Homepage CTA ──── Onboarding ──── Weekly report
                       Zalo OA content ───┘   /auth/signup       D0-D7 emails    share button
                                                                  "Aha" by D3     ──── loop back
```

## Channel Priority Matrix
| Channel | Impact | Effort | Cost | Priority | Metric |
|---------|--------|--------|------|----------|--------|
| Facebook Groups | High | Medium | Free | P0 | Clicks to trial |
| TikTok organic | High | Medium | Free | P0 | Views, profile visits |
| Zalo OA + ZNS | High | Low | ~$50/mo | P0 | Open rate, trial starts |
| SEO blog | Medium | Medium | Free | P1 | Organic traffic |
| KOL nano/micro | High | High | $1.5-3K/mo | P1 | Referral signups |
| YouTube shorts | Medium | Medium | Free | P2 | Subscribers |
| Facebook Ads | Medium | Low | $100-300/mo | P2 | CPA, ROAS |

## 30-Day Content Calendar (Summary)

### Blog Posts (4 articles)
1. W1: "5 dau hieu be san sang hoc tieng Anh (3-5 tuoi)" — SEO target
2. W2: "So sanh app hoc tieng Anh cho be 2026" — comparison, include CCTH
3. W3: "Lam sao de be hoc 15 phut moi ngay ma khong chan?" — engagement tips
4. W4: "Bao cao tien do con — tai sao phu huynh can theo doi?" — product-led

### TikTok Videos (12 clips, 3/week)
- Format A (4x): "Be 4 tuoi noi tieng Anh sau 30 ngay" — before/after
- Format B (4x): "1 phut — trick day be tu vung moi" — educational
- Format C (4x): "Phu huynh react khi xem bao cao tuan" — social proof

### Facebook Group Posts (8 posts, 2/week)
- Mix of: parenting tips (3), product soft-launch (2), Q&A (2), testimonial (1)
- Target groups: Hoi Phu Huynh Tre, Day Con Song Ngu, Mom & Baby VN

### Docs to Create
- `docs/marketing/content-calendar-30day.md` — full detailed calendar
- `docs/marketing/kol-outreach-template.md` — Vietnamese outreach scripts

## KOL Outreach Strategy
- **Target:** 20-30 nano KOLs (5K-50K followers) in parenting/education niche
- **Platform:** TikTok + Facebook
- **Compensation:** Free annual account + 50-100K VND/post or revenue share
- **Template (Vietnamese):** See `docs/marketing/kol-outreach-template.md`
- **Tracking:** Unique referral code per KOL, track in referral system

## Zalo OA Setup Checklist
- [ ] Register Zalo Official Account (business verification)
- [ ] Set up ZNS templates (welcome, weekly digest, trial expiry)
- [ ] Connect Zalo OA to CRM/user database
- [ ] Create auto-reply flows for common questions
- [ ] Set up broadcast segments (trial users, paid users, churned)

## Related Code Files
- `src/app/(main)/blog/page.tsx` — blog listing for SEO content
- `src/modules/blog/blog-seo.ts` — SEO metadata generation
- `src/app/sitemap.ts` — ensure blog posts included

## Implementation Steps
1. Create `docs/marketing/content-calendar-30day.md` with full 30-day plan
2. Create `docs/marketing/kol-outreach-template.md` with VN templates
3. Write first 2 blog posts targeting SEO long-tail keywords
4. Record first 3 TikTok clips (screen capture + voiceover format)
5. Join 10 target Facebook parenting groups, begin organic posting
6. Register Zalo OA and submit for business verification
7. Set up ZNS message templates (3 templates)
8. Outreach to first batch of 10 nano KOLs
9. Set up UTM tracking for all channel links

## Todo List
- [ ] Create 30-day content calendar doc
- [ ] Create KOL outreach template doc
- [ ] Write 4 SEO blog posts
- [ ] Produce 12 TikTok clips
- [ ] Draft 8 Facebook group posts
- [ ] Register Zalo OA
- [ ] Set up ZNS templates
- [ ] Contact first 10 KOLs
- [ ] Set up UTM tracking spreadsheet

## Success Criteria
- 10,000+ organic impressions in first 30 days across all channels
- 500+ trial signups from content-driven sources in 90 days
- 5+ active KOL partnerships producing content
- Zalo OA verified and sending ZNS with >80% open rate

## Risk Assessment
- Facebook group admins may block promotional posts — lead with value, not product
- TikTok algorithm unpredictable — volume (3/week) mitigates variance
- KOL quality varies — start small batch, measure before scaling

## Next Steps
- Depends on: Phase 01 (pricing finalized for CTA links)
- Feeds into: Phase 04 (content generates shareable moments)
- Parallel with: Phase 03 (technical tracking for attribution)
