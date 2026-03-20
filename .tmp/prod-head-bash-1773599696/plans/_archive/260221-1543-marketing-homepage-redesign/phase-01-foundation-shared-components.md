# Phase 01: Foundation & Shared Components

## Context Links
- [Plan Overview](plan.md)
- [Motion.dev Research](research/researcher-02-motion-nextjs-seo-patterns.md)
- Existing design system: `src/app/globals.css`
- Existing layout: `src/app/layout.tsx`

## Overview
- **Priority**: P0 (blocker for all other phases)
- **Status**: pending
- **Effort**: 1.5h
- **Description**: Install lucide-react, create reusable ScrollReveal component, extend globals.css with homepage section styles, and create homepage component directory structure.

## Key Insights
- Motion.dev `whileInView` with `viewport={{ once: true }}` is the cleanest scroll reveal pattern
- Lucide React tree-shakes automatically — import individual icons
- Existing globals.css already has `.hero`, `.card`, `.card-grid` — extend, don't duplicate
- Container is `min(1040px, calc(100% - 2rem))` — homepage may need wider hero (full-bleed)

## Requirements
### Functional
- ScrollReveal wrapper component with configurable delay
- Extended CSS for homepage-specific sections (full-bleed hero, alternating section backgrounds)
- Lucide-react installed and usable
- Homepage directory structure created

### Non-Functional
- ScrollReveal respects `prefers-reduced-motion`
- All new CSS uses existing design tokens (--ink, --brand, --surface vars)
- Components under 200 LOC each

## Architecture
<!-- Updated: Validation Session 1 - CSS → homepage.css, add section-nav -->
```
src/components/homepage/
  ├── homepage.css         ← Dedicated homepage styles (NOT globals.css)
  ├── scroll-reveal.tsx    ← "use client", motion wrapper
  └── section-nav.tsx      ← Sticky section nav (appears on scroll past hero)
```

## Related Code Files
| Action | File |
|--------|------|
<!-- Updated: Validation Session 1 - CSS → homepage.css, add section-nav.tsx -->
| Create | `src/components/homepage/scroll-reveal.tsx` |
| Create | `src/components/homepage/homepage.css` (dedicated homepage styles) |
| Create | `src/components/homepage/section-nav.tsx` (sticky section nav) |
| Install | `lucide-react` package |

## Implementation Steps

1. **Install lucide-react**
   ```bash
   pnpm add lucide-react
   ```

2. **Create `src/components/homepage/scroll-reveal.tsx`**
   - "use client" directive (Motion.dev requires client component)
   - Props: `delay?: number`, `children`, `className?`, spread remaining HTMLMotionProps
   - `initial={{ opacity: 0, y: 32 }}`
   - `whileInView={{ opacity: 1, y: 0 }}`
   - `transition={{ duration: 0.5, delay, ease: "easeOut" }}`
   - `viewport={{ once: true, amount: 0.15 }}`

3. **Create `src/components/homepage/homepage.css`** — Homepage-specific styles with `.hp-` prefix (imported in page.tsx, NOT in globals.css):
   - `.hp-section` — full-width section with vertical padding (4rem 0), max-width container inside
   - `.hp-section-alt` — alternating background (surface-100)
   - `.hp-section-dark` — dark background (ink-900) with white text
   - `.hp-hero` — full-bleed hero extending beyond container, gradient background matching existing .hero but larger
   - `.hp-grid-2` — 2-column responsive grid (1fr 1fr, stack on mobile)
   - `.hp-grid-3` — 3-column responsive grid
   - `.hp-grid-4` — 4-column responsive grid (2x2 on tablet, 1 on mobile)
   - `.hp-step-number` — circular numbered step indicator
   - `.hp-icon-box` — icon container (48px, rounded, subtle background)
   - `.hp-testimonial-card` — testimonial card with avatar, quote, attribution
   - `.hp-faq-item` — accordion item with details/summary
   - `.hp-badge` — trust signal badge (inline-flex, icon + text)
   - `.hp-price-card` — pricing comparison card
   - `.hp-price-highlight` — highlighted/recommended plan card
   - `.hp-cta-block` — full-width CTA section with centered text

4. **Create `src/components/homepage/section-nav.tsx`**
   <!-- Updated: Validation Session 1 - New sticky section nav -->
   - "use client" directive (needs scroll detection + active section tracking)
   - Appears when user scrolls past hero section (use IntersectionObserver or scroll position)
   - Sticky below AppNav (top: ~72px matching nav-inner min-height)
   - 3-4 anchor links: "Tính năng" (#features), "Bảng giá" (#pricing), "FAQ" (#faq)
   - Smooth scroll behavior via `scrollIntoView({ behavior: 'smooth' })`
   - Active state highlighting based on current scroll position
   - Compact design: single row, subtle background blur (matching AppNav style)
   - Hide on non-homepage routes (only render inside homepage page.tsx)

5. **Verify build compiles**
   ```bash
   pnpm build --no-lint
   ```

## Todo List
- [ ] Install lucide-react
- [ ] Create scroll-reveal.tsx
- [ ] Create homepage.css with all .hp-* classes
- [ ] Create section-nav.tsx (sticky section navigation)
- [ ] Verify build passes

## Success Criteria
- `pnpm build` succeeds with new dependencies
- ScrollReveal renders correctly with fade-up animation
- All new CSS classes use existing design tokens
- No lint errors in new files

## Risk Assessment
- **Low**: Motion.dev already installed, pattern is well-documented
- **Low**: CSS extension is additive, won't break existing styles

## Security Considerations
- None — purely presentational components

## Next Steps
- Phase 02 uses ScrollReveal + new CSS classes for Hero and Problem sections
