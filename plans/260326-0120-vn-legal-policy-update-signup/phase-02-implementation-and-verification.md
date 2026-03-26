# Phase 02 - Implementation + Verification

## Overview
- Priority: P1
- Status: pending
- Mục tiêu: cập nhật UI/API theo baseline phase 01 và verify không vỡ luồng signup.

## TODO
- [ ] Update `privacy` + `terms` page theo copy đã chốt.
- [ ] Tạo `cookie-policy` page + alias redirect VN.
- [ ] Thêm links cookie policy tại footer và sitemap.
- [ ] Thêm consent text/checkbox ở signup UI.
- [ ] (Nếu chốt) enforce consent ở API/schema signup.
- [ ] Cập nhật test signup tương ứng.

## File dự kiến sửa/tạo
- Modify: `src/components/auth-form.tsx`
- Modify: `src/app/api/auth/signup/route.ts`
- Modify: `src/modules/identity/service.ts`
- Modify: `src/components/site-footer.tsx`
- Modify: `src/app/sitemap.ts`
- Optional modify: `src/components/reader/reader-signup-form.tsx`
- Optional modify: `src/modules/reader/reader-auth-service.ts`
- Modify: `src/app/api/auth/signup/route.test.ts`
- Modify: `src/app/(main)/privacy/page.tsx`
- Modify: `src/app/(main)/terms/page.tsx`
- Create: `src/app/(main)/cookie-policy/page.tsx`
- Create: `src/app/(main)/chinh-sach-cookie/page.tsx`

## Verify
- `pnpm lint`
- `pnpm type-check`
- `pnpm test -- src/app/api/auth/signup/route.test.ts`
- Manual smoke:
  - `/auth/signup` hiển thị legal consent text + links hoạt động.
  - `/privacy`, `/terms`, `/cookie-policy` render tốt cả mobile/desktop.

## Risk + Mitigation
- Risk: regression signup.
  - Mitigation: giữ payload backward-compatible nếu chưa enforce server-side.
- Risk: dead link/SEO thiếu route.
  - Mitigation: update `sitemap.ts` + footer + manual click-through.

## Unresolved Questions
1. Nếu enforce consent API ngay: field name chuẩn là `acceptedLegal` hay `legalConsent`?
