# Brainstorm: Nâng Cấp Giao Diện Trang Chủ "Khu Vườn Trên Mây"

**Date:** 2026-03-12  
**Project:** Cùng Con Tự Học (Educational Platform for Kids 2-6 years)  
**Objective:** Redesign homepage with "Cloud Garden" theme - visual-first, immersive, interactive  
**Participants:** Product team + Brainstormer AI Agent  
**Status:** ✅ **CONSENSUS REACHED** - Approach E: Progressive Exploration

---

## 1. Problem Statement

**Current State:**
- Homepage (`/(main)/page.tsx`) imports `CloudGardenHome` component **but it doesn't exist**
- Existing homepage uses traditional landing page structure: text-heavy hero with dashboard mock → features → pricing → FAQ
- Component mismatch: Beautiful cloud-garden components exist (`CloudWorldMap`, `BeanstalkJourney`, `CloudZone`) but NOT integrated into homepage

**Core Problem:**
- **Too text-heavy** - Current hero has long paragraphs, doesn't leverage visual "Cloud Garden" brand identity
- **Lacks immersion** - No interactive preview for kids to explore
- **Misaligned with brand** - Product uses garden metaphor (seeds → tiers → zones) but homepage doesn't reflect this

---

## 2. Requirements

### User Personas

**Primary: Parents (Decision Makers)**
- Traffic source: Google search, Facebook ads, referrals
- Intent: Evaluate if platform is worth paying for
- Device: 60% mobile/tablet, 40% desktop

**Secondary: Kids (Experience Users)**
- Traffic source: Bookmarks, returning visitors
- Intent: Play in garden, explore lessons
- Device: 80% tablets

### Technical Constraints

- Tech Stack: Next.js 16, React 19, Framer Motion v12, Tailwind CSS v4
- Performance: Load < 3s on 3G, Lighthouse > 90
- Mobile-First: Tablets primary device
- SEO Critical: Must rank for "giáo dục trẻ em" keywords
- Vietnamese Encoding: Must pass `pnpm check:i18n`

---

## 3. Approaches Evaluated

### Approach A: Hybrid Marketing + Interactive Preview
- Garden-themed hero → CTA → Interactive section → Features → Pricing
- **Verdict:** ⚠️ Safe fallback, doesn't maximize visual potential

### Approach B: Fullscreen Immersive (Tab-based)
- Full viewport CloudWorldMap → Floating "Parent Info" toggle
- **Verdict:** ❌ Too risky - SEO nightmare, high bounce risk

### Approach C: Split-Screen Dual Experience
- Left: Interactive garden | Right: Marketing content
- **Verdict:** ❌ DO NOT BUILD - Mobile-first disaster

### Approach D: Progressive Immersion (Scroll-triggered)
- Minimal hero → Scroll reveals fullscreen interactive → Info below
- **Verdict:** ✅ Strong contender

### Approach E: Progressive Exploration (RECOMMENDED) ⭐
- Garden-themed hero → Value prop strip → **Scroll-locked Interactive Preview** → Features → Pricing
- **Verdict:** ⭐ **CONSENSUS CHOICE**

---

## 4. Approach E Details

### Key Sections

#### 1. Garden-Themed Hero
```tsx
<CloudShape variant="puffy">
  <h1>Khu Vườn Trên Mây – Học Toán & Tiếng Anh cho bé 2-6 tuổi</h1>
  <p>Gieo hạt giống tri thức, theo dõi tiến độ trên từng tầng mây</p>
  <CloudButton href="/auth/signup">Bắt đầu miễn phí 7 ngày</CloudButton>
</CloudShape>
```

#### 2. Value Prop Strip
- 3 benefit cards: Lộ trình rõ ràng | Mở tầng theo tiến độ | Báo cáo tuần

#### 3. Fullscreen Interactive Preview (THE GAME CHANGER)
```tsx
<section data-scroll-lock>
  <SpeechBubble>👋 Chào con! Chọn vùng mây để khám phá</SpeechBubble>
  <CloudWorldMap previewMode onZoneSelect={handleZoneClick} />
  <CloudButton>Đăng ký ngay để con học thử</CloudButton>
</section>
```

**Conversion Funnel:** Try zone → See "locked" → CTA to unlock

#### 4-6. Keep Existing Sections
- Reuse `section-features.tsx`, `section-pricing-preview.tsx`, `section-faq.tsx`

### Comparison Matrix

| Criteria | A | B | C | D | **E** ⭐ |
|----------|---|---|---|---|---------|
| SEO | 9/10 | 4/10 | 8/10 | 9/10 | **10/10** |
| Mobile UX | 8/10 | 6/10 | 2/10 | 9/10 | **10/10** |
| Kid Engagement | 5/10 | 9/10 | 6/10 | 8/10 | **9/10** |
| Parent Clarity | 9/10 | 5/10 | 6/10 | 8/10 | **10/10** |
| Implementation | Fast | Medium | Slow | Medium | **Medium** |
| Risk | Low | Medium | High | Medium | **Low** |
| Conversion | 6/10 | 7/10 | 4/10 | 8/10 | **9/10** |

---

## 5. Strategic Insight: Split Routes

Homepage serves **two distinct user journeys**:

**Route Structure:**
```
/                 → Parent-focused landing (Approach E)
/try-garden       → Public preview, shareable (NEW)
/kid/garden       → Full immersive garden (EXISTING)
```

**Marketing Strategy:**
1. SEO traffic → `/` → Hero + features → Sign up
2. Social shares → `/try-garden` → Try demo → Sign up modal
3. Returning kids → `/kid/garden` → Direct access

---

## 6. Implementation Plan

### Phase 1: Core CloudGardenHome Component

**Tasks:**
1. Garden-Themed Hero Section
   - Replace dashboard mock with `CloudShape` components
   - H1: "Khu Vườn Trên Mây – Học Toán & Tiếng Anh cho bé 2-6 tuổi"
   - Primary CTA: "Bắt đầu miễn phí 7 ngày"

2. Value Prop Strip
   - 3 visual benefit cards (Seedling, Cloud, Trophy icons)
   - Responsive: 1 column mobile, 3 columns desktop

3. Fullscreen Interactive Preview Section
   - Implement `useScrollLock` hook (IntersectionObserver)
   - Lazy load `CloudWorldMap` component
   - Preview mode: Only "Today" zone unlocked
   - Locked zone click → Sign-up modal

4. Polish Existing Sections
   - Update `section-features.tsx` with cloud icons

5. Testing & Validation
   - Vietnamese encoding: `pnpm check:i18n`
   - Mobile testing (tablets)
   - Lighthouse audit (> 90)

**Deliverables:**
- `src/components/homepage/cloud-garden-home.tsx`
- `src/components/homepage/cloud-garden-home.css`
- `src/hooks/useScrollLock.ts`
- Updated `src/app/(main)/page.tsx`

---

### Phase 2: Public Preview Route `/try-garden`

**Tasks:**
1. New Route & Page
   - `src/app/(main)/try-garden/page.tsx`
   - Full viewport `CloudWorldMap`
   - Limited zones unlocked (Today + Math)

2. Sign-up Conversion Modal
   - Trigger on locked zone click
   - Modal: "Mở khóa tất cả khu vườn" + form

3. Sharing Features
   - OpenGraph tags
   - Share buttons (Facebook, Zalo, copy link)

4. Analytics Tracking
   - Zone interactions
   - Modal open/close rates
   - Sign-ups from `/try-garden`

**Deliverables:**
- `src/app/(main)/try-garden/page.tsx`
- `src/components/try-garden/SignUpModal.tsx`
- Analytics integration

---

### Phase 3: Optimization & A/B Testing

**Tasks:**
1. A/B Test Hero Variants
   - Test CTA copy variations
   - Test headline variations

2. Performance Optimization
   - Image optimization (WebP, AVIF)
   - Font subsetting (Vietnamese glyphs)
   - Critical CSS inlining

3. Enhanced Content
   - Add testimonials section
   - Add animated GIFs/videos
   - Add trust badges

4. Accessibility Audit
   - Keyboard navigation
   - Screen reader testing
   - Color contrast (WCAG AA)

5. SEO Enhancements
   - Content expansion (FAQs for long-tail)
   - Internal linking
   - Schema markup

**Deliverables:**
- A/B test results report
- Performance report
- Accessibility audit report
- SEO improvement checklist

---

## 7. Technical Specifications

### Component Architecture

```
src/components/homepage/
├── cloud-garden-home.tsx         # Main component
├── hero-garden.tsx               # Garden-themed hero
├── value-prop-strip.tsx          # 3 benefit cards
├── interactive-preview.tsx       # Scroll-locked section

src/hooks/
└── useScrollLock.ts              # IntersectionObserver logic

src/app/(main)/
├── page.tsx                      # Homepage route
└── try-garden/page.tsx           # Public preview
```

### Performance Budget

- Bundle Size: < 200KB (gzipped)
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- Time to Interactive: < 3.5s on 3G

### Scroll-Lock Implementation

```tsx
// hooks/useScrollLock.ts
export function useScrollLock() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          sectionRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      },
      { threshold: 0.5 }
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);
  
  return sectionRef;
}
```

---

## 8. Success Criteria

### Launch Criteria (Phase 1)

**Functional:**
- CloudGardenHome renders without errors
- Vietnamese encoding validation passes
- Scroll-lock works on Chrome, Safari, Samsung Internet
- Interactive preview shows CloudWorldMap with locked zones

**Performance:**
- Lighthouse score > 90
- LCP < 2.5s on 3G
- CLS < 0.1

**Responsive:**
- Mobile (375px)
- Tablet (768px, 1024px)
- Desktop (1280px+)

### Post-Launch Metrics (Phase 3)

**Conversion:**
- Target: Sign-up rate > 8% (benchmark: 5%)

**Engagement:**
- Target: Time on page > 2 minutes (current: 45s)
- Target: 60% visitors interact with preview

**SEO:**
- Target: Maintain organic traffic (no > 10% drop)
- Target: Improve rank for "giáo dục trẻ em", "toán tư duy"

---

## 9. Risk Mitigation

**Risk 1: Scroll-Lock Janky on Low-End Devices**
- Mitigation: Test on mid-range Android, fallback to free scroll if needed

**Risk 2: CloudWorldMap Too Heavy**
- Mitigation: Lazy load with suspense, code-split Framer Motion

**Risk 3: SEO Regression**
- Mitigation: Keep existing H1, meta tags, monitor Search Console weekly

**Risk 4: Parents Don't Understand Interactive Section**
- Mitigation: Add SpeechBubble mascot guidance, user testing with 5 parents

**Risk 5: Conversion Rate Drops**
- Mitigation: A/B test (50% old vs. 50% new), 2-week test, 1000+ visitors per variant

---

## 10. Conclusion

### ✅ Consensus Decision: Approach E (Progressive Exploration)

**Why This Wins:**
- Balances parent needs (clear info, SEO) with kid engagement (interactive preview)
- Leverages existing cloud-garden components
- Low risk (incremental changes)
- Mobile-first (scroll-based, large touch targets)
- Conversion-focused (funnel: try → see locked → sign up)

**Key Differentiators:**
- **vs. A:** More immersive, scroll-locked section
- **vs. B:** SEO-friendly, no hidden content
- **vs. C:** Mobile-optimized (no split panels)
- **vs. D:** Value prop strip before interactive (reduces bounce)

### Next Steps

1. ✅ Create brainstorm summary (this document)
2. ⏭️ Invoke `/plan` command for detailed implementation plan with SQL todos
3. Design mockups for garden-themed hero, interactive preview
4. Set up tracking (Google Analytics, Search Console)
5. Kickoff meeting with team

---

**Prepared by:** Brainstormer AI Agent + Product Team  
**Status:** ✅ Ready for Implementation Planning  
**Last Updated:** 2026-03-12
