---
title: "VN Legal Policy Update + Signup Alignment"
description: "Skeleton plan cập nhật privacy/terms/cookie policy theo pháp lý VN mới nhất và đồng bộ signup."
status: pending
priority: P1
effort: 6h
branch: main
tags: [legal, privacy, terms, cookie, signup, compliance]
created: 2026-03-26
---

# Mục tiêu
- Cập nhật `privacy`, `terms`, bổ sung `cookie policy` theo kết quả 2 researcher agents.
- Hiển thị chấp thuận chính sách tại signup (ưu tiên parent, cân nhắc reader theo cùng chuẩn).
- Vá các chỗ thiếu link/route pháp lý để tránh dead-end.

# Scope giữ nhỏ (YAGNI/KISS)
- Không làm consent center/cookie banner phức tạp.
- Không thêm legal CMS/versioning.
- Chỉ sửa phần trang policy + signup + điều hướng liên quan.

# Phases
- [ ] Phase 01: Chốt legal baseline + nội dung policy (chờ researcher) -> [phase-01-legal-baseline-and-policy-copy.md](./phase-01-legal-baseline-and-policy-copy.md)
- [ ] Phase 02: Sửa code pages/signup/links + verify -> [phase-02-implementation-and-verification.md](./phase-02-implementation-and-verification.md)

# TODO tổng hợp (file dự kiến sửa/tạo)
- [ ] `src/app/(main)/privacy/page.tsx` (update nội dung + ngày hiệu lực + contact/legal basis)
- [ ] `src/app/(main)/terms/page.tsx` (update điều khoản pháp lý/tuân thủ mới)
- [ ] `src/components/auth-form.tsx` (thêm checkbox/statement đồng ý policy ở signup)
- [ ] `src/app/api/auth/signup/route.ts` hoặc `src/modules/identity/service.ts` (enforce consent nếu chốt server-side)
- [ ] `src/components/site-footer.tsx` (thêm link cookie policy ở cụm pháp lý)
- [ ] `src/app/sitemap.ts` (bổ sung route cookie policy, tránh thiếu index)
- [ ] `src/components/reader/reader-signup-form.tsx` + `src/modules/reader/reader-auth-service.ts` (nếu áp dụng consent cho reader signup)
- [ ] `src/app/api/auth/signup/route.test.ts` (update/add test theo payload mới nếu enforce consent)
- [ ] Tạo mới: `src/app/(main)/cookie-policy/page.tsx`
- [ ] Tạo mới: `src/app/(main)/chinh-sach-cookie/page.tsx` (redirect alias VN)

# Verify commands
- `pnpm lint`
- `pnpm type-check`
- `pnpm test -- src/app/api/auth/signup/route.test.ts`
- `pnpm test` (chạy full nếu có đổi schema auth dùng chung)

# Rủi ro chính
- Diễn giải pháp lý sai/thiếu cập nhật mới -> cần researcher citation + legal owner sign-off.
- Chỉ check UI checkbox, không enforce API -> có thể bypass.
- Sửa schema signup gây vỡ test/flow cũ.

# Unresolved Questions
1. Chốt luật/nghị định/thông tư VN nào bắt buộc phải viện dẫn trực tiếp trong policy bản này?
2. Consent áp dụng cho cả `parent signup` và `reader signup` hay chỉ parent?
3. Có cần lưu evidence consent (timestamp/version/ip) ngay phase này hay defer phase sau?
