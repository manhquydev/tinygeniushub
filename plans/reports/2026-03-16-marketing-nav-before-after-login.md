# Marketing Research Report: Navigation Before vs After Login

- Date: 2026-03-16
- Scope: Cung Con Tu Hoc web app (Next.js App Router)
- Agent flow used: marketing-research -> marketing-planning

## Executive Summary

Current navigation does not match the intended conversion funnel. The biggest gap is guest nav missing direct access to `/pricing` and `/courses`, while the main CTA says "Mua khóa học". This creates friction for users still in evaluation mode.

After login, nav still mixes marketing links (`/about`, `/blog`) with core parent tasks. That weakens activation focus and increases cognitive load.

Recommended model:
- Guest nav = acquisition funnel (discover -> compare -> decide -> signup)
- Logged-in nav = activation/retention funnel (daily usage -> progress visibility -> billing/account)

## Evidence From Current Codebase

1. Guest nav items currently: `/for-schools`, `/about`, `/blog` + auth actions.
   - Source: `src/components/app-nav-client.tsx`
2. Guest nav test path expects pricing flow (`/` -> `/pricing` -> `/blog`).
   - Source: `tests/e2e/guest-navigation.spec.ts`
3. Homepage and funnel content already emphasize pricing and course exploration.
   - Source: `src/components/homepage/section-hero.tsx`, `src/app/(main)/page.tsx`
4. Logged-in top nav currently includes marketing links before dashboard links.
   - Source: `src/components/app-nav-client.tsx`
5. Analytics utility has no explicit nav click event for funnel attribution.
   - Source: `src/lib/analytics/track-event.ts`

## Core Diagnosis

### Pre-login (Guest)

- Navigation intent mismatch:
  - User expectation: "Xem khóa học", "Xem bảng giá", "Cách học hoạt động"
  - Current top-level links: "Cho trường học", "Giới thiệu", "Blog"
- Primary CTA wording is too BOFU for cold traffic:
  - Current: "Mua khóa học"
  - Better for mixed traffic: "Bắt đầu miễn phí" or "Xem gói học"

### Post-login (Parent)

- Activation distraction:
  - Marketing links remain in primary nav, competing with parent task paths.
- Primary jobs-to-be-done after login should dominate top nav:
  - Theo dõi tiến độ
  - Quản lý hồ sơ bé
  - Tiếp tục lộ trình học
  - Xem báo cáo
  - Quản lý gói/thanh toán

## Recommended Navigation Architecture

## A) Guest Nav (Before Login)

- Left (primary discovery):
  - `Khóa học` -> `/courses`
  - `Bảng giá` -> `/pricing`
  - `Cách hoạt động` -> `/#features` (or dedicated section/page)
  - `Cho trường học` -> `/for-schools` (optional, can move to overflow)
- Right (actions):
  - `Đăng nhập` -> `/auth/login`
  - Primary CTA button: `Bắt đầu miễn phí` -> `/auth/signup`
- De-prioritize to footer or overflow:
  - `/about`, `/blog`

Target: reduce choice overload, increase pricing/signup intent from top nav.

## B) Logged-in Nav (After Login)

- Left (activation/retention core):
  - `Tổng quan` -> `/parent/dashboard`
  - `Hồ sơ bé` -> `/parent/children`
  - `Khóa học` -> `/parent/courses`
  - `Báo cáo` -> `/parent/reports`
  - `Gói dịch vụ` -> `/parent/billing`
- Right:
  - Notification center
  - Account/Profile menu (contains: Blog, Giới thiệu, Trợ giúp, Đăng xuất)

Target: maximize daily parent actions and report consumption.

## C) Mobile Prioritization

- Guest mobile menu order:
  1. Khóa học
  2. Bảng giá
  3. Cách hoạt động
  4. Đăng nhập
  5. CTA: Bắt đầu miễn phí
- Logged-in mobile menu order:
  1. Tổng quan
  2. Hồ sơ bé
  3. Khóa học
  4. Báo cáo
  5. Gói dịch vụ
  6. Đăng xuất

## KPI Framework (Must Track)

## Acquisition KPIs (guest nav)

- `nav_to_pricing_ctr` = click `/pricing` from nav / sessions
- `nav_to_courses_ctr` = click `/courses` from nav / sessions
- `nav_to_signup_ctr` = click `/auth/signup` from nav / sessions
- `signup_start_rate` and `signup_complete_rate`

## Activation KPIs (logged-in nav)

- `dashboard_to_first_action_time` (median)
- `% users visiting /parent/reports within D1/D7`
- `% users visiting /parent/courses within D1`
- `report_viewed` frequency/user/week

## Instrumentation Gap

Current analytics map has no generic nav click event. Add:
- `nav_click` with params:
  - `state`: `guest | parent`
  - `location`: `desktop_top | mobile_panel`
  - `label`
  - `href`

This is required before any nav A/B test.

## Suggested A/B Tests

1. CTA text (guest):
   - Variant A: `Bắt đầu miễn phí`
   - Variant B: `Xem gói học`
   - Primary metric: `nav_to_signup_ctr`, secondary: `signup_complete_rate`

2. Guest nav structure:
   - Variant A: include `Cho trường học` in top nav
   - Variant B: move `Cho trường học` to footer
   - Primary metric: `nav_to_pricing_ctr`, secondary: bounce rate on homepage

## Priority Backlog

P0
- Replace guest top links with funnel-first links (`/courses`, `/pricing`, `/#features`)
- Update guest CTA wording from BOFU hard-sell to trial/consideration CTA
- Add nav analytics events

P1
- Move `/about` and `/blog` out of post-login primary nav into account/help area
- Add role-aware nav labels (`Tổng quan` instead of mixed English `Dashboard`)

P2
- Run 2 nav A/B tests above for 2-3 weeks each
- Keep winner and roll out globally

## Assumptions

- Business objective for top nav is conversion + activation, not pure content discovery.
- `/for-schools` remains important but secondary for consumer parent funnel.
- Parent dashboard remains main post-login hub.

## Open Questions

1. Is guest CTA strategy currently trial-led or direct purchase-led by business policy?
2. Is `/for-schools` a strategic acquisition channel in the next 90 days?
3. Do you want bilingual nav labels or fully Vietnamese labels in top nav?
