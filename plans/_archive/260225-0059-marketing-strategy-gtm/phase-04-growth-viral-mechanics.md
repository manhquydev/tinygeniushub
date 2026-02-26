# Phase 04: Growth & Viral Mechanics

## Context Links
- Research: Researcher D (Growth), Researcher B (Business Model)
- Weekly report service: `src/modules/reports/weekly-report-service.ts`
- Referral system: `src/modules/referral/service.ts`, `src/app/(main)/referral/page.tsx`
- K-factor target: >0.3 early, >0.7 at scale

## Overview
- **Priority:** P1 (High)
- **Status:** Done — 2026-02-25
- **Description:** Transform weekly report into viral sharing mechanism, enhance referral program with dual-sided rewards, add achievement badges, and pilot B2B2C school partnerships.

## Key Insights
- Weekly report email is #1 dormant viral asset — parents already read it
- 1-tap share to Zalo/Facebook generates 3-5x more shares than "copy link"
- Dual-sided referral (free week for both) outperforms one-sided 2-3x
- ClassDojo model: 1 school = 20-100 families at 40-60% lower CAC
- Achievement badges create natural "brag moments" parents share organically

## Requirements

### 1. Weekly Report Shareable Card
- Generate OG-image-style card from weekly report data (child name, streak, score)
- Add "Chia se tien do con" button in email + report web page
- Card shows: child avatar, streak count, lessons completed, level badge
- No sensitive data on card (no full name — use first name + initial only)

### 2. Share Mechanics
Share button generates pre-filled messages for each platform:
- **Zalo:** Deep link with message "Be [name] da hoc [X] bai tuan nay! Thu Cung Con Tu Hoc mien phi: [referral_link]"
- **Facebook:** Share card image + link to referral page with UTM
- **WhatsApp (fallback):** Text message with referral link
- All share links include: `?ref=[parent_code]&utm_source=[platform]&utm_medium=share&utm_campaign=weekly_report`

### 3. Referral Program Enhancement
Current state: basic referral page with no clear reward. Enhance to:
- **Dual-sided reward:** Referrer gets 7 days free premium; referee gets 7 days free premium
- **Trigger timing:** Show referral prompt on Day 5 of trial (post-aha, pre-expiry)
- **Dashboard widget:** Show referral count, rewards earned, shareable link
- **Referral tiers:** 3 referrals = 1 month free, 10 referrals = 1 year free

### 4. Achievement Badge System
Badges that generate shareable moments:
| Badge | Trigger | Share Text |
|-------|---------|------------|
| "Ngay dau tien" | First lesson completed | "Be [name] vua hoan thanh bai hoc dau tien!" |
| "Chuoi 7 ngay" | 7-day streak | "Be [name] da hoc lien tuc 7 ngay!" |
| "Len cap" | Level up | "Be [name] vua len Level [X]!" |
| "Sieu sao" | 30-day streak | "Be [name] — 30 ngay khong nghi!" |
| "Nguoi gioi thieu" | First successful referral | "Cam on [name] da gioi thieu ban be!" |

Each badge = shareable card with same share mechanics as weekly report.

### 5. B2B2C School Partnership
- **Target:** 5-10 nurseries/preschools in HCMC + Hanoi
- **Offer:** Free teacher account + 50% discount for all families in school
- **Teacher pack:** QR code poster, parent letter template, class dashboard
- **Onboarding:** 1 training session (30 min video call)
- **Tracking:** School referral code, track families per school

## Related Code Files
- `src/modules/reports/weekly-report-service.ts` — add share URL + card generation
- `src/app/(main)/referral/page.tsx` — add dual-sided reward display, tier info
- `src/modules/referral/service.ts` — add reward logic, tier calculation
- New: `src/modules/sharing/share-card-service.ts` — OG image generation
- New: `src/modules/sharing/share-link-builder.ts` — UTM + platform deep links
- New: `src/modules/achievements/badge-service.ts` — badge trigger + storage

## Implementation Steps
1. Create `src/modules/sharing/share-link-builder.ts` — UTM builder for Zalo/FB/WhatsApp
2. Create `src/modules/sharing/share-card-service.ts` — generate OG image from report data
3. Add "Chia se tien do con" button to weekly report email template
4. Add share button to report web page (`/parent/reports/[id]`)
5. Update `src/modules/referral/service.ts` — add dual-sided reward logic
6. Update `src/app/(main)/referral/page.tsx` — show rewards, tiers, share link
7. Create `src/modules/achievements/badge-service.ts` — badge definitions + triggers
8. Add badge notification to lesson completion + streak check flows
9. Add shareable card generation for each badge type
10. Create school partnership landing page + teacher onboarding doc
11. Wire GA4 events: `report_shared`, `badge_earned`, `referral_sent`
12. Add K-factor tracking: (invites_sent * conversion_rate) per user

## Todo List
- [ ] Build share link builder with UTM + platform support
- [ ] Build shareable card generator (OG image)
- [ ] Add share button to weekly report email + web page
- [ ] Implement dual-sided referral rewards
- [ ] Add referral tiers (3 = 1mo, 10 = 1yr)
- [ ] Implement 5 achievement badges
- [ ] Add badge share cards
- [ ] Create school partnership landing page
- [ ] Create teacher onboarding pack (QR poster, letter)
- [ ] Wire all share/referral events to GA4
- [ ] Set up K-factor measurement dashboard

## Success Criteria
- Weekly report share rate >= 5% of active users
- K-factor >= 0.3 within 60 days of launch
- Referral program generates >= 15% of new trials
- 3+ school partnerships active within 90 days
- Badge earn rate: 80% of users earn "Ngay dau tien" within 24h

## Risk Assessment
- Share card generation may be slow — use edge function or pre-generate on report creation
- Zalo deep links may break on some devices — provide fallback copy-to-clipboard
- Schools slow to adopt — start with personal connections, offer free pilot
- Badge gamification may feel spammy — keep to natural milestones only

## Security Considerations
- Share cards must not expose child's full name or identifiable info
- Referral codes must be non-guessable (UUID or hash-based)
- School partnership data must comply with child data protection

## Next Steps
- Depends on: Phase 03 (GA4 events for tracking shares)
- Depends on: Phase 01 (pricing tiers for referral rewards)
- Feeds into: Phase 05 (viral mechanics ready for launch)
