---
title: "Marketing Strategy & Go-to-Market Playbook"
description: "Chiến lược kinh doanh & marketing bài bản cho cungcontuhoc.vn — EdTech cho trẻ 2-6 tuổi tại Việt Nam"
status: pending
priority: P1
effort: 20h
branch: main
tags: [marketing, seo, gtm, business-model, growth, vietnamese, edtech]
created: 2026-02-25
---

# Marketing Strategy & Go-to-Market — Cùng Con Tự Học

## Summary
Xây dựng hệ thống marketing hoàn chỉnh: business model tối ưu, funnel chuyển đổi, triển khai kỹ thuật SEO/analytics, growth loops viral, và launch playbook cho thị trường VN.

## Research
- [Researcher A — Competitor & Market Analysis](research/researcher-A-competitors-market.md)
- [Researcher B — Business Model & Pricing](research/researcher-B-business-model-pricing.md) *(pending)*
- [Researcher C — Marketing Channels VN Parents](research/researcher-C-marketing-channels.md)
- [Researcher D — Growth & Viral Mechanics](research/researcher-D-growth-viral.md) *(pending)*

## Key Decisions (from research)
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pricing model | Annual subscription (freemium entry) | VN WTP $3–8/mo; annual 40–50% discount drives conversion |
| Primary channel | TikTok + Facebook Groups | P0: highest reach, lowest CAC for VN parents 25–38 |
| Retention channel | Zalo OA (ZNS) | 85–90% open rate vs 28–35% email |
| KOL strategy | 20–30 nano/micro KOLs | 5–10% engagement vs 0.5–2% macro; authentic content |
| SEO anchor | "tiếng Anh trẻ em" cluster | 15–20K/mo search vol; age-specific long-tails as quick wins |
| Viral hook | Weekly report shareable card | Natural sharing moment; parent pride trigger |

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Business Model & Pricing Optimization | done | 3h | [phase-01](phase-01-business-model-pricing.md) |
| 2 | Marketing Funnel & Content Strategy | pending | 4h | [phase-02](phase-02-marketing-funnel-content.md) |
| 3 | Technical Marketing Implementation | done | 6h | [phase-03](phase-03-technical-marketing.md) |
| 4 | Growth & Viral Mechanics | done | 4h | [phase-04](phase-04-growth-viral-mechanics.md) |
| 5 | Go-to-Market Launch Playbook | done | 3h | [phase-05](phase-05-gtm-launch-playbook.md) |

## Architecture Impact
```
src/app/(main)/pricing/page.tsx        ← CRO improvements (Phase 1)
src/app/(main)/referral/page.tsx       ← Referral UX enhancement (Phase 4)
src/app/layout.tsx                     ← GA4 + Meta Pixel (Phase 3)
src/app/sitemap.ts                     ← Already exists, enhance (Phase 3)
src/components/homepage/               ← A/B test hooks (Phase 1)
src/modules/reports/                   ← Shareable card generation (Phase 4)
src/modules/referral/                  ← Reward mechanics (Phase 4)
docs/marketing/                        ← New: content calendar, email sequences
```

## Dependencies
- Phase 3 requires: GA4 + Meta Pixel account setup
- Phase 4 requires: Phase 3 analytics baseline
- Phase 5 requires: Phase 1–4 complete
