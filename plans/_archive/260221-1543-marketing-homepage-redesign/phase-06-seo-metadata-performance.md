# Phase 06: SEO Metadata + Performance Optimization

## Context Links
- [Plan Overview](plan.md)
- [Phase 05 — Pricing/Trust/FAQ/CTA](phase-05-pricing-trust-faq-cta.md)
- [Motion.dev + SEO Research](research/researcher-02-motion-nextjs-seo-patterns.md)
- Current layout metadata: `src/app/layout.tsx` (lines 18-21)

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 1h
- **Description**: Add comprehensive SEO metadata (Open Graph, Twitter, JSON-LD structured data), optimize performance (LCP, lazy loading), and final quality checks.

## Key Insights
- Next.js metadata export in page.tsx overrides layout.tsx defaults
- JSON-LD SoftwareApplication schema helps Google understand the product
- Vietnamese locale `vi_VN` for Open Graph
- LCP optimization: hero section has no images, text-only = fast LCP naturally
- Motion.dev animations should not block render (they don't — CSS transform only)

## Requirements
### Functional
- Full metadata export in page.tsx (title, description, OG, Twitter)
- JSON-LD structured data (SoftwareApplication + AggregateOffer + AggregateRating)
- robots.txt and sitemap considerations (layout.tsx level, not this phase)

### Non-Functional
- LCP < 2.5s on 4G mobile
- No render-blocking resources above fold
- Images (when added) should use Next.js Image with lazy loading
- Reduced motion support already in globals.css

## Architecture
```
src/app/page.tsx    ← Add metadata export + JSON-LD script tag
src/app/layout.tsx  ← Update base metadata with site-wide defaults
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `src/app/page.tsx` (add metadata export + JSON-LD) |
| Modify | `src/app/layout.tsx` (enhance base metadata) |

## Implementation Steps

1. **Update `src/app/layout.tsx` base metadata**
   ```ts
   export const metadata: Metadata = {
     title: { default: "Cùng Con Tự Học", template: "%s | Cùng Con Tự Học" },
     description: "Learning Journey OS cho phụ huynh có con 2-6 tuổi. Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ.",
     metadataBase: new URL("https://cungcontuhoc.vn"),
     openGraph: {
       siteName: "Cùng Con Tự Học",
       locale: "vi_VN",
       type: "website",
     },
     twitter: { card: "summary_large_image" },
   };
   ```

2. **Add homepage-specific metadata in `src/app/page.tsx`**
   ```ts
   export const metadata: Metadata = {
     title: "Cùng Con Tự Học — Lộ trình học tập cho trẻ 2-6 tuổi",
     description: "Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ theo lộ trình. Dùng thử 7 ngày miễn phí.",
     openGraph: {
       title: "Cùng Con Tự Học — Learning Journey cho trẻ 2-6 tuổi",
       description: "15 phút mỗi ngày · Báo cáo tuần · Bằng chứng tiến bộ thật",
       url: "https://cungcontuhoc.vn",
       type: "website",
       locale: "vi_VN",
     },
     alternates: { canonical: "https://cungcontuhoc.vn" },
   };
   ```

3. **Add JSON-LD structured data in page component**
   ```ts
   const jsonLd = {
     "@context": "https://schema.org",
     "@type": "SoftwareApplication",
     name: "Cùng Con Tự Học",
     applicationCategory: "EducationalApplication",
     operatingSystem: "Web",
     inLanguage: "vi",
     offers: {
       "@type": "AggregateOffer",
       lowPrice: "0",
       highPrice: "240000",
       priceCurrency: "VND",
       offerCount: "3",
     },
     // Updated: Validation Session 1 - AggregateRating removed (no real users yet)
     // Add aggregateRating back when real reviews are available
   };
   ```
   - Render as `<script type="application/ld+json">` at top of page component

4. **Performance checklist**
   - Verify no heavy images above fold (hero is text+gradient only)
   - Ensure `motion` is only imported in client components
   - Verify CSS is not excessively large after homepage additions
   - Add `loading="lazy"` to any future img tags in demo section
   - Verify `viewport={{ once: true }}` on all scroll animations (prevents re-renders)

5. **Final build + type check**
   ```bash
   pnpm type-check && pnpm build
   ```

## Todo List
- [ ] Update layout.tsx base metadata
- [ ] Add homepage metadata export to page.tsx
- [ ] Add JSON-LD structured data
- [ ] Performance audit (lighthouse or manual check)
- [ ] Final build + type-check pass
- [ ] Visual QA on mobile + desktop viewports

## Success Criteria
- `<title>` renders correctly in browser tab
- Open Graph meta tags present in page source
- JSON-LD script tag in page source with valid schema
- `pnpm type-check` passes
- `pnpm build` succeeds
- No layout shifts or jank on scroll animations

## Risk Assessment
- **Low**: Metadata is additive, no behavioral changes
- **Note**: `metadataBase` URL should be updated when domain is finalized

## Security Considerations
- No sensitive data in meta tags or JSON-LD
- Ensure canonical URL matches actual deployment domain

## Next Steps
- Homepage implementation complete after this phase
- Future: replace placeholder screenshots with real product captures
- Future: A/B test hero headline variants
- Future: add real testimonials as users onboard
