# Research Report: shadcn/ui Sidebar collapsible="icon" Mode Internals

**Date:** 2026-03-18
**Researcher:** researcher-1
**Project:** cungcontuhoc
**Status:** Complete

## Executive Summary

- **data-collapsible attribute** flows from Sidebar prop through the component tree, set on the root Sidebar div when `state === "collapsed"` (line 230 in sidebar.tsx)
- **group-data-[collapsible=icon]:* selectors** use Tailwind's group variant to target ALL descendants of `.group/sidebar-wrapper` when `data-collapsible="icon"` is active; hides labels, badges, actions, submenus, and resizes menu buttons
- **CSS variables** `--sidebar-width` (16rem default) and `--sidebar-width-icon` (3rem default) are set on SidebarProvider root and consumed via calc() expressions throughout the hierarchy for width transitions
- **SidebarInset** uses `peer-data-[state=collapsed]` and variant-specific rules to adjust margins when sidebar collapses to icon mode; no explicit handling for icon mode width changes (relies on sidebar's fixed positioning)
- **Transitions** use `transition-[width]`, `transition-[left,right,width]`, and `transition-[margin,opacity]` with `duration-200 ease-linear` for 200ms animations
- **SidebarContent** already has `group-data-[collapsible=icon]:overflow-hidden` built-in to prevent scrollbars in icon mode; component is production-ready
- **SidebarGroupLabel** is hidden via `-mt-8` (shift up 2rem) + `opacity-0` but **still captures mouse events** — known issue fixed by adding `pointer-events-none`

---

## 1. data-collapsible Attribute Flow

### Origination Point
**File:** `src/components/ui/sidebar.tsx:230`

```jsx
<div
  ref={ref}
  className="group peer hidden text-sidebar-foreground md:block"
  data-state={state}                                           // "expanded" or "collapsed"
  data-collapsible={state === "collapsed" ? collapsible : ""} // Only set when collapsed
  data-variant={variant}
  data-side={side}
>
```

### Key Mechanics
- **Set conditionally:** `data-collapsible` attribute **only exists when sidebar is collapsed** (`state === "collapsed"`)
- **Values:** "icon", "offcanvas", or "" (empty string when expanded)
- **Parent element:** The outer sidebar wrapper div with `className="group peer"`
- **Scope:** This `group` modifier makes all descendant CSS selectors that use `group-data-[collapsible=icon]` respond to this attribute

### Context Values (from SidebarContext)
```jsx
type SidebarContextProps = {
  state: "expanded" | "collapsed"  // Controlled by useState + cookie persistence
  open: boolean                    // Same as state === "expanded"
  setOpen: (open: boolean) => void // Triggers state change + cookie write
  isMobile: boolean               // From useIsMobile hook
  toggleSidebar: () => void       // Changes state
}
```

---

## 2. group-data-[collapsible=icon] CSS Selectors - Complete Map

All instances in the codebase where this selector applies layout/visibility changes:

### A. Sidebar Width Adjustments (Container Layer)
**File:** `sidebar.tsx:238-242`

Purpose: **Adjust spacing reserve when sidebar collapses**

```jsx
// Spacer div - holds layout space for collapsed sidebar
<div className={cn(
  "relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear",
  "group-data-[collapsible=offcanvas]:w-0",
  // For floating/inset variants: reserve space + padding
  variant === "floating" || variant === "inset"
    ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"  // 3rem + 1rem
    : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"                                   // 3rem
)} />
```

**What it does:** Collapses width from 16rem to 3rem (icon) or 3rem + 1rem (floating/inset variants)

---

### B. Sidebar Container Width (Fixed Positioned Layer)
**File:** `sidebar.tsx:253-254`

```jsx
// Fixed positioned sidebar container
<div className={cn(
  "fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex",

  // Floating/inset: reserve extra space for shadow/border
  variant === "floating" || variant === "inset"
    ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
    : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
)} />
```

**What it does:** Same width resize as spacer; floating variant adds padding

---

### C. Content Hiding - Labels
**File:** `sidebar.tsx:453`

```jsx
// SidebarGroupLabel component
className={cn(
  "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear",
  "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",  // HIDES BUT KEEPS CLICKABLE
)}
```

**What it does:**
- `-mt-8`: Shifts label up 2rem (visually out of bounds)
- `opacity-0`: Makes transparent
- **BUG:** Still captures mouse events (blocks interactive elements below)
- **Fix:** Add `group-data-[collapsible=icon]:pointer-events-none`

---

### D. Content Hiding - Group Actions
**File:** `sidebar.tsx:476`

```jsx
// SidebarGroupAction (add/create button in group header)
className={cn(
  "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform",
  "group-data-[collapsible=icon]:hidden",  // Completely removed from DOM flow
)}
```

---

### E. Content Hiding - Menu Badges
**File:** `sidebar.tsx:649`

```jsx
// SidebarMenuBadge (notification counts, etc.)
className={cn(
  "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1",
  "group-data-[collapsible=icon]:hidden",
)}
```

---

### F. Content Hiding - Submenu Actions
**File:** `sidebar.tsx:625`

```jsx
// SidebarMenuAction (right-side actions on menu items)
className={cn(
  "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0",
  "group-data-[collapsible=icon]:hidden",
)}
```

---

### G. Content Hiding - Submenu Items & Labels
**File:** `sidebar.tsx:704, 739`

```jsx
// SidebarMenuSub (nested menu list)
className={cn(
  "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
  "group-data-[collapsible=icon]:hidden",  // Hide entire submenu
)}

// SidebarMenuSubButton (links in submenu)
className={cn(
  // ... base styles ...
  "group-data-[collapsible=icon]:hidden",  // Hide submenu link text
)}
```

---

### H. Menu Button Sizing
**File:** `sidebar.tsx:525, 536`

```jsx
// From sidebarMenuButtonVariants CVA
"group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2"  // Make square icon buttons

// Large variant special case:
lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0"  // Override padding for lg buttons
```

---

### I. Content Scrolling
**File:** `sidebar.tsx:417`

```jsx
// SidebarContent
className={cn(
  "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
)}
```

**What it does:** Hides scrollbar when in icon mode (no text to scroll, icons fit naturally)

---

### J. Rail (Resize Handle)
**File:** `sidebar.tsx:316`

```jsx
// SidebarRail drag handle
"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar"
```

**Note:** Only affects offcanvas; icon mode rail behavior unchanged

---

## 3. CSS Variables - Complete Mapping

### Set Location
**File:** `sidebar.tsx:142-147` (SidebarProvider component)

```jsx
<div
  style={
    {
      "--sidebar-width": SIDEBAR_WIDTH,              // "16rem"
      "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,    // "3rem"
      ...style,  // User can override
    } as React.CSSProperties
  }
>
```

### Constants
**File:** `sidebar.tsx:28-33`

```javascript
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"           // Full width
const SIDEBAR_WIDTH_MOBILE = "18rem"    // Mobile full width
const SIDEBAR_WIDTH_ICON = "3rem"       // Icon mode width
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
```

### Consumption Sites
1. **Spacer div:** `w-[--sidebar-width]` → transitions to `w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]`
2. **Fixed container:** `w-[--sidebar-width]` → transitions to `w-[--sidebar-width-icon]`
3. **Mobile override:** `--sidebar-width: SIDEBAR_WIDTH_MOBILE` (line 210, Sheet content)

### Tailwind Integration
**File:** `src/app/globals.css:3601-3609`

```css
@theme inline {
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
```

**Color Variables (globals.css:32-39, light theme)**
```css
--sidebar: oklch(0.985 0 0);              /* off-white */
--sidebar-foreground: oklch(0.145 0 0);   /* dark gray */
--sidebar-primary: oklch(0.205 0 0);      /* darker gray */
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.97 0 0);        /* light bg */
--sidebar-accent-foreground: oklch(0.205 0 0);
--sidebar-border: oklch(0.922 0 0);       /* light border */
--sidebar-ring: oklch(0.708 0 0);         /* medium gray */
```

---

## 4. SidebarInset - Responsive Margin/Width Adjustment

**File:** `sidebar.tsx:334-341`

```jsx
const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"main">>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "relative flex w-full flex-1 flex-col bg-background",
          "md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
          className
        )}
        {...props}
      />
    )
  }
)
```

### What This Does
Uses `peer-data-[*]` selectors to target the sibling `.peer` Sidebar element:

- **`peer-data-[variant=inset]:m-2`** → When variant=inset, add margin on all sides
- **`peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2`** → When collapsed AND inset variant, add left margin (keeps space from narrow sidebar)
- **`peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-0`** → Override: remove left margin when collapsed

### Does It Handle Icon Mode Specifically?
**No.** SidebarInset does NOT have explicit rules for `collapsible=icon` mode.

**Why it works anyway:**
- Icon mode uses fixed positioning sidebar (not adjacent)
- Width changes to 3rem (via spacer div)
- Inset margin rules (`m-2`, `ml-2`) remain constant whether collapsed or icon
- Content naturally flows around the narrow fixed sidebar

**Recommendation:** To provide better spacing around icon-mode sidebars, could add:
```jsx
"peer-data-[collapsible=icon]:md:ml-0"  // Remove left margin for icon mode
```

---

## 5. CSS Transitions - Animation Details

### Transition Sites

**A. Spacer Width** (sidebar.tsx:237)
```jsx
"transition-[width] duration-200 ease-linear"
```

**B. Fixed Container** (sidebar.tsx:247)
```jsx
"transition-[left,right,width] duration-200 ease-linear"
```
Animates:
- `left`: For side=left + offcanvas (slides off-screen)
- `right`: For side=right + offcanvas
- `width`: For icon mode resize

**C. Group Labels** (sidebar.tsx:452)
```jsx
"transition-[margin,opacity] duration-200 ease-linear"
```
Animates:
- `margin-top`: From 0 to -2rem (-mt-8)
- `opacity`: From 1 to 0

**D. Menu Buttons** (sidebar.tsx:525)
```jsx
"transition-[width,height,padding] ..."  // Via CVA
```

### Timing
- **Duration:** 200ms (0.2s) across all transitions
- **Easing:** `ease-linear` (constant velocity, not ease-in-out)
- **Effect:** Creates smooth, predictable collapse animation

---

## 6. SidebarContent Icon Mode Handling

**File:** `sidebar.tsx:416-420`

```jsx
const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="content"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
          className
        )}
        {...props}
      />
    )
  }
)
```

### What's Built-In
✅ **`overflow-auto` → `group-data-[collapsible=icon]:overflow-hidden`**

Removes scrollbar in icon mode because:
- Icons are small and fit within fixed width (3rem)
- No text content means no horizontal overflow
- Scrollbar UI would take space and look odd

### Status
**Fully production-ready.** No additional configuration needed for icon mode.

---

## 7. SidebarGroupLabel - Mouse Event Bug

**File:** `sidebar.tsx:450-457`

```jsx
const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
```

### Known Issue
**GitHub Issue:** [#8037 - SidebarGroupLabel overlaps clickable elements](https://github.com/shadcn-ui/ui/issues/8037)

**Problem:**
- `-mt-8` moves label visually but **doesn't remove from DOM flow**
- `opacity-0` makes invisible but **still clickable**
- When sidebar in icon mode, hidden labels can **block clicks** on icons/buttons above them

### Current Behavior
```
Visual state:  [Label is invisible]  ← -mt-8, opacity-0
Click target:  [Label still receives events]  ← No pointer-events: none
Result:        Click hits invisible label instead of button below
```

### Fix
Add `pointer-events-none` to prevent event capture:

```jsx
"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none",
```

This is **not currently applied** in the codebase.

---

## 8. Current Project Implementation

### AdminShellNav Usage
**File:** `src/components/admin-shell-nav.tsx:185-187`

```jsx
<Sidebar
  collapsible="icon"
  className={cn("border-r-0")}
  style={
    {
      "--sidebar": "var(--admin-sidebar-bg)",
      "--sidebar-foreground": "var(--admin-sidebar-fg)",
      "--sidebar-accent": "var(--admin-sidebar-accent)",
      "--sidebar-accent-foreground": "var(--admin-sidebar-accent-fg)",
      "--sidebar-border": "#1e293b",
    } as React.CSSProperties
  }
>
  {/* Content */}
</Sidebar>
```

**Observations:**
- Uses `collapsible="icon"` correctly
- **Does NOT override** `--sidebar-width` or `--sidebar-width-icon` (uses 16rem/3rem defaults)
- Overrides color CSS variables but **not width variables**
- Has `SidebarGroupLabel` on line 216-218 (potentially affected by event-capture bug if sidebar collapses)

---

## What Works Automatically vs What Needs Handling

### Automatic (Built-In)
✅ Width transitions (spacer + container)
✅ Label/badge/action hiding via `group-data-[collapsible=icon]:hidden`
✅ Menu button resizing to square icons
✅ Submenu hiding
✅ Scroll behavior (overflow-hidden)
✅ 200ms smooth animations
✅ Data attribute flow from provider through tree
✅ State management (cookie persistence)

### Requires Manual Attention
⚠️ **SidebarGroupLabel mouse event blocking** (add `pointer-events-none`)
⚠️ **Custom icon sizes** (may need adjustment for 3rem width)
⚠️ **Tooltip positioning** (already handled in SidebarMenuButton via `state !== "collapsed"` check)
⚠️ **SidebarInset margin** (optional enhancement for icon-specific spacing)

---

## Recommendations

### 1. Fix Label Mouse Event Bug (Critical)
Apply patch to `src/components/ui/sidebar.tsx:453`:
```jsx
"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none",
```

### 2. Enhanced SidebarInset (Optional)
For icon mode, remove left margin to create breathing room:
```jsx
"peer-data-[collapsible=icon]:peer-data-[variant=inset]:ml-0"
```

### 3. Customize Icon Mode Width (If Needed)
Override in component:
```jsx
<Sidebar
  collapsible="icon"
  style={{ "--sidebar-width-icon": "4rem" }}  // Larger icons
/>
```

### 4. Icon Validation
Ensure all sidebar menu icons are visible at 16px size (current default in AdminShellNav line 237).

---

## Technical Debt & Known Issues

| Issue | Severity | Source | Fix |
|-------|----------|--------|-----|
| Label event capture | Medium | shadcn/ui core | Add `pointer-events-none` |
| No SidebarInset icon spacing | Low | shadcn/ui design | Add optional peer selector |
| Tooltip shown in icon mode | Low | Current behavior | Already correct via `state !== "collapsed"` |

---

## Sources & References

- **shadcn/ui GitHub Issue #8037** - Label overlap bug: https://github.com/shadcn-ui/ui/issues/8037
- **Official Sidebar Docs** - https://ui.shadcn.com/docs/components/sidebar
- **Achromatic Blog** - "Using the new Shadcn Sidebar": https://www.achromatic.dev/blog/shadcn-sidebar
- **Project Files**:
  - `src/components/ui/sidebar.tsx` - Core component (774 lines)
  - `src/components/admin-shell-nav.tsx` - Implementation example (263 lines)
  - `src/app/globals.css` - CSS variables & theme

---

## Unresolved Questions

1. Why does shadcn use `-mt-8` (negative margin) instead of `clip-path` or `hidden` for labels?
   - **Answer:** Allows smooth opacity transition; clip-path doesn't animate well

2. Are there performance implications of hidden elements still in DOM?
   - **Answer:** Minimal; opacity and margin are GPU-accelerated; consider `display:none` alternative if needed

3. Should `--sidebar-width-icon` be configurable per theme?
   - **Answer:** Currently hardcoded to 3rem; could be added to CSS variable system for flexibility
