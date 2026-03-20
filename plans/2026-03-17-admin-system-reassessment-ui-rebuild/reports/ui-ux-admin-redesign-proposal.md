# UI/UX Admin Redesign Proposal

Date: 2026-03-17
Goal: rebuild admin UI shell for clarity + consistency, keep all business logic intact.

## Current UI Problems (observed)

1. Navigation overload in one dense sidebar; hierarchy not obvious at first glance.
2. Mobile nav is a long horizontal list, low discoverability for deep modules.
3. Page headers inconsistent (`card` style pages mixed with ad-hoc border headers).
4. Shared admin classes (`admin-table`, `admin-controls`) exist but visual language still fragmented.
5. Operations and security info architecture split across many places; cognitive load high.
6. Several giant components block fast UI iteration because state + network + rendering tightly coupled.

## Proposed Information Architecture (shell-level)

- **Dashboard**: overview, analytics
- **Learners**: users, courses, content
- **Commerce & Ops**: payments/webhooks/coupons/gift-codes/export/ops
- **Publishing**: blog and sub-pages
- **System**: organizations, staff, security, logs (super-admin)

## Design Direction (for this session)

- Keep neutral/teal brand accent.
- Use 3-layer layout:
  1. sticky topbar (context + actions + session)
  2. sidebar (desktop) / drawer (mobile)
  3. content canvas with uniform spacing and section cards
- Emphasize scanability:
  - section titles + helper text
  - clear active state and group labels
  - compact badges for role/system status

## UI Primitives to introduce

- `admin-shell-root`, `admin-shell-topbar`, `admin-shell-sidebar`, `admin-shell-content`
- `admin-page-header`, `admin-page-title`, `admin-page-subtitle`, `admin-page-actions`
- `admin-surface-card`, `admin-surface-muted`, `admin-kpi-grid`
- preserve existing utility classes (`admin-controls`, `admin-table*`) for compatibility.

## State & Interaction Rules

- Mobile-first:
  - sidebar becomes collapsible drawer.
  - topbar contains module quick-jump and profile/logout action.
- Desktop:
  - fixed sidebar + scrollable content.
  - active route + active parent group always visible.
- No route/business change in pass 1.

## Implementation Phases (UI)

1. Refactor `admin/layout.tsx` frame.
2. Refactor `admin-shell-nav.tsx` structure + active state visuals.
3. Add/adjust admin shell classes in `globals.css`.
4. Normalize top-level admin page headers (`overview`, `analytics`, `operations`, `blog`) using shared shell primitives.

## Risks

- Regression in role-gated links if nav filtering changed incorrectly.
- Visual regressions on small screens if drawer/topbar spacing wrong.
- Existing panel styles may clash with new shell spacing.

## Validation checklist

- Route access still protected (`/admin/login` redirect when no session).
- Super admin only items hidden for non-super-admin.
- Desktop + mobile nav both functional.
- Existing pages still render existing data/actions.

## Unresolved questions

1. Có thêm search command-palette cho admin ngay ở pass này không?
2. Có cần gom `/admin/operations` + `/admin/log` vào cùng một module hub page?
3. Có chấp nhận đổi tone từ dark-sidebar sang light-sidebar để đồng bộ thẩm mỹ hiện tại?
