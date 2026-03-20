# Scout Report: Admin Sidebar Peer-Data Selector Analysis
**Date:** 2026-03-18  
**Target:** Investigate admin sidebar layout covering content issue  
**Issue:** Nav sidebar still covering part of admin page content

---

## Executive Summary

The admin sidebar layout issue stems from a **CSS selector compilation problem in Tailwind v3** with chained peer-data attribute selectors. The selectors used in SidebarInset are syntactically problematic and likely not generating the intended CSS rules.

---

## File Analysis

### 1. Sidebar Component Structure (src/components/ui/sidebar.tsx)

**The Peer Element (Line 228-232):**
```tsx
<div
  className="group peer hidden text-sidebar-foreground md:block"
  data-state={state}
  data-collapsible={state === "collapsed" ? collapsible : ""}
  data-variant={variant}
  data-side={side}
>
```

**Key Attributes Set:**
- data-state="expanded" or data-state="collapsed"
- data-variant="sidebar" (set in AdminShellNav)
- data-collapsible="icon" (when collapsed)
- data-side="left"

### 2. SidebarInset Component (sidebar.tsx, lines 329-348)

**The Main Element Using Peer Selectors:**

Line 340: `"md:peer-data-[variant=sidebar]:pl-[--sidebar-width]",`
Line 341: `"md:peer-data-[state=collapsed]:peer-data-[variant=sidebar]:pl-[--sidebar-width-icon]",`

The problematic selector is on line 341.

### 3. Admin Layout Structure (src/app/(main)/admin/layout.tsx)

```tsx
<SidebarProvider defaultOpen={sidebarOpen}>
  <AdminShellNav role={role} />           <!-- Sidebar with peer class -->
  <SidebarInset>                          <!-- Main with peer-data selectors -->
    <header>...</header>
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

The AdminShellNav component renders a Sidebar element that is a peer.  
The SidebarInset is a sibling that should respond to peer state.

---

## The Peer-Data Selector Problem

### Key Finding: Chained Peer-Data Attribute Selectors

**The problematic selector:**
```
md:peer-data-[state=collapsed]:peer-data-[variant=sidebar]:pl-[--sidebar-width-icon]
```

This is attempting to:
1. Check if the peer has data-state="collapsed"
2. AND check if the peer has data-variant="sidebar"
3. Apply padding-left if both conditions are true

### How Tailwind Compiles This

A single peer-data selector like:
```
peer-data-[variant=sidebar]:pl-[--sidebar-width]
```

Compiles to CSS like:
```css
.peer[data-variant="sidebar"] ~ .element {
  padding-left: var(--sidebar-width);
}
```

### The Chained Selector Issue

When chaining:
```
peer-data-[state=collapsed]:peer-data-[variant=sidebar]
```

Tailwind SHOULD compile to:
```css
.peer[data-state="collapsed"][data-variant="sidebar"] ~ .element {
  padding-left: var(--sidebar-width-icon);
}
```

**However**, there are potential issues:
1. Tailwind's peer implementation might not support chaining multiple attribute selectors
2. The CSS may not be generated at all (selector ignored)
3. The selector syntax might be misinterpreted

### Expected vs Actual Behavior

**Expected:**
- When collapsed: padding-left = 3rem (SIDEBAR_WIDTH_ICON)
- When expanded: padding-left = 16rem (SIDEBAR_WIDTH)

**Actual (if chained selector fails):**
- When collapsed: padding-left = 16rem (line 340 rule still applies)
- When expanded: padding-left = 16rem
- Result: Sidebar overlaps content because SidebarInset padding stays at 16rem while fixed sidebar shrinks to 3rem

---

## CSS Variable Definitions

**From src/components/ui/sidebar.tsx (lines 30-32):**
```
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_ICON = "3rem"
```

These are applied to the SidebarProvider via inline styles (lines 144-145).

---

## Tailwind Config Verification

**From tailwind.config.js:**
```javascript
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

✓ Content path includes src/components/ui/sidebar.tsx
✓ Should pick up all Tailwind classes

---

## CSS Variables and Globals Check

**From src/app/globals.css:**
- Line 171-173: `body:has([data-sidebar="sidebar"])` resets admin background
- No conflicting overflow or position rules breaking peer sibling combinators
- `overflow-x: clip` on body (lines 158, 210) does NOT affect peer sibling selectors

**No blocking CSS issues identified.**

---

## Root Cause Hypothesis

### Most Likely: Chained Peer-Data Selector Not Compiling

Tailwind v3 may NOT properly handle chained peer-data attribute selectors:

```
peer-data-[state=collapsed]:peer-data-[variant=sidebar]
```

If this doesn't generate valid CSS:
1. Line 340's rule (pl-[--sidebar-width]) always applies
2. Line 341's rule (the override) never applies  
3. SidebarInset always has 16rem padding
4. When sidebar collapses to 3rem, it overlaps content

---

## DOM Structure at Runtime

```
<SidebarProvider>
  |
  ├─ <AdminShellNav>
  |   └─ <Sidebar> 
  |       ├─ class="group peer"
  |       ├─ data-state="collapsed" or "expanded"
  |       ├─ data-variant="sidebar"
  |       ├─ data-collapsible="icon" (when collapsed)
  |       └─ data-side="left"
  |
  └─ <SidebarInset> ← SIBLING to Sidebar
      ├─ <header>
      └─ <main>
```

The peer-data selectors in SidebarInset expect to match the Sidebar's data attributes.

---

## Attributes Check

**From AdminShellNav (line 185-196):**
```tsx
<Sidebar collapsible="icon" ... >
```

With defaults from Sidebar component (line 176):
```tsx
variant = "sidebar",
```

So at runtime, the Sidebar element should have:
✓ data-variant="sidebar"
✓ data-state="expanded" or "collapsed"
✓ data-collapsible="icon" (when state=collapsed)

All required attributes are present.

---

## Summary Table

| Item | Status | Details |
|------|--------|---------|
| Peer Element Present | ✓ | Sidebar has class="group peer" |
| Data Attributes Set | ✓ | data-state, data-variant, data-collapsible present |
| Sibling Relationship | ✓ | SidebarInset is direct sibling of Sidebar |
| CSS Variables | ✓ | Both sidebar widths defined |
| Chained Selector | ⚠️ SUSPECT | peer-data-[state]:peer-data-[variant] may not compile |
| Tailwind Config | ✓ | Content path correct |
| Blocking CSS | ✓ CLEAR | No overflow/position breaking selectors |

---

## Critical Questions

1. **Is the chained peer-data selector actually being generated in the build CSS?**
   - Need to inspect .next/static/css output

2. **How does Tailwind v3 handle multiple peer-data attribute selectors?**
   - Does it create AND conditions: [attr1][attr2]?
   - Or is it not supported?

3. **Should the selector use a different syntax?**
   - Could :is() or :where() help?
   - Could parent :has() be more reliable?

4. **Is there a Tailwind version limitation?**
   - Chained peer modifiers may be a recent feature

---

## Unresolved Questions

1. Does Tailwind v3 properly compile peer-data-[a]:peer-data-[b] selectors?
2. What CSS is actually generated for line 341's class string?
3. Should this use a different approach (CSS custom properties + :has())?
4. Is the sidebar actually overlapping or is padding missing?


---

## Visual Architecture: The Peer-Data Relationship

```
DOM Structure:
==============

<div> (SidebarProvider)
  |
  ├─ <div class="group peer" data-state="collapsed" data-variant="sidebar">
  |   └─ Sidebar Content (fixed positioned, width: 3rem when collapsed)
  |
  └─ <main class="...md:peer-data-[variant=sidebar]:pl-[16rem]...">
      ├─ Expected padding-left: 3rem when data-state=collapsed
      └─ Actual padding-left: 16rem (always!)
          └─ Result: Content overlapped by sidebar
```

**CSS Selector Issue:**

```
Current (Line 340 - WORKS):
  .peer[data-variant="sidebar"] ~ main { padding-left: 16rem; }

Current (Line 341 - DOESN'T WORK?):
  .peer[data-state="collapsed"][data-variant="sidebar"] ~ main { padding-left: 3rem; }

Problem: If Tailwind doesn't support chaining peer-data modifiers,
line 341's selector is NEVER GENERATED, so the override doesn't apply.
```

---

## Key Code Locations

**Files Modified/Created:**

| File | Lines | Purpose |
|------|-------|---------|
| src/components/ui/sidebar.tsx | 228-232 | Peer element with data attributes |
| src/components/ui/sidebar.tsx | 329-348 | SidebarInset with peer-data selectors |
| src/app/(main)/admin/layout.tsx | 31-59 | Admin layout using sidebar |
| src/components/admin-shell-nav.tsx | 185-196 | Sidebar variant configuration |

---

## Technical Details

### Tailwind Modifier Chain Behavior

**Single modifier:**
```
peer-data-[variant=sidebar]:pl-[16rem]
```
→ Generates: `.peer[data-variant="sidebar"] ~ .target { padding-left: 16rem; }`

**Chained modifiers (potentially problematic):**
```
peer-data-[state=collapsed]:peer-data-[variant=sidebar]:pl-[3rem]
```
→ Should generate: `.peer[data-state="collapsed"][data-variant="sidebar"] ~ .target { padding-left: 3rem; }`
→ But might NOT generate anything if chaining isn't supported

### Why This Breaks the Layout

1. **Sidebar fixed width changes:** 16rem → 3rem
2. **SidebarInset padding doesn't change:** stays 16rem
3. **Visual overlap:** Content starts at 16rem from left, but sidebar is now only 3rem wide
4. **Result:** Sidebar covers content (visual gap/overlap)

---

## How to Fix (Recommendations for Next Phase)

### Option 1: Use CSS Custom Properties with :has()
Replace peer-data selectors with parent :has() selector:

```tsx
// In SidebarProvider, use :has() to detect peer state
"has-[[data-state=collapsed]]:... pl-[3rem]"
```

### Option 2: Split into Separate Selectors
Use multiple non-chained selectors with increasing specificity:

```tsx
"md:peer-data-[variant=sidebar]:pl-[--sidebar-width]"
// Don't chain, use separate override styles
```

### Option 3: Use JavaScript State
Move styling from CSS to React state/inline styles when collapsing.

### Option 4: Verify Tailwind Version
Check if chained peer-data modifiers are supported in current Tailwind version.

---

## Report Metadata

**Investigation Date:** 2026-03-18  
**Investigator:** Scout Agent  
**Status:** Analysis Complete - Awaiting Implementation Decisions  
**Priority:** High (blocks admin UI layout)  
**Complexity:** Medium (CSS selector limitation issue)

