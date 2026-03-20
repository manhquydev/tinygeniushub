# Phase 05: Pricing Preview + Trust Signals + FAQ + Final CTA

## Context Links
- [Plan Overview](plan.md)
- [Phase 04 — Social Proof + Demo](phase-04-social-proof-and-demo.md)
- Existing pricing page: `src/app/pricing/page.tsx`
- [EdTech Marketing Research](research/researcher-01-edtech-marketing-patterns.md) (§2.3 Pricing)

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 1h
- **Description**: Build 4 remaining sections — pricing comparison preview, trust/security badges, FAQ accordion, and final closing CTA block.

## Key Insights
- Pricing preview is not full pricing page — just a quick comparison teaser linking to /pricing
- Per-day cost anchoring: Standard = ~329 VND/ngày, Family+ = ~658 VND/ngày
- FAQ doubles as objection handling — answer the top reasons parents hesitate
- Final CTA mirrors hero CTA but with urgency ("Bắt đầu ngay hôm nay")
- Trust badges: no credit card, 7-day refund, data security, no ads

## Requirements
### Functional
- Pricing: 2-column plan comparison with CTA to /pricing or /auth/signup
- Trust: 4 badge items (no CC, refund, secure data, no ads)
- FAQ: 5-6 collapsible questions with answers
- Final CTA: dark section, headline, primary CTA button

### Non-Functional
- FAQ uses native `<details>/<summary>` (no JS, accessible)
- Trust badges inline, horizontal on desktop, 2x2 on mobile
- Final CTA section is full-bleed dark gradient

## Architecture
```
src/components/homepage/
  ├── section-pricing-preview.tsx  ← Server component
  ├── section-trust-signals.tsx    ← Server component
  ├── section-faq.tsx              ← Client (ScrollReveal)
  └── section-final-cta.tsx        ← Server component
```

## Related Code Files
| Action | File |
|--------|------|
| Create | `src/components/homepage/section-pricing-preview.tsx` |
| Create | `src/components/homepage/section-trust-signals.tsx` |
| Create | `src/components/homepage/section-faq.tsx` |
| Create | `src/components/homepage/section-final-cta.tsx` |
| Modify | `src/app/page.tsx` (add imports) |

## Implementation Steps

1. **Create `section-pricing-preview.tsx`**
   - Heading: "Đầu tư cho con chỉ từ 329đ/ngày"
   - 2 plan cards side by side in `.hp-grid-2`:
     ```
     Standard (Yearly):
       Price: "120,000đ/năm" with "~329đ/ngày" sub-text
       Features: 3 hồ sơ bé, English + Math, Weekly report, 90 ngày lưu trữ
       CTA: "Chọn Standard" → /auth/signup (solid-button)

     Family+ (Yearly) — RECOMMENDED badge:
       Price: "240,000đ/năm" with "~658đ/ngày" sub-text
       Features: 5 hồ sơ bé, Toàn bộ Standard, 365 ngày lưu trữ, Báo cáo gộp
       CTA: "Chọn Family+" → /auth/signup (solid-button)
     ```
   - Below cards: "Xem chi tiết bảng giá →" link to /pricing
   - Use `.hp-price-card` and `.hp-price-highlight` for Family+

2. **Create `section-trust-signals.tsx`**
   - 4 badges in horizontal flex row:
     ```
     Badge 1: Icon=CreditCard | "Không cần thẻ tín dụng khi dùng thử"
     Badge 2: Icon=RotateCcw | "Hoàn tiền 7 ngày đầu"
     Badge 3: Icon=Lock | "Dữ liệu mã hóa, bảo mật cao"
     Badge 4: Icon=ShieldOff | "Không quảng cáo, không link ngoài"
     ```
   - Each badge: `.hp-badge` with icon + text inline
   - Centered, subtle styling

3. **Create `section-faq.tsx`**
   - Heading: "Câu hỏi thường gặp"
   - 6 FAQ items using `<details>/<summary>` with `.hp-faq-item`:
     ```
     Q1: "Cùng Con Tự Học dành cho trẻ mấy tuổi?"
     A1: "Chương trình thiết kế cho trẻ 2-6 tuổi, với nội dung English và Math phù hợp theo từng độ tuổi."

     Q2: "Dùng thử 7 ngày có miễn phí thật không?"
     A2: "Hoàn toàn miễn phí, không cần nhập thẻ tín dụng. Hết 7 ngày, bạn tự chọn có tiếp tục hay không."

     Q3: "Con tôi chỉ cần học 15 phút mỗi ngày thôi sao?"
     A3: "Đúng vậy. Mỗi bài học gồm video ngắn + hoạt động offline + mini quiz. 15 phút đủ để duy trì thói quen học đều đặn."

     Q4: "Tôi có thể xem con học được gì không?"
     A4: "Có. Dashboard phụ huynh hiển thị bài đã hoàn thành, điểm quiz, chuỗi ngày học. Báo cáo tuần tự động gửi qua email."

     Q5: "Thanh toán như thế nào?"
     A5: "Thanh toán trực tuyến qua chuyển khoản ngân hàng hoặc ví điện tử. Giá chỉ từ 120,000đ/năm — rẻ hơn 1 ly cà phê mỗi tháng."

     Q6: "Nếu không hài lòng, có được hoàn tiền không?"
     A6: "Có. Hoàn tiền 100% trong 7 ngày đầu sau khi thanh toán, không hỏi lý do."
     ```
   - Each `<details>` with smooth open animation (CSS transition on max-height)

4. **Create `section-final-cta.tsx`**
   - Dark gradient background (matching hero palette)
   - Content:
     ```
     H2: "Bắt đầu hành trình học tập cùng con ngay hôm nay"
     P: "Chỉ 15 phút mỗi ngày để tạo thói quen học tập cho con — với bằng chứng tiến bộ rõ ràng cho phụ huynh."
     CTA: "Dùng thử 7 ngày miễn phí" → /auth/signup (solid-button, large)
     <!-- Updated: Validation Session 1 - Remove fake user count -->
     Sub: "Không cần thẻ tín dụng · Hủy bất kỳ lúc nào"
     ```
   - Full-bleed dark section, white text, centered

5. **Update `src/app/page.tsx`** — Add all 4 sections, completing the full homepage

6. **Verify build**

## Todo List
- [ ] Create section-pricing-preview.tsx
- [ ] Create section-trust-signals.tsx
- [ ] Create section-faq.tsx with 6 questions
- [ ] Create section-final-cta.tsx
- [ ] Wire all into page.tsx
- [ ] Verify full page renders correctly
- [ ] Verify build passes

## Success Criteria
- Pricing shows 2 plans with per-day anchoring
- FAQ accordion works with native details/summary
- Trust badges display inline on desktop
- Final CTA is visually prominent with dark background
- All sections animate in smoothly

## Risk Assessment
- **Low**: Static content sections
- **Note**: Pricing data must stay in sync with actual pricing page

## Security Considerations
- Pricing amounts are hardcoded — must match backend plan codes
- FAQ claims (refund policy) must match actual business terms

## Next Steps
- Phase 06 adds SEO metadata and performance optimization
