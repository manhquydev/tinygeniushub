# Phase 5: User-Facing Brand Text

## Context Links
- Scout report: lines 136–206
- 44+ occurrences across UI pages, emails, meta tags, PDFs, and share messages

## Overview
- **Priority**: P1 (High)
- **Status**: completed (2026-05-08)
- **Effort**: ~3h
- Replace all user-facing text `"Cùng Con Tự Học"` → `"TinyGenius Hub"` and `"Cung Con Tu Hoc"` → `"TinyGenius Hub"`.

## Replace Patterns

| Find Pattern | Replace With | Context |
|-------------|-------------|---------|
| `Cùng Con Tự Học` | `TinyGenius Hub` | Brand name in Vietnamese contexts |
| `Cung Con Tu Hoc` | `TinyGenius Hub` | ASCII-only variant (Stripe, some strings) |

## Files to Modify — Grouped by Area

### A. Page Metadata (titles, OG, canonical, JSON-LD)

| # | File | Lines | Context |
|---|------|-------|---------|
| 1 | `src/app/(main)/page.tsx` | 8,21,31,36,45,62,74,81,105 | Page title, OG title/image, JSON-LD name |
| 2 | `src/app/(main)/courses/page.tsx` | 25 | `title: "Khóa học cho bé - Cùng Con Tự Học"` |
| 3 | `src/app/(main)/courses/[slug]/page.tsx` | 70,82 | Course list/detail titles |
| 4 | `src/app/(main)/pricing/page.tsx` | 14 | `"Bảng giá khóa học — Cùng Con Tự Học"` |
| 5 | `src/app/(main)/for-schools/page.tsx` | 6,11 | Page title + OG |
| 6 | `src/app/(main)/try-garden/page.tsx` | 8,11,16 | Title, keywords, OG siteName |
| 7 | `src/app/(main)/about/page.tsx` | 7,17,43,67 | About page content |
| 8 | `src/app/(main)/contact/page.tsx` | 8 | Page title |
| 9 | `src/app/(main)/privacy/page.tsx` | 6,15,91,92 | Privacy policy |
| 10 | `src/app/(main)/terms/page.tsx` | 6,15 | Terms page |
| 11 | `src/app/(main)/refund-policy/page.tsx` | 6 | Page title |
| 12 | `src/app/(main)/cookie-policy/page.tsx` | 8,17 | Page title |
| 13 | `src/app/(main)/waitlist/page.tsx` | 8 | Page title |
| 14 | `src/app/(main)/referral/page.tsx` | 11 | Page title |
| 15 | `src/app/(main)/gift-code/page.tsx` | 5,6 | Page title |
| 16 | `src/app/(main)/teacher/dashboard/page.tsx` | 8 | Page title |
| 17 | `src/app/(main)/parent/billing/page.tsx` | 9 | Page title |
| 18 | `src/app/(main)/feed.xml/route.ts` | 55,57 | RSS feed title/description |
| 19 | `src/app/(main)/blog/head.tsx` | 6 | Blog RSS head |
| 20 | `src/app/(admin-login)/admin/login/page.tsx` | 6 | Admin page title |

### B. Layout Components

| # | File | Lines | Context |
|---|------|-------|---------|
| 21 | `src/components/app-nav-client.tsx` | 201,206 | aria-label, logo alt text |
| 22 | `src/components/site-footer.tsx` | 53,76,90,104,125,179 | aria-labels, copyright text |
| 23 | `src/components/homepage/section-hero.tsx` | 46 | Hero section span text "Cung Con Tu Hoc" |
| 24 | `src/components/homepage/section-product-demo.tsx` | 90 | Mock email "From" field |
| 25 | `src/components/homepage/section-testimonials.tsx` | 13 | Testimonial text |
| 26 | `src/components/admin-login-form.tsx` | 50 | Admin login page heading |
| 27 | `src/components/gift-code-form.tsx` | 49 | Activation success message |
| 28 | `src/app/not-found.tsx` | 41 | 404 page text |

### C. Email Content (Lifecycle + Transactional)

| # | File | Lines | Context |
|---|------|-------|---------|
| 29 | `src/lib/auth/better-auth.ts` | 61,71 | Password reset email body & subject |
| 30 | `src/lib/email/project-email-template-builder.ts` | 23,161,360,378,382 | Footer, brand label, alt text |
| 31 | `src/lib/email/caregiver-invite-email.ts` | 27 | Invite email subject |
| 32 | `src/modules/identity/parent-email-verification-service.ts` | 82,91 | Email verification body & subject |
| 33 | `src/modules/platform/lifecycle-email-copy-builder.ts` | 34,38,47,66,87,106,129,150,173 | Welcome email, signatures (8+ occurrences) |
| 34 | `src/modules/platform/lifecycle-email-service.ts` | 80 | Unsubscribe notice |
| 35 | `src/worker/jobs/verify-blog-comment-email.ts` | 19,22 | Blog comment verification email |
| 36 | `src/app/api/webhooks/package-subscription/route.ts` | 387,392,456,461 | Payment success/failure emails |
| 37 | `src/app/api/contact/route.ts` | 31,53,63 | Contact form emails |
| 38 | `src/app/api/waitlist/route.ts` | 39,44 | Waitlist confirmation email |
| 39 | `src/app/api/email/marketing/unsubscribe/route.ts` | 26 | Unsubscribe page heading |
| 40 | `src/app/api/blog/comments/unsubscribe/route.ts` | 24 | Comment unsubscribe page heading |

### D. Share & Referral

| # | File | Lines | Context |
|---|------|-------|---------|
| 41 | `src/modules/sharing/share-link-builder.ts` | 37 | Share message text |
| 42 | `src/components/try-garden/share-buttons.tsx` | 22 | Share URL default |

### E. PDF Reports

| # | File | Lines | Context |
|---|------|-------|---------|
| 43 | `src/app/api/reports/[reportId]/pdf/route.ts` | 298 | PDF report brand header |
| 44 | `src/modules/reports/weekly-report-service.ts` | 189 | Report recommendation text |

### F. SEO

| # | File | Lines | Context |
|---|------|-------|---------|
| 45 | `src/lib/seo/course-jsonld.ts` | 13 | Organization `name` |
| 46 | `src/app/(main)/blog/[slug]/opengraph-image.tsx` | 35-36,65 | OG image label |

## Implementation Strategy

1. **Bulk replace Vietnamese text**: `rg "Cùng Con Tự Học" -l` to find all files, then edit each.
2. **Bulk replace ASCII text**: `rg "Cung Con Tu Hoc" -l` (case sensitive, handles Stripe + hero span).
3. **Manual review for nuance**: Some occurrences like `"Cùng con tự học"` (lowercase) or sentence fragments. Read surrounding 5 lines for context.
4. **Build**: `pnpm build` to catch any broken imports or type mismatches.

## Important Notes

- **Do NOT change** URLs or email addresses in this phase — those are Phases 2 and 3.
- **Do NOT change** `ecosystem.config.js` comment (Phase 1) or script header comments (Phase 8) — this phase is **user-facing text only**.
- **Page titles with pipe format** like `"Khóa học cho bé - Cùng Con Tự Học"` → `"Khóa học cho bé - TinyGenius Hub"` — keep the format, just change the brand name portion.
- **Vietnamese diacritics**: `Cùng` and `Cung` are different — run both searches.
- **Plans archive** (`plans/_archive/`): Skip entirely.

## Acceptance Criteria
- [x] `rg "Cùng Con Tự Học" src/` returns 0 results
- [x] `rg "Cung Con Tu Hoc" src/` returns 0 results
- [x] `pnpm build` succeeds
- [x] Quick smoke: load homepage, check `<title>` tag in browser
- [x] Quick smoke: trigger password reset email, check subject and body

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Vietnamese string in template literals missed | Use `rg "Cùng[[:space:]]Con[[:space:]]Tự[[:space:]]Học"` for flexible whitespace |
| Email copy mentions "Cùng Con Tự Học" in user-facing text but is system-generated | All email services are listed in section C above. Review each file. |
| SEO impact from title changes | Organic — new brand name. Google will re-index. 301 redirects from Phase 2 handle domain change. |

## Next Steps
- Phase 6 (Logos) — the alt text references "Cùng Con Tự Học" which this phase handles.
- Phase 10 (Docs) — same brand text appears in docs.
