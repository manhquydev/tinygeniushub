# Phase 01 - Legal Baseline + Policy Copy (Pending researcher input)

## Overview
- Priority: P1
- Status: pending
- Mục tiêu: chốt checklist pháp lý VN mới nhất và map vào mục cụ thể trong privacy/terms/cookie policy.

## Inputs bắt buộc
- `plans/reports/researcher-1-*.md`
- `plans/reports/researcher-2-*.md`

## TODO
- [ ] Hợp nhất 2 report: danh sách yêu cầu pháp lý bắt buộc vs nên có.
- [ ] Chốt cấu trúc mục cho 3 trang: `privacy`, `terms`, `cookie-policy`.
- [ ] Chốt copy ngắn gọn cho consent text tại signup.
- [ ] Chốt có/không lưu consent evidence ở backend trong phase này.

## File dự kiến sửa/tạo
- Modify: `src/app/(main)/privacy/page.tsx`
- Modify: `src/app/(main)/terms/page.tsx`
- Create: `src/app/(main)/cookie-policy/page.tsx`
- Create: `src/app/(main)/chinh-sach-cookie/page.tsx`

## Success Criteria
- Có bản nội dung final cho 3 policy pages.
- Có danh sách rõ "must-have" và "defer" để không nở scope.

## Risk
- Research conflict giữa 2 agent -> cần ưu tiên nguồn chính thức + ngày hiệu lực.

## Unresolved Questions
1. Mục nào bắt buộc phải nêu “độ tuổi”, “dữ liệu trẻ em”, “quyền chủ thể dữ liệu” cụ thể đến mức nào?
