# Brainstorm Report: Admin Frontend Full Rebuild
**Date:** 2026-03-18
**Status:** Completed — ready for planning

---

## Problem Statement

Rebuild toàn diện admin frontend từ custom CSS sang shadcn/ui component system.
Mục tiêu: Dark Pro style (Vercel/Linear), professional, maintainable, scalable.

## Context (Current State)

- 13 admin modules (7 complete, 6 partial, 2 gaps)
- No component library — ~800 custom CSS classes in globals.css
- Tailwind v4 + React 19 + Next.js 16.1.6
- recharts@3.7.0 already installed
- framer-motion@12.35.2 already installed
- Controller hook pattern — well-structured business logic (keep intact)

## Evaluated Approaches

### Option A: Add shadcn/ui (Recommended ✅)
- Install shadcn/ui (@canary for Tailwind v4 compatibility)
- Use shadcn/ui Chart wrappers (native Recharts integration)
- Dark sidebar via shadcn SidebarProvider + CSS vars
- Gradually replace ~800 globals.css classes as components are rebuilt
- **Pros:** Quality components, fast iteration, no lock-in (copied into codebase)
- **Cons:** Migration effort, need @canary CLI workaround

### Option B: Refactor existing custom CSS
- Modularize globals.css into CSS modules
- No new dependencies
- **Pros:** No new deps, familiar patterns
- **Cons:** Still reinventing wheels, no accessibility primitives, no component ecosystem

### Option C: Radix UI primitives directly
- Build from Radix primitives, self-style
- **Pros:** Maximum control
- **Cons:** Most code, slowest, shadcn/ui already does this better

## Final Recommended Solution

**shadcn/ui (@canary) + existing Recharts + existing Framer Motion + Tailwind v4**

### Design System
```
Sidebar:       #0f1117 (near-black, like Vercel)
Content:       #f8fafc (slate-50)
Cards:         white + subtle slate border
Accent:        #0d9488 (teal — existing brand, preserved)
Text primary:  slate-900
Text muted:    slate-500
```

### Key Technical Decisions
1. `npx shadcn@canary init` — avoids CLI validation failure on Tailwind v4 CSS-first config
2. Keep minimal `tailwind.config.js` for shadcn CLI compatibility
3. shadcn `Sidebar` component for shell navigation (SidebarProvider pattern)
4. shadcn Chart components (wrapping existing Recharts) for analytics
5. **Business logic hooks/controllers: unchanged** — only visual layer swapped
6. CSS migration: delete old globals.css admin classes only after component rebuilt

### Template References
- Shadcn Admin: github.com/satnaing/shadcn-admin (2.8K★) — reference for Dark Pro sidebar
- Next.js Shadcn Dashboard Starter: github.com/Kiranism/next-shadcn-dashboard-starter
- Official blocks: ui.shadcn.com/blocks (Dashboard-01, Sidebar-07)

## Implementation Phases

| Phase | Scope |
|-------|-------|
| 1 | Install shadcn/ui, design tokens, dark theme CSS vars |
| 2 | Rebuild admin shell: sidebar, topbar, layout wrapper |
| 3 | Shared components: Card, Table, Badge, Button, Input, Dialog, Tabs |
| 4 | Overview + Analytics pages (KPI cards + Recharts charts) |
| 5 | Users + Content pages |
| 6 | Operations + Security + Gift Codes + Courses pages |
| 7 | Blog CMS + Staff + Log + Organizations pages |
| 8 | Visual polish, CSS cleanup, regression tests |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| shadcn CLI validation failure | Use `@canary` version |
| Transparent component backgrounds | Re-add components via CLI after install |
| Functionality regression | Keep all hooks/controllers unchanged |
| Scope creep | Sequential phases, each must compile before next |
| globals.css 800 classes | Delete old classes only when component rebuilt |

## Success Metrics
- All 13 modules visually consistent
- Mobile responsive (existing requirement)
- Vietnamese localization preserved
- No functional regression
- Zero build errors
- All existing tests pass
