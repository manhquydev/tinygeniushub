# Phase 04: Social Proof + Product Demo Sections

## Context Links
- [Plan Overview](plan.md)
- [Phase 03 — How It Works + Features](phase-03-how-it-works-and-features.md)
- [EdTech Marketing Research](research/researcher-01-edtech-marketing-patterns.md) (§3 Pre-Launch Social Proof)

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 1.5h
- **Description**: Build testimonials section with fake realistic Vietnamese parent data, and product demo section with placeholder screenshots of key UI screens.

## Key Insights
- Pre-launch testimonials: use realistic Vietnamese names, specific child ages, concrete outcomes
- 4.8 star rating feels more authentic than 5.0
- Product demo should show 3 key screens: Kid learning mode, Parent dashboard, Weekly report
- Placeholder images can use CSS gradient boxes with descriptive labels (replace later with real screenshots)

## Requirements
### Functional
- Testimonials: 3 cards with avatar placeholder, parent name, child age, quote, star rating
- Product Demo: 3 tabbed/stacked screenshots showing core UI screens
- Both sections use ScrollReveal

### Non-Functional
- Avatar placeholders: CSS initials circles (no external images needed)
- Screenshot placeholders: rounded cards with gradient + label text
- Responsive: testimonials in horizontal scroll on mobile, grid on desktop

## Architecture
```
src/components/homepage/
  ├── section-testimonials.tsx    ← Client (ScrollReveal + stagger)
  └── section-product-demo.tsx    ← Client (ScrollReveal)
```

## Related Code Files
| Action | File |
|--------|------|
| Create | `src/components/homepage/section-testimonials.tsx` |
| Create | `src/components/homepage/section-product-demo.tsx` |
| Modify | `src/app/page.tsx` (add imports) |

## Implementation Steps

1. **Create `section-testimonials.tsx`**
   - Section heading: "Phụ huynh nói gì?"
   <!-- Updated: Validation Session 1 - Remove fake user count -->
   - Sub-heading: "Phụ huynh Việt đang đồng hành cùng con mỗi ngày"
   - 3 testimonial cards in `.hp-grid-3`:
     ```
     Testimonial 1:
       Avatar: "TL" (initials circle, pink-ish bg)
       Name: "Chị Thanh Lan"
       Context: "Mẹ bé Minh, 4 tuổi · Đang dùng 3 tháng"
       Quote: "Trước đây tôi cho con xem YouTube cả ngày mà không biết con học được gì.
               Giờ mỗi tối 15 phút, con hoàn thành bài và tôi thấy rõ tiến bộ trong báo cáo tuần."
       Rating: ★★★★★ (5/5)

     Testimonial 2:
       Avatar: "HN" (initials circle, blue bg)
       Name: "Anh Hoàng Nam"
       Context: "Ba bé An và bé Khánh, 3 và 5 tuổi · Gói Family+"
       Quote: "Hai đứa nhà tôi tranh nhau học mỗi ngày. Bé lớn tự đếm được 1-50 sau 1 tháng,
               điều mà trước đây dạy hoài không vào."
       Rating: ★★★★★ (5/5)

     Testimonial 3:
       Avatar: "MT" (initials circle, green bg)
       Name: "Chị Mai Trang"
       Context: "Mẹ bé Sóc, 2.5 tuổi · Đang dùng thử"
       Quote: "Tôi thích là có bằng chứng bằng ảnh và audio. Gửi cho ông bà xem
               là cả nhà vui, ai cũng thấy cháu tiến bộ."
       Rating: ★★★★☆ (4/5)
     ```
   - Each card: `.hp-testimonial-card` with avatar circle, quote in italic, attribution below
   - Star rating rendered as Lucide `Star` icons (filled/outline)

2. **Create `section-product-demo.tsx`**
   - Section bg: `.hp-section-alt`
   - Heading: "Trải nghiệm thật sự trên Cùng Con Tự Học"
   - 3 demo cards in horizontal layout (scrollable on mobile):
     ```
     Screen 1: "Kid Learning Mode"
       Placeholder: gradient card (warm yellow → light green)
       Label: "Bé hoàn thành bài học với video + quiz tương tác"
       Icon: Play

     Screen 2: "Parent Dashboard"
       Placeholder: gradient card (soft blue → white)
       Label: "Phụ huynh theo dõi tiến bộ và quản lý hồ sơ bé"
       Icon: LayoutDashboard

     Screen 3: "Weekly Report"
       Placeholder: gradient card (light green → white)
       Label: "Báo cáo tuần chi tiết gửi qua email"
       Icon: FileBarChart
     ```
   - Each card: 16:10 aspect ratio, rounded corners, shadow, label overlay at bottom
   - Note in code comment: "Replace gradient placeholders with real screenshots"

3. **Update `src/app/page.tsx`** — Add both sections

4. **Verify build**

## Todo List
- [ ] Create section-testimonials.tsx with 3 testimonial cards
- [ ] Create section-product-demo.tsx with 3 placeholder screens
- [ ] Wire into page.tsx
- [ ] Verify responsive (horizontal scroll on mobile for demo)
- [ ] Verify build passes

## Success Criteria
- Testimonials show realistic Vietnamese parent quotes with initials avatars
- Product demo shows 3 distinct placeholder screens
- Star ratings render correctly
- Both sections animate in on scroll

## Risk Assessment
- **Low**: Static content, no API dependency
- **Note**: Placeholder screenshots need replacing with real UI captures before launch

## Security Considerations
- Fake testimonials should not claim regulatory endorsement or false credentials

## Next Steps
- Phase 05 adds Pricing preview, Trust signals, FAQ, and Final CTA
