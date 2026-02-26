# Phase 02: Hero + Problem Sections

## Context Links
- [Plan Overview](plan.md)
- [Phase 01 — Foundation](phase-01-foundation-shared-components.md)
- [EdTech Marketing Research](research/researcher-01-edtech-marketing-patterns.md)
- Current homepage: `src/app/page.tsx`

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 1.5h
- **Description**: Build the Hero section (pain/gain framing, dual CTA) and Problem section (3 parent frustrations) as separate components, then wire into page.tsx.

## Key Insights
- Hero should be full-bleed (break out of container) for visual impact
- Pain/gain headline pattern: state the outcome parents want, not the feature
- Problem section uses "agitate" from PAS framework — empathize with specific frustrations
- Mobile: hero CTAs should be full-width stacked, not side-by-side

## Requirements
### Functional
- Hero: headline, sub-headline, primary CTA (signup), secondary CTA (pricing), optional badge ("2,000+ phụ huynh")
- Problem: 3 pain point cards with icons, short title, description
- Both wrapped in ScrollReveal for entry animation

### Non-Functional
- Hero LCP < 2.5s (no heavy images above fold)
- Accessible heading hierarchy (h1 in hero, h2 in problem)
- Mobile-first: full-width CTAs on small screens

## Architecture
```
src/components/homepage/
  ├── section-hero.tsx       ← Server component (Link + static content)
  └── section-problem.tsx    ← Client component (uses ScrollReveal)
```

## Related Code Files
| Action | File |
|--------|------|
| Create | `src/components/homepage/section-hero.tsx` |
| Create | `src/components/homepage/section-problem.tsx` |
| Modify | `src/app/page.tsx` (replace current content, import new sections) |

## Implementation Steps

1. **Create `section-hero.tsx`**
   - Full-bleed gradient hero (reuse existing .hero gradient palette, extend sizing)
   - Content:
     ```
     <!-- Updated: Validation Session 1 - Remove fake metrics, use generic copy -->
     Badge: "Dùng thử miễn phí 7 ngày"
     H1: "Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ theo lộ trình"
     P: "Cùng Con Tự Học giúp trẻ 2-6 tuổi học qua video ngắn, hoạt động offline
        và bài kiểm tra nhẹ nhàng — với báo cáo tuần để phụ huynh yên tâm."
     CTA1: "Dùng thử 7 ngày miễn phí" → /auth/signup (solid-button)
     CTA2: "Xem bảng giá" → /pricing (ghost-button, white border variant)
     Sub-note: "Không cần thẻ tín dụng · Hủy bất kỳ lúc nào"
     ```
   - Use Lucide icons: `Sparkles` for badge, `ArrowRight` for CTA
   - Right side / below: abstract illustration placeholder or CSS art showing parent+child

2. **Create `section-problem.tsx`**
   - Section heading: "Phụ huynh Việt đang gặp khó khăn gì?"
   - 3 pain point cards in `.hp-grid-3`:
     ```
     Card 1: Icon=MonitorPlay | "Con xem video cả ngày"
       "Nhiều app cho trẻ chỉ là 'video giữ em' — không có lộ trình, không kiểm tra."
     Card 2: Icon=EyeOff | "Không biết con học được gì"
       "Phụ huynh không có cách nào đo lường tiến bộ thật sự của con."
     Card 3: Icon=Clock | "Không có thời gian dạy con mỗi ngày"
       "Ba mẹ bận rộn cần giải pháp gọn, 15 phút/ngày là đủ."
     ```
   - Each card wrapped in ScrollReveal with staggered delay (0, 0.1, 0.2)
   - Cards use existing .card class + Lucide icon in .hp-icon-box

3. **Update `src/app/layout.tsx`** — Conditional container wrapper
   <!-- Updated: Validation Session 1 - Homepage gets no container wrap -->
   - Detect homepage route (e.g. use `usePathname` or pass prop, or use a simpler approach: render children without container wrapper and let each page manage its own container)
   - Simplest approach: remove `container main-shell` wrapper from layout, add it to each existing page that needs it (or use a shared wrapper component)
   - Alternative: use `headers()` to detect pathname and conditionally apply container class

4. **Update `src/app/page.tsx`**
   - Remove all current content
   - Import `homepage.css` from components/homepage/
   - Import and render: `<SectionNav />` then `<SectionHero />` then `<SectionProblem />`
   - Keep as server component (sections handle their own client boundaries)
   - Placeholder comments for remaining sections (Phase 03-05)

4. **Verify build**
   ```bash
   pnpm build --no-lint
   ```

## Todo List
- [ ] Create section-hero.tsx with full copy + CTA
- [ ] Create section-problem.tsx with 3 pain cards
- [ ] Update page.tsx to use new sections
- [ ] Verify build passes
- [ ] Visual check on mobile viewport

## Success Criteria
- Hero displays with gradient, headline, dual CTA on both mobile and desktop
- Problem section shows 3 cards with staggered scroll-in animation
- H1 is only in hero (proper heading hierarchy)
- CTAs link to correct routes (/auth/signup, /pricing)

## Risk Assessment
- **Low**: Simple static content, no API calls
- **Medium**: Hero full-bleed might conflict with container layout — test with existing `.main-shell` padding

## Security Considerations
- None — static marketing content

## Next Steps
- Phase 03 adds How It Works and Features sections below Problem
