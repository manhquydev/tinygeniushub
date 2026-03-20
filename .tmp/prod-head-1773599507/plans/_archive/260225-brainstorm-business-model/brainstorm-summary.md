# Brainstorm Summary — Business Model & Growth Roadmap
**Date:** 2026-02-25
**Project:** cungcontuhoc.vn — EdTech for Vietnamese children ages 2–6

---

## Problem Statement
Project has solid tech (Next.js 16, Prisma, BullMQ) but no content yet, no paying users, and pricing (120k/year ≈ 10k/month) is 10-15x below market benchmark. Need to define business model, infrastructure strategy, and marketing approach before building further.

## Research Sources
- `plans/260225-0059-marketing-strategy-gtm/research/vietnam-edtech-children-market-research.md`
- `plans/260225-0059-marketing-strategy-gtm/research/video-hosting-and-github-student-pack-research.md`

---

## Market Context
- Vietnam EdTech ~$3-4B (2024), growing to $6-8B by 2030
- Early childhood = fastest growing segment
- **English = red ocean** (Monkey Junior, Babilala, Edupia all compete here)
- **Math for ages 2-6 = blue ocean** — no dominant player
- Benchmark pricing: Babilala 150-200k/month (live class); app-only should be 99-149k/month

---

## Business Model Decision

### Core Model: Subscription + Premium Courses

**Subscription (99k/month | 799k/year)**
- All standard video lessons
- Interactive exercises after each video
- Progress tracking + parent reports
- Monthly content updates
- Community access
- 7-day free trial, 30-day money-back guarantee

**Premium Courses (one-time purchase, 299k-499k/course)**
- Intensive 30-60 day structured program
- PDF workbook
- Completion certificate
- Priority support
- Accessible WITHOUT subscription (but Sub users get 20% off)
- Sub = breadth, Course = depth — no overlap

### Key Separation Rule
| | Sub | Course |
|---|---|---|
| Standard video lessons | ✅ | ❌ |
| Exercises | ✅ | ❌ |
| 30-day intensive program | ❌ | ✅ |
| Certificate | ❌ | ✅ |
| Progress report | ✅ | ❌ |

### Pricing Nâng cấp Ngay
- Current: 120k/year (10k/month) → WRONG signal
- New: 99k/month or 799k/year (anchored correctly vs market)

---

## Competitive Differentiation
1. **Math-first** positioning — own the "Math for 2-6" space nobody owns
2. **Physical+Digital bundle** — workbook + QR codes (phase 2, Shopee/Fahasa distribution)
3. **Certificate** after course completion — viral loop (parents share on Facebook/Zalo)
4. **Kindergarten B2B2C** — white-label or reseller (phase 3)

---

## Infrastructure Decisions

### Video Hosting: Bunny Stream (Phase 1)
- ~$0.50-3/month at MVP stage
- Auto-HLS encoding, no FFmpeg pipeline needed
- Signed URLs for paid content access control
- Asia-Pacific CDN (30+ PoPs)
- Upgrade to Cloudflare Stream at 100k+ minutes/month

### GitHub Student Pack — Activate These
| Service | Benefit |
|---|---|
| DigitalOcean | $200 credit = ~8 months free server |
| MongoDB Atlas | $50 credit (for quiz/exercise data if needed) |
| SendGrid | 15k emails/month backup |
| Stripe | First $1,000 revenue fee-free |

### YouTube Policy
- Public trailers/previews ONLY — NOT for gated paid content
- COPPA compliance risk for under-13 content

---

## 3-Phase Roadmap

### Phase 1 (Month 0-3): Foundation & Marketing
**Goal:** 100 paying users

Tasks:
- [ ] Nâng giá → 99k/month, update pricing page
- [ ] Homepage redesign (SEO + CRO optimized)
- [ ] Technical SEO audit + fix
- [ ] 10 SEO blog articles (Math/English 2-6 keywords)
- [ ] Bunny Stream setup + first 10-20 video lessons
- [ ] Email sequences update (reflect new pricing + model)
- [ ] Referral program activation (already built)

### Phase 2 (Month 3-6): Scale B2C
**Goal:** 500 paying users, MRR 30-50M VND

Tasks:
- [ ] Launch first Premium Course (30-day Phonics or Math bootcamp)
- [ ] Course purchase system + permission logic
- [ ] Certificate generation
- [ ] Gift codes on Shopee (Tết campaign)
- [ ] Physical workbook v1 (simple PDF workbook + QR codes)
- [ ] A/B test pricing page

### Phase 3 (Month 6-12): B2B2C Expansion
**Goal:** 3-5 kindergarten partners, 1000+ students

Tasks:
- [ ] White-label package for kindergartens
- [ ] Custom exercise system (fully built by this point)
- [ ] Teacher/admin dashboard for schools
- [ ] B2B sales collateral

---

## Skills Execution Plan

| Phase | Task | Skill |
|---|---|---|
| Research | Keyword research Math/English 2-6 | `mkt:seo:keywords` |
| Design | Homepage visual direction | `ui-ux-pro-max` / `design:good` |
| Copy | Hero message, pricing copy, CTAs | `content:cro` + `copywriting` |
| SEO | Technical audit | `mkt:seo:audit` |
| Implement | Homepage Next.js | `frontend-design` + `cook` |
| Blog | 10 SEO articles | `mkt:write:blog` |
| Email | Update sequences | `mkt:email:sequence` |
| Pricing | Course purchase + Sub permission | `plan:hard` → `cook` |
| Video | Bunny Stream integration | `backend-development` |
| Analytics | GA4 + conversion tracking setup | `analytics` |

---

## Success Metrics

| Phase | KPI | Target |
|---|---|---|
| Phase 1 | Paying users | 100 |
| Phase 1 | Organic search traffic | 1,000 visits/month |
| Phase 2 | MRR | 30-50M VND |
| Phase 2 | Course conversion rate | 5-10% of Sub users |
| Phase 3 | B2B contracts | 3-5 schools |

---

## Risks & Mitigation

| Risk | Mitigation |
|---|---|
| No content = no product | Make 10-20 videos as MVP, launch with limited beta |
| Sub+Course confusion | Strict separation rule, clear pricing page |
| Low conversion at 99k/month | 30-day money-back guarantee, outcome-focused messaging |
| Competitor copies Math positioning | Move fast, build brand recognition first |

---

## Unresolved Questions
1. Who produces video content? (in-house or outsource to teachers?)
2. Exercise format — drag-drop, multiple choice, audio response?
3. Can you approach 1-2 kindergartens for B2B pilot in month 6?
4. Workbook — print-on-demand (Printful) or traditional printing?
