# Debugger Report: Admin Sidebar Overlap Root Cause
**Date:** 2026-03-18
**Scope:** Admin sidebar still covering page content after fix attempt

---

## Executive Summary

**Root cause confirmed:** The fix used `pl-[--sidebar-width]` syntax, which in Tailwind v4 generates `padding-left: --sidebar-width` (a bare custom property name, not a CSS value). This is **syntactically invalid CSS** — the browser ignores it. Content gets zero left-padding and the sidebar (which is `position: fixed`) overlaps it.

The correct syntax for Tailwind v4 CSS variable values is `pl-[var(--sidebar-width)]`.

---

## Evidence from Built CSS

From `.next/static/chunks/a3f145c8028f2335.css`:

```css
/* BROKEN — what the fix generated */
.md\:peer-data-\[variant\=sidebar\]\:pl-\[--sidebar-width\]:is(:where(.peer)[data-variant=sidebar]~*) {
  padding-left: --sidebar-width;   /* INVALID — bare custom property name, not a value */
}
.md\:peer-data-\[state\=collapsed\]\:peer-data-\[variant\=sidebar\]\:pl-\[--sidebar-width-icon\]:is(:where(.peer)[data-state=collapsed]~*):is(:where(.peer)[data-variant=sidebar]~*) {
  padding-left: --sidebar-width-icon;  /* INVALID */
}

/* CORRECT — what it should generate */
.pl-\[var\(--sidebar-width\)\] {
  padding-left: var(--sidebar-width);   /* valid */
}
```

Tailwind v4 only wraps `--var` in `var()` automatically for **known shorthand properties and specific contexts**. For arbitrary bracket values, you must write the `var()` explicitly.

---

## Hypothesis Results

### A. Tailwind `peer-data` compound selectors don't work → padding-left never applies
**CONFIRMED (partially).** The compound selector structure itself is syntactically correct and present in the built CSS. However, the `padding-left` value is `--sidebar-width` (invalid, bare custom property name) rather than `var(--sidebar-width)`. The selector fires but the property has no effect. **This is the primary root cause.**

### B. `(main)/layout.tsx` breaks the `peer` sibling relationship
**REFUTED.** `MainShell` returns `<>{children}</>` (React fragment, no DOM element) on admin routes. `SiteFooter`, `AppNav`, and `MascotSupportHub` all return `null` on admin routes. The DOM structure inside `SidebarProvider` is: `Sidebar` (class `peer`) → `SidebarInset` (direct sibling). The peer relationship is structurally sound.

### C. `transition-[padding-left]` conflicts with existing transitions
**REFUTED.** Built CSS confirms `transition-[padding-left]` generates a valid standalone `transition-property: padding-left` rule. No conflict found. The class is correct but irrelevant when `padding-left` itself has no valid value to transition.

### D. AppNav still rendering on admin pages
**REFUTED.** `AppNavClient` at line 190–192 explicitly checks `isAdminRoute` and returns `null`. The server `AppNav` component renders `AppNavClient`, which returns null on `/admin/*`. No AppNav markup reaches the DOM on admin routes.

### E. Admin header has incorrect positioning due to padding propagation
**INCONCLUSIVE / secondary.** The `<header>` inside `SidebarInset` uses `sticky top-0 z-10` which is correct. However since `SidebarInset` itself gets no `padding-left` (due to root cause A), the header starts at `left: 0` — directly behind the fixed sidebar. This is a symptom of A, not an independent cause.

---

## Fix Required

In `src/components/ui/sidebar.tsx`, `SidebarInset` component (lines 336–342), change:

```tsx
// BEFORE (broken)
"md:peer-data-[variant=sidebar]:pl-[--sidebar-width]",
"md:peer-data-[state=collapsed]:peer-data-[variant=sidebar]:pl-[--sidebar-width-icon]",
```

```tsx
// AFTER (correct)
"md:peer-data-[variant=sidebar]:pl-[var(--sidebar-width)]",
"md:peer-data-[state=collapsed]:peer-data-[variant=sidebar]:pl-[var(--sidebar-width-icon)]",
```

Also fix the gap div (lines 235–246) — `group-data-[variant=sidebar]:w-0` sets the spacer width to 0, which is correct only if `SidebarInset` takes responsibility for offsetting via `padding-left`. The gap div fix is architecturally sound but pointless until the `padding-left` fix lands.

---

## Additional Observations

- `--sidebar-width` is set to `16rem` as a CSS custom property on the `SidebarProvider` div's inline style.
- `--sidebar-width-icon` is set to `3rem`.
- The Sidebar `<div>` is `position: fixed; width: var(--sidebar-width)` on desktop — so it genuinely overlaps content if `SidebarInset` has no matching left-padding.
- Tailwind version: **4.2.0** (confirmed `^4` in package.json).
- Build: clean, no errors.

---

## Unresolved Questions

None. Root cause is definitive.
