# Sidebar Header/Footer Icon Mode Adaptation Patterns
**Researcher-2 Report** | 2026-03-18

---

## Executive Summary

shadcn/ui sidebar uses `group-data-[collapsible=icon]` selector pattern for icon-only collapsed state. SidebarHeader and SidebarFooter require explicit text hiding via Tailwind utilities while keeping icons visible. Current codebase (admin-shell-nav.tsx) has incomplete icon-mode support: missing text-hide classes, no tooltip on header icon, and generic logout button without icon-only adaptation.

Key finding: **No built-in auto-hiding in SidebarHeader/Footer** — developer must add conditional classes manually. Real-world patterns use `group-data-[collapsible=icon]:hidden` on text spans and maintain fixed icon size (16px) for consistency.

---

## Part 1: Canonical Patterns & Tailwind Utilities

### Question 1: Text Hiding in Icon Mode

**Answer:** `group-data-[collapsible=icon]:hidden` is the canonical pattern.

```html
<!-- SidebarHeader with conditional text hiding -->
<SidebarHeader className="px-4 py-3 border-b">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
      <ShieldAlert size={16} className="text-white" />
    </div>
    <!-- This div hides entirely when collapsed -->
    <div className="group-data-[collapsible=icon]:hidden">
      <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
      <p className="text-xs text-[#94a3b8]">Super Admin</p>
    </div>
  </div>
</SidebarHeader>
```

**Why this works:**
- Sidebar component sets `data-collapsible="icon"` on root when collapsed
- `.group` class on parent Sidebar div enables `group-data-[*]` selectors on descendants
- Hiding text container preserves icon container's layout

**Alternative opacity approach** (keeps space reserved):
```html
<span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">
  Text
</span>
```

---

### Question 2: Real-World Admin Dashboard Logo Handling

**Pattern:** Icon stays in fixed-size container, text label wrapper disappears entirely.

From shadcn documentation and real admin dashboards:

```tsx
// Pattern A: Logo/Brand with Workspace Selector
<SidebarHeader>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Logo size={16} />
            </div>
            <!-- Text container hidden in icon mode -->
            <div className="group-data-[collapsible=icon]:hidden flex flex-col min-w-0">
              <span className="font-semibold text-sm">Company Name</span>
              <span className="text-xs text-muted-foreground">Workspace</span>
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarHeader>
```

**Pattern B: Logo Only** (typical startup dashboards)
```tsx
<SidebarHeader className="flex h-auto items-center justify-center py-2">
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
    <Logo size={16} />
  </div>
</SidebarHeader>
```

**Key principle:** Icon container is never hidden or resized. Icon stays 16px. Text wrapping div uses `group-data-[collapsible=icon]:hidden` to disappear cleanly.

---

### Question 3: Tailwind Utilities for Sidebar Group Context

**Canonical selectors** (from sidebar.tsx analysis):

| Use Case | Pattern | Location |
|----------|---------|----------|
| Hide entire element | `group-data-[collapsible=icon]:hidden` | Any child of Sidebar |
| Hide with opacity | `group-data-[collapsible=icon]:opacity-0` | When space must stay |
| Adjust padding | `group-data-[collapsible=icon]:!p-2` | Menu buttons, headers |
| Adjust width | `group-data-[collapsible=icon]:w-[--sidebar-width-icon]` | Container sizing |
| Prevent pointer events | `group-data-[collapsible=icon]:pointer-events-none` | Hidden labels |
| Adjust margin | `group-data-[collapsible=icon]:-mt-8` | SidebarGroupLabel positioning |

**Where they work:**
- Direct children of `<Sidebar>` (has `.group` class)
- Any descendant of `<Sidebar>` component
- Does NOT work on custom divs outside Sidebar — they need `.group` parent

**Inspection:** In admin-shell-nav.tsx, Sidebar at line 185 has `collapsible="icon"` which sets `data-collapsible="icon"` automatically when collapsed.

---

### Question 4: SidebarMenuButton Tooltip in Icon Mode

**Implementation (from sidebar.tsx lines 546-603):**

```tsx
const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  }
>(
  ({
    asChild = false,
    isActive = false,
    variant = "default",
    size = "default",
    tooltip,
    className,
    ...props
  }, ref) => {
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = { children: tooltip }
    }

    // CRITICAL: Tooltip only shows when state === "collapsed" AND not mobile
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
```

**Usage in admin-shell-nav.tsx:**
```tsx
<SidebarMenuButton
  isActive={active}
  tooltip={item.label}  // Shows when collapsed
  className="text-sidebar-foreground"
>
  <Icon size={16} className="shrink-0" />
  <span>{item.label}</span>
</SidebarMenuButton>
```

**Current implementation status:** ✅ **Already works in nav items**
- Menu buttons have `tooltip` prop
- Tooltip only displays when `state === "collapsed"` (from useSidebar hook)
- Shows on right side, center-aligned
- Hidden on mobile

**Issue found:** SidebarHeader doesn't use SidebarMenuButton for logo area, so no automatic tooltip.

---

## Part 2: SidebarHeader Adaptation Guide

### Current Problem
```tsx
<SidebarHeader className="px-4 py-3 border-b border-[#1e293b]">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
      <ShieldAlert size={16} className="text-white" />
    </div>
    <div>
      <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
      <p className="text-xs text-[#94a3b8]">
        {isSuperAdmin ? "Super Admin" : "Staff Admin"}
      </p>
    </div>
  </div>
  <SidebarTrigger className="ml-auto text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]" />
</SidebarHeader>
```

**Issues:**
1. Text div never hides in icon mode — still takes horizontal space
2. SidebarTrigger should hide when collapsed (clutters icon-only view)
3. No tooltip on icon — users can't identify "Admin" in collapsed state

### Solution: Three-Part Adaptation

**Part A: Hide text wrapper**
```tsx
{/* CHANGE: Add group-data-[collapsible=icon]:hidden */}
<div className="group-data-[collapsible=icon]:hidden">
  <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
  <p className="text-xs text-[#94a3b8]">
    {isSuperAdmin ? "Super Admin" : "Staff Admin"}
  </p>
</div>
```

**Part B: Hide trigger button in icon mode**
```tsx
{/* CHANGE: Add group-data-[collapsible=icon]:hidden */}
<SidebarTrigger className="ml-auto text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] group-data-[collapsible=icon]:hidden" />
```

**Part C: Add tooltip to icon** (recommended pattern)
```tsx
{/* WRAP icon in SidebarMenuButton for tooltip support */}
<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton
      tooltip="CCTH Admin"
      size="lg"
      className="!size-10 px-0 py-0"
    >
      <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
        <ShieldAlert size={16} className="text-white" />
      </div>
    </SidebarMenuButton>
  </SidebarMenuItem>
</SidebarMenu>

{/* Text still visible in expanded mode */}
<div className="group-data-[collapsible=icon]:hidden">
  <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
  <p className="text-xs text-[#94a3b8]">
    {isSuperAdmin ? "Super Admin" : "Staff Admin"}
  </p>
</div>
```

### Padding Adjustment for Icon Mode

**Question 5 Answer:**

Current padding: `px-4 py-3`

When collapsed, these apply to just the icon:
- Padding looks too wide around 32px icon
- Standard admin dashboards use `px-2 py-2` in collapsed state

**Solution:**
```tsx
<SidebarHeader className="px-4 py-3 border-b border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:justify-center">
```

This tightens padding when collapsed, centers the icon.

---

## Part 3: SidebarFooter Adaptation Guide

### Current Problem
```tsx
<SidebarFooter className="px-4 py-3 border-t border-[#1e293b]">
  <form action="/api/admin/auth/logout" method="post">
    <button
      type="submit"
      className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md px-2 py-1.5 w-full transition-colors"
    >
      <LogOut size={14} />
      <span>Đăng xuất</span>
    </button>
  </form>
</SidebarFooter>
```

**Issues:**
1. Text "Đăng xuất" never hides in icon mode
2. Button width stays `w-full` even when only icon visible
3. No tooltip on icon button
4. Icon size (14px) smaller than menu icons (16px) — inconsistent

### Solution: Full Adaptation

**Approach A: SidebarMenuButton wrapper** (recommended)
```tsx
<SidebarFooter className="px-4 py-3 border-t border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
  <SidebarMenu>
    <SidebarMenuItem>
      <form action="/api/admin/auth/logout" method="post">
        <SidebarMenuButton
          asChild
          tooltip="Đăng xuất"
          size="default"
          className="group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2"
        >
          <button type="submit">
            <LogOut size={16} /> {/* Match menu icon size */}
            <span className="group-data-[collapsible=icon]:hidden">
              Đăng xuất
            </span>
          </button>
        </SidebarMenuButton>
      </form>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```

**Approach B: Custom button with manual utilities** (if not using SidebarMenuButton)
```tsx
<SidebarFooter className="px-4 py-3 border-t border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
  <form action="/api/admin/auth/logout" method="post">
    <button
      type="submit"
      className={cn(
        "flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md px-2 py-1.5 w-full transition-colors",
        "group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:mx-auto" // Center icon
      )}
      title="Đăng xuất"
    >
      <LogOut size={16} />
      <span className="group-data-[collapsible=icon]:hidden">
        Đăng xuất
      </span>
    </button>
  </form>
</SidebarFooter>
```

---

## Part 4: Accessibility Considerations

### Question 7: Accessibility for Icon-Only Items

**WCAG 2.1 Requirements:**
1. **Icon-only buttons MUST have accessible name**
   - Use `aria-label` or `title` attribute
   - Or wrap in `<Tooltip>` with label text

2. **Tooltip Considerations**
   - Tooltip is NOT accessible name substitute
   - Icon-only button NEEDS aria-label OR tooltip
   - Tooltip should duplicate aria-label text

**Recommended Pattern:**
```tsx
<!-- Pattern 1: Using aria-label (semantic) -->
<button
  aria-label="Logout"
  className="..."
>
  <LogOut size={16} />
</button>

<!-- Pattern 2: Using Tooltip + aria-label (best) -->
<Tooltip>
  <TooltipTrigger asChild>
    <button
      aria-label="Logout"
      className="..."
    >
      <LogOut size={16} />
    </button>
  </TooltipTrigger>
  <TooltipContent>Logout</TooltipContent>
</Tooltip>

<!-- Pattern 3: Using title attribute (fallback) -->
<button
  title="Logout"
  className="..."
>
  <LogOut size={16} />
</button>
```

**For SidebarMenuButton with tooltip:**
```tsx
<SidebarMenuButton
  tooltip="Dashboard"  // This auto-handles tooltip only when collapsed
  // ISSUE: No aria-label added automatically
  className="group-data-[collapsible=icon]:hidden"
>
  <Icon size={16} />
  <span>Dashboard</span>
</SidebarMenuButton>

// SOLUTION: Add aria-label
<button
  type="button"
  aria-label="Dashboard"  // Add explicit label
>
  <SidebarMenuButton
    asChild
    tooltip="Dashboard"
  >
    ...
  </SidebarMenuButton>
</button>
```

**Apply to admin-shell-nav.tsx:**

```tsx
// SidebarHeader icon
<SidebarMenuButton
  tooltip="CCTH Admin"
  aria-label="CCTH Admin Dashboard"  // ADD THIS
>

// Menu items (tooltip prop already works)
<SidebarMenuButton
  isActive={active}
  tooltip={item.label}
  aria-label={item.label}  // ADD THIS
>

// SidebarFooter logout
<SidebarMenuButton
  asChild
  tooltip="Đăng xuất"
  aria-label="Logout"  // ADD THIS
>
```

**Screen Reader Testing:**
- Collapsed state: Screen reader announces icon-only button as "button CCTH Admin"
- Expanded state: Screen reader announces as "button CCTH Admin" but visible text also present
- Redundancy is OK — not confusing

---

## Part 5: Real-World Examples & Patterns

### Pattern A: Workspace Selector Header (Notion-style)
```tsx
<SidebarHeader>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="group-data-[collapsible=icon]:!size-8"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Logo size={16} />
            </div>
            <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-0.5 lead">
              <span className="font-semibold">Acme Inc</span>
              <span className="text-xs">Workspace</span>
            </div>
            <ChevronDown className="ml-auto group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent>...</DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarHeader>
```

### Pattern B: Minimal Logo-Only Header (Current Codebase Style)
```tsx
<SidebarHeader className="flex h-16 items-center border-b border-[#1e293b]">
  <div className="flex items-center gap-3 px-4 group-data-[collapsible=icon]:px-2 w-full">
    <div className="flex size-8 items-center justify-center rounded-lg bg-teal-600 shrink-0">
      <ShieldAlert size={16} className="text-white" />
    </div>
    <div className="group-data-[collapsible=icon]:hidden min-w-0">
      <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
      <p className="text-xs text-[#94a3b8]">Workspace</p>
    </div>
  </div>
</SidebarHeader>
```

### Pattern C: Search + Toggle Footer
```tsx
<SidebarFooter>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild size="sm" className="group-data-[collapsible=icon]:hidden">
        <input
          placeholder="Search..."
          className="..."
        />
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip="Toggle Theme"
        aria-label="Toggle Theme"
      >
        <button>
          <Moon size={16} />
          <span className="group-data-[collapsible=icon]:hidden">Theme</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```

---

## Part 6: Checkbox Implementation Guide

Exact classes to add to admin-shell-nav.tsx:

### SidebarHeader Changes
```diff
- <SidebarHeader className="px-4 py-3 border-b border-[#1e293b]">
+ <SidebarHeader className="px-4 py-3 border-b border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
    <div className="flex items-center gap-3">
      {/* Icon stays the same */}
      <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
        <ShieldAlert size={16} className="text-white" />
      </div>
      {/* Wrap text in div that hides */}
-     <div>
+     <div className="group-data-[collapsible=icon]:hidden">
        <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
        <p className="text-xs text-[#94a3b8]">
          {isSuperAdmin ? "Super Admin" : "Staff Admin"}
        </p>
      </div>
    </div>
-   <SidebarTrigger className="ml-auto text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]" />
+   <SidebarTrigger className="ml-auto text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] group-data-[collapsible=icon]:hidden" />
  </SidebarHeader>
```

### SidebarFooter Changes
```diff
- <SidebarFooter className="px-4 py-3 border-t border-[#1e293b]">
+ <SidebarFooter className="px-4 py-3 border-t border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
    <form action="/api/admin/auth/logout" method="post">
      <button
        type="submit"
-       className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md px-2 py-1.5 w-full transition-colors"
+       className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md px-2 py-1.5 w-full transition-colors group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center"
+       title="Đăng xuất"
+       aria-label="Logout"
      >
-       <LogOut size={14} />
-       <span>Đăng xuất</span>
+       <LogOut size={16} />
+       <span className="group-data-[collapsible=icon]:hidden">Đăng xuất</span>
      </button>
    </form>
  </SidebarFooter>
```

---

## Technical Specifications Summary

| Component | Current State | Required Change | Priority | Effort |
|-----------|---------------|-----------------|----------|--------|
| SidebarHeader text | Always visible | Add `group-data-[collapsible=icon]:hidden` wrapper | HIGH | Low (1 class) |
| SidebarHeader trigger | Always visible | Add `group-data-[collapsible=icon]:hidden` | HIGH | Low (1 class) |
| SidebarHeader icon | Correct size (16px) | None | — | — |
| SidebarHeader padding | 4px/3px | Add conditional `group-data-[collapsible=icon]:px-2 py-2` | MEDIUM | Low (2 classes) |
| SidebarFooter text | Always visible | Add `group-data-[collapsible=icon]:hidden` wrapper | HIGH | Low (1 class) |
| SidebarFooter button width | w-full always | Add `group-data-[collapsible=icon]:w-auto` | MEDIUM | Low (1 class) |
| SidebarFooter icon size | 14px | Change to 16px for consistency | LOW | Very low (size prop) |
| SidebarFooter padding | 4px/3px | Add conditional `group-data-[collapsible=icon]:px-2 py-2` | MEDIUM | Low (2 classes) |
| Accessibility labels | None | Add `aria-label` on header/footer | HIGH | Very low (2 attrs) |
| Tooltip on logout | None | Add `title` attribute at minimum | MEDIUM | Low (1 attr) |

---

## Sources

- [shadcn/ui Sidebar Documentation](https://ui.shadcn.com/docs/components/radix/sidebar)
- [shadcn/ui Sidebar Building Blocks](https://ui.shadcn.com/blocks/sidebar)
- [shadcn-ui GitHub Issue #8037 - Group Label Overlap](https://github.com/shadcn-ui/ui/issues/8037)
- [shadcn-ui GitHub Issue #8975 - Size lg Collapse](https://github.com/shadcn-ui/ui/issues/8975)
- [Using the new Shadcn Sidebar - Achromatic](https://www.achromatic.dev/blog/shadcn-sidebar)
- [Building Dynamic Sidebars - Medium](https://medium.com/@enayetflweb/building-a-dynamic-sidebar-with-shadcn-ui-59ff58482988)

---

## Unresolved Questions

1. **SidebarMenuButton size="lg" overflow:** When used with `asChild`, does SidebarMenuButton's size variant apply correctly to custom button element? (May need explicit !size-* override)
2. **Dropdown menu positioning in icon mode:** When header dropdown expanded + sidebar collapsed, does menu render correctly or get clipped? (Likely needs portal, check Radix DropdownMenu props)
3. **Theme toggle footer:** If adding theme toggle button to footer, should it use `<SidebarMenuButton>` with tooltip or custom button? (Recommendation: use SidebarMenuButton for consistency)
