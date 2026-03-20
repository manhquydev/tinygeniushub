---
title: "Marketing Homepage Redesign"
description: "Build a conversion-optimized homepage for Cung Con Tu Hoc EdTech platform"
status: done
priority: P1
effort: 8h
branch: master
tags: [frontend, marketing, homepage, conversion, vietnamese]
created: 2026-02-21
---

# Marketing Homepage Redesign — Cung Con Tu Hoc

## Summary
Redesign the basic homepage into a full marketing-optimized landing page with 10 sections following EdTech conversion best practices, targeting Vietnamese parents with children aged 2-6.

## Research
- [EdTech Marketing Patterns](research/researcher-01-edtech-marketing-patterns.md)
- [Motion.dev + SEO Patterns](research/researcher-02-motion-nextjs-seo-patterns.md)

## Key Decisions
| Decision | Choice |
|----------|--------|
| Icons | Lucide React (outline, monochrome, 1.5px stroke) |
| Animations | Subtle scroll reveals via Motion.dev `whileInView` |
| Social proof | Fake realistic Vietnamese testimonials |
| Visual style | Full design — illustrations placeholders, product screenshots, CSS art |
| Copy language | Vietnamese (friendly, professional tone) |

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Foundation & Shared Components | done | 1.5h | [phase-01](phase-01-foundation-shared-components.md) |
| 2 | Hero + Problem Sections | done | 1.5h | [phase-02](phase-02-hero-and-problem-sections.md) |
| 3 | How It Works + Features | done | 1.5h | [phase-03](phase-03-how-it-works-and-features.md) |
| 4 | Social Proof + Product Demo | done | 1.5h | [phase-04](phase-04-social-proof-and-demo.md) |
| 5 | Pricing + Trust + FAQ + Final CTA | done | 1h | [phase-05](phase-05-pricing-trust-faq-cta.md) |
| 6 | SEO Metadata + Performance | done | 1h | [phase-06](phase-06-seo-metadata-performance.md) |

## Architecture Overview
```
src/app/page.tsx                    ← Main homepage (imports sections, exports metadata)
src/components/homepage/
  ├── scroll-reveal.tsx             ← Reusable motion wrapper
  ├── section-hero.tsx              ← Hero with pain/gain CTA
  ├── section-problem.tsx           ← Pain points grid
  ├── section-how-it-works.tsx      ← 4-step visual flow
  ├── section-features.tsx          ← Benefits grid (4 cards)
  ├── section-testimonials.tsx      ← Social proof carousel
  ├── section-product-demo.tsx      ← Screenshots/GIF preview
  ├── section-pricing-preview.tsx   ← 2-plan comparison
  ├── section-trust-signals.tsx     ← Security + refund badges
  ├── section-faq.tsx               ← Accordion Q&A
  └── section-final-cta.tsx         ← Closing CTA block
src/app/globals.css                 ← Extended with homepage styles
```

## Architecture Overview (Updated)
```
src/app/layout.tsx                  ← Conditional: no container wrap for homepage
src/app/page.tsx                    ← Main homepage (imports sections, exports metadata)
src/components/homepage/
  ├── homepage.css                  ← Dedicated homepage styles (NOT in globals.css)
  ├── scroll-reveal.tsx             ← Reusable motion wrapper
  ├── section-nav.tsx               ← Sticky section nav (appears on scroll past hero)
  ├── section-hero.tsx              ← Hero with pain/gain CTA
  ├── section-problem.tsx           ← Pain points grid
  ├── section-how-it-works.tsx      ← 4-step visual flow
  ├── section-features.tsx          ← Benefits grid (4 cards)
  ├── section-testimonials.tsx      ← Social proof carousel
  ├── section-product-demo.tsx      ← Screenshots/GIF preview
  ├── section-pricing-preview.tsx   ← 2-plan comparison
  ├── section-trust-signals.tsx     ← Security + refund badges
  ├── section-faq.tsx               ← Accordion Q&A
  └── section-final-cta.tsx         ← Closing CTA block
src/app/globals.css                 ← Unchanged (homepage styles in homepage.css)
```

## Dependencies
- `lucide-react` — outline icons (new install)
- `motion` — already installed (scroll animations)
- All other deps already available

## Validation Log

### Session 1 — 2026-02-21
**Trigger:** Initial plan creation validation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Hero full-bleed sẽ conflict với container layout hiện tại. Layout.tsx wrap tất cả children trong `<main className="container main-shell">` (max-width 1040px). Để hero full-bleed, bạn muốn xử lý thế nào?
   - Options: Sửa layout.tsx cho homepage | Hero vẫn trong container | Tách layout riêng cho homepage
   - **Answer:** Sửa layout.tsx cho homepage (Recommended)
   - **Rationale:** Conditional rendering in layout.tsx — homepage gets no container wrapper, other pages keep existing behavior. Simplest approach without route group restructuring.

2. **[Assumptions]** Plan dùng con số '2,000+ phụ huynh đã tin tưởng' và JSON-LD có AggregateRating 4.8/156 reviews. Sản phẩm chưa launch — số liệu fake trong structured data có thể vi phạm Google guidelines. Xử lý thế nào?
   - Options: Bỏ số liệu cụ thể, giữ copy chung | Giữ nguyên fake data | Dùng số nhỏ hơn, realistic
   - **Answer:** Bỏ số liệu cụ thể, giữ copy chung (Recommended)
   - **Rationale:** Google penalizes fake structured data. Remove AggregateRating from JSON-LD entirely. Replace "2,000+" badges with generic copy like "Dùng thử miễn phí 7 ngày".

3. **[Architecture]** Phase 01 thêm 15+ class `.hp-*` mới vào globals.css (đã 458 dòng). Bạn muốn quản lý CSS homepage thế nào?
   - Options: File CSS riêng cho homepage | Thêm vào globals.css | Dùng Tailwind utility classes
   - **Answer:** File CSS riêng cho homepage (Recommended)
   - **Rationale:** Create `src/components/homepage/homepage.css`, import in page.tsx. Keeps globals.css clean, homepage styles co-located with components, easier to maintain.

4. **[Scope]** Homepage có 10 sections nhưng AppNav hiện tại chỉ có links tới /pricing, /auth. Có cần thêm anchor links (scroll-to-section) cho homepage navigation không?
   - Options: Không cần, giữ nav đơn giản | Thêm 2-3 anchor links | Thêm sticky section nav riêng
   - **Answer:** Thêm sticky section nav riêng
   - **Rationale:** New `section-nav.tsx` component — mini-nav below AppNav, appears on scroll past hero. Links to key sections: Tính năng, Bảng giá, FAQ. Improves UX for long homepage scroll.

#### Confirmed Decisions
- **Layout strategy**: Conditional layout.tsx — homepage renders without container wrapper
- **Social proof numbers**: Remove all fake metrics from hero badges, testimonial sub-heading, final CTA, and JSON-LD
- **CSS organization**: Dedicated `homepage.css` file, not globals.css
- **Navigation**: New sticky section-nav component for homepage anchor navigation

#### Action Items
- [ ] Update Phase 01: CSS target → homepage.css instead of globals.css; add section-nav.tsx
- [ ] Update Phase 02: Remove "2,000+" from hero badge; add layout.tsx conditional
- [ ] Update Phase 04: Remove "2,000+" from testimonials sub-heading
- [ ] Update Phase 05: Remove "2,000+" from final CTA sub-text
- [ ] Update Phase 06: Remove AggregateRating from JSON-LD

#### Impact on Phases
- Phase 01: CSS file → `homepage.css` not globals.css; add `section-nav.tsx` component
- Phase 02: layout.tsx conditional wrapper; hero badge copy change
- Phase 04: Testimonials sub-heading copy change
- Phase 05: Final CTA sub-text copy change
- Phase 06: JSON-LD remove AggregateRating block

---

## Completion Note — 2026-02-25

All 6 phases completed. Homepage fully redesigned with conversion-optimized sections. Final SEO pass done in Phase 06:
- FAQPage + WebSite JSON-LD merged as @graph
- Twitter large card meta images added
- AggregateOffer.lowPrice corrected to 120000 VND
- XSS-safe JSON-LD serialization applied
- Dead-weight keywords meta removed from layout
- Robots directives added to homepage metadata
