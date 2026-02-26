# Phase 01 — Foundation & Marketing

## Context Links
- [Plan Overview](./plan.md)
- [Brainstorm Summary](../260225-brainstorm-business-model/brainstorm-summary.md)
- [Market Research](../260225-0059-marketing-strategy-gtm/research/vietnam-edtech-children-market-research.md)
- [GTM Plan](../260225-0059-marketing-strategy-gtm/plan.md)
- [Homepage Redesign Plan](../260221-1543-marketing-homepage-redesign/)

## Overview
- **Priority:** P1 (start immediately)
- **Status:** ⬜ pending
- **Duration:** Month 0–3
- **Goal:** 100 paying users, 1,000 organic visits/month
- **Runs parallel with:** Phase 02 (video infra)

## Key Insights
1. Current price 120k/year = market signal of "cheap/low value" — must raise to 99k/month
2. Math for 2–6 is an unclaimed niche — hero messaging should lead with Math, not English
3. Homepage existing sections are already structured well (`hero`, `features`, `testimonials`, `pricing`) — need copy + visual overhaul, not full rebuild
4. Blog CMS already built — just need SEO articles published
5. GA4 + FB Pixel already in code but env vars may not be set in prod
6. Referral system already built — just needs activation and promotion

## Requirements

### Functional
- [ ] Pricing updated: 99k/month | 799k/year (update DB seed + pricing page)
- [ ] Homepage: new hero copy (Math-first positioning), updated sections, CRO-optimized CTAs
- [ ] Blog: 10 SEO articles published targeting Vietnamese parent search queries
- [ ] Email sequences: reflect new pricing, Math positioning, course upsell hooks
- [ ] GA4 + FB Pixel: verified firing in production, conversion events set up
- [ ] Referral: activate program with clear CTA on dashboard + share page

### Non-functional
- [ ] Homepage Lighthouse score ≥ 90 (Performance, SEO, Accessibility)
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] All pages have meta title, description, OG tags, canonical
- [ ] Sitemap includes all blog articles

## Architecture
No new DB models needed for Phase 01. Changes are:
- `src/app/(main)/` pages — copy + layout updates
- `src/components/homepage/` — section component refactors
- `src/modules/billing/` — pricing constants update
- Blog: publish articles via existing admin CMS
- Analytics: env vars in production `.env`

## Skills Execution Order

```
Step 1 (parallel):
  mkt:seo:keywords  → keyword list + search volumes
  mkt:seo:audit     → technical SEO issues list

Step 2 (sequential, after Step 1):
  content:cro       → homepage copy draft (hero, CTA, features, testimonials)
  copywriting       → pricing page copy

Step 3 (parallel, after Step 2):
  ui-ux-pro-max     → homepage visual design direction + component spec
  mkt:write:blog    → write 10 SEO articles (use keyword list from Step 1)

Step 4 (sequential, after Step 3):
  frontend-design   → implement new homepage sections (Next.js/Tailwind)
  cook              → pricing constants update + pricing page

Step 5 (parallel):
  mkt:email:sequence → update email sequences
  analytics         → verify GA4 + FB Pixel + set conversion events

Step 6:
  web-testing       → E2E tests for homepage CTA flows, pricing page
```

## Related Code Files

### Files to Modify
- `src/app/(main)/page.tsx` — homepage layout
- `src/components/homepage/` — all section components
- `src/app/(main)/pricing/page.tsx` — pricing page
- `src/app/(main)/blog/page.tsx` — blog listing SEO meta
- `src/modules/billing/constants.ts` (or equivalent) — pricing values
- `src/app/globals.css` — any visual updates
- `.env.production` / Vercel env vars — GA4, FB Pixel IDs

### Files to Create
- 10 blog articles via admin CMS (not code files — content)

## Implementation Steps

### 1. Pricing Update (Day 1–2)
1. Find current plan pricing constants in codebase (`grep -r "120000\|Standard\|Family" src/`)
2. Update to: Standard = 99,000 VND/month | 799,000 VND/year; Family+ = 149,000/month | 1,199,000/year
3. Update pricing page UI to reflect new prices
4. Update trial CTA copy: "Dùng thử miễn phí 7 ngày — Hoàn tiền trong 30 ngày nếu không hài lòng"
5. Update DB seed file if pricing is seeded

### 2. SEO Keyword Research (Day 1–3, parallel)
- Run `/mkt:seo:keywords` with focus: Math 2-6 tuổi VN + English 2-6 tuổi VN
- Target keyword clusters:
  - "dạy toán cho trẻ 2 3 4 5 6 tuổi"
  - "học đếm số cho bé"
  - "ứng dụng học toán cho trẻ mầm non"
  - "dạy tiếng Anh cho trẻ 2 tuổi tại nhà"
  - "phonics cho trẻ 4 5 tuổi"
  - "app học tiếng Anh cho trẻ em"
- Deliver: keyword list with monthly search volume + difficulty

### 3. Technical SEO Audit (Day 1–3, parallel)
- Run `/mkt:seo:audit` on cungcontuhoc.vn
- Fix critical issues (broken links, missing meta, slow pages)
- Verify sitemap.ts includes blog posts + categories
- Check robots.ts allows indexing of marketing pages

### 4. Homepage Copy (Day 3–5)
- Run `/content:cro` with brief: "Vietnamese EdTech, Math+English for 2-6yo, Math-first positioning, target anxious parents"
- Hero headline: lead with Math differentiation ("Ứng dụng đầu tiên dạy Toán & Tiếng Anh cho bé 2-6 tuổi")
- Sub-headline: outcome-focused ("15 phút mỗi ngày — phụ huynh thấy kết quả sau 30 ngày")
- Sections: Problem → Solution → Features → Social Proof → Pricing preview → FAQ → CTA
- Add outcome guarantee badge: "Hoàn tiền 100% trong 30 ngày nếu không thấy tiến bộ"

### 5. Homepage UI Redesign (Day 5–10)
- Run `/ui-ux-pro-max` for visual design spec: color, typography, component layout
- Keep existing Next.js component structure — update visual layer only
- Mobile-first (>60% Vietnamese traffic is mobile)
- Key CTA button: fixed bottom bar on mobile
- Add trust signals section: "X phụ huynh đang dùng", money-back badge, VN flag

### 6. Homepage Implementation (Day 10–15)
- Run `/frontend-design` then `/cook` for implementation
- Update `src/components/homepage/` section components with new copy + design
- Ensure all images use `next/image` with explicit width/height (Core Web Vitals)
- Add JSON-LD `FAQPage` schema to FAQ section
- Verify OG image generation at `/opengraph-image.tsx`

### 7. Blog Articles (Day 5–20, parallel with UI)
- Run `/mkt:write:blog` for 10 articles (1 article/day approx.)
- Publish via existing admin CMS at `/admin/blog`
- Article topics (from keyword research):
  1. "Cách dạy bé đếm số từ 1-10 dễ hiểu nhất (2-3 tuổi)"
  2. "5 trò chơi toán học cho trẻ 3-4 tuổi tại nhà"
  3. "Phonics là gì? Tại sao bé cần học Phonics trước khi học chữ"
  4. "Dạy tiếng Anh cho trẻ 2 tuổi: Có nên và bắt đầu thế nào?"
  5. "So sánh 5 app học tiếng Anh cho trẻ em VN 2025"
  6. "Bé 4-5 tuổi nên học toán gì? Lộ trình cụ thể"
  7. "Thói quen học 15 phút/ngày: Khoa học đằng sau"
  8. "Monkey Junior vs Cùng Con Tự Học: Điểm khác biệt"
  9. "Dấu hiệu bé sẵn sàng học tiếng Anh sớm (không phải tuổi)"
  10. "Báo cáo tiến độ học tập: Tại sao cha mẹ cần theo dõi mỗi tuần"

### 8. Email Sequences Update (Day 15–20)
- Run `/mkt:email:sequence` for updated sequences
- Update trial welcome email: mention Math positioning
- Update Day 3 email: highlight "bé đã học gì" + Math track CTA
- Update Day 7 (conversion) email: new 99k/month price + 30-day guarantee
- Add post-conversion upsell email: "Nâng lên Premium Course" (send at Day 30 after paying)

### 9. Analytics Verification (Day 1–5)
- Run `/analytics` to audit current GA4 + FB Pixel setup
- Verify `NEXT_PUBLIC_GA4_MEASUREMENT_ID` and `NEXT_PUBLIC_FB_PIXEL_ID` are set in production
- Set up GA4 conversion events: `trial_start`, `purchase`, `checkout_begin`
- Set up FB Pixel events: `StartTrial`, `Subscribe`, `Purchase`
- Add Google Search Console property + submit sitemap

## Todo List
- [ ] Update pricing constants (99k/mo, 799k/yr)
- [ ] Update pricing page UI
- [ ] Run mkt:seo:keywords → keyword list
- [ ] Run mkt:seo:audit → fix critical issues
- [ ] Write homepage copy (content:cro)
- [ ] Design homepage (ui-ux-pro-max)
- [ ] Implement homepage (frontend-design + cook)
- [ ] Write 10 blog articles (mkt:write:blog)
- [ ] Publish articles via admin CMS
- [ ] Update email sequences (mkt:email:sequence)
- [ ] Verify GA4 + FB Pixel in production (analytics)
- [ ] Add Google Search Console
- [ ] Activate referral program CTA on dashboard
- [ ] Lighthouse audit after implementation

## Success Criteria
- [ ] Pricing page shows 99k/month correctly
- [ ] Homepage Lighthouse SEO score ≥ 90
- [ ] 10 blog articles indexed in Google Search Console
- [ ] GA4 tracking `trial_start` and `purchase` events
- [ ] Email sequences send correctly on trial D0, D3, D7
- [ ] Referral share link works end-to-end

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Price increase causes churn | Medium | 30-day guarantee messaging prominent |
| Blog articles not ranking for 2-3 months | Low | Normal SEO lag; start now |
| Homepage redesign breaks existing layout | Medium | Keep component IDs, test E2E |
| GA4/FB IDs not set in prod | High | Verify in week 1 |

## Security Considerations
- No new auth surfaces in this phase
- Blog content goes through existing admin auth
- Analytics scripts loaded with `afterInteractive` strategy (already implemented)

## Next Steps
→ Phase 02 (Video Infrastructure) runs in parallel
→ Phase 03 (Course System) starts after Phase 01 complete
