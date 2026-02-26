# Phase 03: How It Works + Features Sections

## Context Links
- [Plan Overview](plan.md)
- [Phase 02 — Hero + Problem](phase-02-hero-and-problem-sections.md)
- [EdTech Marketing Research](research/researcher-01-edtech-marketing-patterns.md)
- Handover doc: `docs/handover/handover-master-agent-ready.md` §9.1 (user flow)

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 1.5h
- **Description**: Build "How It Works" (4-step numbered flow) and "Key Features/Benefits" (4 benefit cards) sections.

## Key Insights
- "How It Works" should mirror the actual user flow from handover: signup → add child → learn → see report
- Features section frames product capabilities as parent benefits (outcome-focused copy)
- Numbered steps with connecting visual line create clear progression
- 4 features map to core product pillars: Daily Journey, Evidence Ladder, Weekly Report, Safety

## Requirements
### Functional
- How It Works: 4 numbered steps with icon, title, description, connected visually
- Features: 4 benefit cards with icon, headline, description, optional detail list
- Both sections use ScrollReveal with stagger

### Non-Functional
- Steps responsive: horizontal on desktop, vertical on mobile
- Feature cards: 2x2 grid on desktop, single column on mobile

## Architecture
```
src/components/homepage/
  ├── section-how-it-works.tsx   ← Client (ScrollReveal + stagger)
  └── section-features.tsx       ← Client (ScrollReveal + stagger)
```

## Related Code Files
| Action | File |
|--------|------|
| Create | `src/components/homepage/section-how-it-works.tsx` |
| Create | `src/components/homepage/section-features.tsx` |
| Modify | `src/app/page.tsx` (add imports) |

## Implementation Steps

1. **Create `section-how-it-works.tsx`**
   - Section bg: `.hp-section-alt` (light surface background for contrast)
   - Heading: "Bắt đầu trong 3 phút"
   - 4 steps in responsive grid with `.hp-step-number`:
     ```
     Step 1: Icon=UserPlus | "Tạo tài khoản phụ huynh"
       "Đăng ký miễn phí, không cần thẻ tín dụng."
     Step 2: Icon=Baby | "Thêm hồ sơ bé"
       "Nhập tên và tuổi, hệ thống gợi ý lộ trình phù hợp."
     Step 3: Icon=Play | "Bé bắt đầu học 15 phút/ngày"
       "Video ngắn + hoạt động offline + mini quiz tương tác."
     Step 4: Icon=BarChart3 | "Xem báo cáo tiến bộ hàng tuần"
       "Dashboard chi tiết: số phút học, bài hoàn thành, chuỗi ngày liên tiếp."
     ```
   - Visual: numbered circles (1-4) with dotted connecting line between them
   - Staggered animation: each step fades in with 0.15s delay offset

2. **Create `section-features.tsx`**
   - Heading: "Tại sao phụ huynh chọn Cùng Con Tự Học?"
   - 4 benefit cards in `.hp-grid-2` (2x2 desktop, 1-col mobile):
     ```
     Card 1: Icon=Route | "Lộ trình học rõ ràng"
       "Chương trình English + Math theo trình tự từ dễ đến khó, không bỏ sót kiến thức."

     Card 2: Icon=Camera | "Bằng chứng tiến bộ thật"
       "Checklist bài học, điểm quiz, ảnh/audio do phụ huynh ghi nhận — lưu giữ 90-365 ngày."

     Card 3: Icon=Mail | "Báo cáo tuần tự động"
       "Tóm tắt tiến bộ gửi đến email mỗi tuần — phụ huynh nắm rõ mà không cần mở app."

     Card 4: Icon=ShieldCheck | "An toàn, kiểm soát được"
       "Không quảng cáo, không link ngoài. Phụ huynh quản lý thời gian học và nội dung."
     ```
   - Each card: icon in `.hp-icon-box` (brand-500 background tint), title, description
   - ScrollReveal with stagger per card

3. **Update `src/app/page.tsx`** — Add both sections after Problem

4. **Verify build**

## Todo List
- [ ] Create section-how-it-works.tsx with 4 steps
- [ ] Create section-features.tsx with 4 benefit cards
- [ ] Wire into page.tsx
- [ ] Verify responsive layout on mobile
- [ ] Verify build passes

## Success Criteria
- Steps show numbered flow with connecting visual
- Feature cards display in 2x2 grid on desktop, stack on mobile
- Copy is benefit-focused (parent outcomes, not tech features)
- Scroll animations work smoothly

## Risk Assessment
- **Low**: Static content, well-defined patterns
- **Medium**: Step connector line CSS may need fine-tuning for mobile

## Security Considerations
- None

## Next Steps
- Phase 04 adds Social Proof and Product Demo screenshots
