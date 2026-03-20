# Phase 03: Technical Marketing Infrastructure

## Context Links
- Research: Researcher C (Channels), Researcher B (Business Model)
- Layout file: `src/app/layout.tsx`
- Email service: `src/modules/reports/weekly-report-service.ts`
- SEO long-tails: "app tieng Anh cho be 3 tuoi" = quick wins

## Overview
- **Priority:** P1 (Critical)
- **Status:** Done — 2026-02-25
- **Description:** Implement GA4 + Meta Pixel tracking, build 5 email sequences for lifecycle marketing, and create blog SEO content plan targeting VN parent search queries.

## Key Insights
- GA4 conversion events enable data-driven funnel optimization
- Meta Pixel is essential for retargeting trial users who didn't convert
- Email open rates in VN ~20% (supplement with Zalo ZNS from Phase 02)
- Age-specific SEO keywords have low competition, high parent intent
- Weekly report email = highest-engagement touchpoint (leverage for viral)

## Requirements

### GA4 Integration
Add to `src/app/layout.tsx` via `next/script`:
```
Events to track:
- page_view (automatic)
- trial_start (on signup completion)
- lesson_complete (on lesson finish)
- report_viewed (on weekly report open)
- report_shared (on share button click)
- purchase (on checkout success)
- referral_sent (on referral link share)
```

### Meta Pixel Integration
Add to `src/app/layout.tsx` via `next/script`:
```
Events to track:
- PageView (automatic on all pages)
- Lead (on trial signup)
- StartTrial (on first lesson start)
- Purchase (on checkout success, with value + currency)
- CompleteRegistration (on profile setup)
```

### Email Sequences (5 lifecycle flows)

**Sequence 1: Welcome (Day 0)**
- Subject: "Chao mung den Cung Con Tu Hoc!"
- Content: Account setup guide, first lesson CTA, what to expect in 7 days
- Trigger: Account creation

**Sequence 2: Nudge (Day 3)**
- Subject: "Be [name] chua hoan thanh bai hoc hom nay"
- Content: Progress mini-report, encouragement, lesson link
- Trigger: No activity in 48h OR Day 3 auto

**Sequence 3: Trial Expiry (Day 6)**
- Subject: "Con 24h — giu lai lo trinh cua [child_name]"
- Content: Urgency, social proof ("1,200 gia dinh da chon"), annual pricing CTA
- Trigger: Day 6 of trial

**Sequence 4: Weekly Digest (ongoing)**
- Subject: "Bao cao tuan cua [child_name] — [date_range]"
- Content: Personalized progress, streak count, next milestone, share button
- Trigger: Weekly cron (already exists in weekly-report-service.ts)

**Sequence 5: Winback (Day 30 post-churn)**
- Subject: "Be [name] co muon tiep tuc khong?"
- Content: Re-engagement offer (7 ngay mien phi), progress reminder
- Trigger: 30 days after subscription lapse

### Blog SEO Content Plan (10 articles)
| # | Target Keyword | Search Vol | Difficulty | Article Title |
|---|---------------|-----------|------------|---------------|
| 1 | app tieng anh cho be 3 tuoi | 1.2K | Low | "Top 5 app tieng Anh cho be 3 tuoi 2026" |
| 2 | day be hoc tieng anh tai nha | 880 | Low | "Huong dan day be hoc tieng Anh tai nha" |
| 3 | be may tuoi nen hoc tieng anh | 720 | Low | "Be may tuoi nen bat dau hoc tieng Anh?" |
| 4 | app hoc toan cho be | 590 | Low | "App hoc toan cho be mam non — so sanh 2026" |
| 5 | tre cham noi nen lam gi | 1.5K | Med | "Tre cham noi — khi nao can lo lang?" |
| 6 | phuong phap montessori tai nha | 480 | Med | "Ap dung Montessori tai nha cho be 2-5 tuoi" |
| 7 | lich hoc cho be 3 tuoi | 320 | Low | "Lich hoc mau cho be 3 tuoi — 15 phut/ngay" |
| 8 | bao cao hoc tap cua be | 210 | Low | "Tai sao phu huynh can bao cao hoc tap hang tuan?" |
| 9 | game hoc chu cai cho be | 650 | Low | "Game hoc chu cai tieng Viet cho be mam non" |
| 10 | so sanh monkey junior | 390 | Low | "Cung Con Tu Hoc vs Monkey Junior — khac biet gi?" |

## Related Code Files
- `src/app/layout.tsx` — GA4 + Meta Pixel script injection
- `src/modules/reports/weekly-report-service.ts` — enhance with share CTA
- `src/modules/reports/email-delivery-service.ts` — create if not exists
- `src/app/(main)/blog/page.tsx` — blog listing
- `src/modules/blog/blog-seo.ts` — SEO metadata

## Docs to Create
- `docs/marketing/email-sequences.md` — full email copy + triggers
- `docs/marketing/blog-content-plan.md` — 10-article SEO plan with briefs

## Implementation Steps
1. Add GA4 gtag script to `src/app/layout.tsx` using `next/script` strategy="afterInteractive"
2. Add Meta Pixel base code to `src/app/layout.tsx` using `next/script`
3. Create `src/lib/analytics/track-event.ts` utility for firing custom events
4. Add `trial_start` event to signup flow
5. Add `purchase` event to checkout success callback
6. Add `report_shared` event to share button (Phase 04)
7. Create `src/modules/email/email-sequence-service.ts` for lifecycle emails
8. Implement D0/D3/D6 email templates with personalization tokens
9. Implement D30 winback email with conditional offer logic
10. Create `docs/marketing/email-sequences.md` with full copy
11. Create `docs/marketing/blog-content-plan.md` with 10 article briefs
12. Write first 3 SEO articles and publish to blog

## Todo List
- [ ] Add GA4 to layout.tsx
- [ ] Add Meta Pixel to layout.tsx
- [ ] Create track-event.ts utility
- [ ] Wire conversion events (trial_start, purchase, report_shared)
- [ ] Create email sequence service
- [ ] Write 5 email templates
- [ ] Create email-sequences.md doc
- [ ] Create blog-content-plan.md doc
- [ ] Publish first 3 SEO articles

## Success Criteria
- GA4 receiving events within 24h of deploy
- Meta Pixel verified in Events Manager
- All 5 email sequences automated and sending
- 3+ blog posts indexed by Google within 30 days

## Security Considerations
- GA4 Measurement ID and Meta Pixel ID: store in env vars, not hardcoded
- Email templates must not expose internal user IDs
- Unsubscribe link mandatory in all marketing emails (CAN-SPAM / VN law)
- GDPR-like consent banner for tracking (even though VN law is lighter)

## Risk Assessment
- GA4 + Pixel may slow page load — use afterInteractive + defer
- Email deliverability: use verified domain (SPF/DKIM/DMARC)
- Blog SEO takes 2-3 months to rank — start early, don't expect instant results

## Next Steps
- Depends on: None (can start immediately)
- Feeds into: Phase 01 (email sequences for trial conversion), Phase 04 (tracking for share events)
