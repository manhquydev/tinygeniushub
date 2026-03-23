---
status: pending
priority: P1
effort: 1.5h
---

# Phase 7: Mobile Filter Drawer Using Sheet

## Context
The listing page (`courses/page.tsx` line ~295-300) has a non-functional "Bộ lọc" div on mobile. The `CourseFilterSidebar` is hidden on mobile (`hidden md:block`). Parents on mobile cannot filter courses at all.

## Key Insights
- `Sheet` component already exists at `src/components/ui/sheet.tsx` (shadcn/radix)
- `CourseFilterSidebar` is already a `"use client"` component, works standalone
- Need a client wrapper to hold Sheet open/close state and render the trigger + drawer
- Listing page (`courses/page.tsx`) is a server component — client wrapper goes around trigger only

## Files to Create
- `src/components/courses/course-mobile-filter-trigger.tsx` — client component with Sheet trigger + content

## Files to Modify
- `src/app/(main)/courses/page.tsx` — replace static div with `<CourseMobileFilterTrigger>`

## Architecture

### CourseMobileFilterTrigger (client component)
```tsx
"use client";
// Props: currentFilters (CourseFilterParams), activeFilterCount (number)
// Renders: Sheet trigger button (md:hidden) + Sheet with CourseFilterSidebar inside
```

### Component Structure
```
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <button>
        <Filter /> Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>
    </SheetTrigger>
    <SheetContent side="left">
      <SheetHeader>
        <SheetTitle>Bộ lọc khóa học</SheetTitle>
      </SheetHeader>
      <CourseFilterSidebar currentFilters={currentFilters} />
    </SheetContent>
  </Sheet>
</div>
```

## Implementation Steps

### Step 1: Create CourseMobileFilterTrigger
File: `src/components/courses/course-mobile-filter-trigger.tsx`

```tsx
"use client";
import { Filter } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet";
import { CourseFilterSidebar } from "./course-filter-sidebar";
import type { CourseFilterParams } from "@/lib/courses/course-filter-utils";

interface Props {
  currentFilters: CourseFilterParams;
  activeFilterCount: number;
}

export function CourseMobileFilterTrigger({ currentFilters, activeFilterCount }: Props) {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 transition">
            <Filter className="h-3.5 w-3.5" />
            Bộ lọc
            {activeFilterCount > 0 ? (
              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bộ lọc khóa học</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <CourseFilterSidebar currentFilters={currentFilters} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

### Step 2: Compute activeFilterCount
In `courses/page.tsx`, compute count of active DB filters:
```ts
const activeFilterCount = [
  dbFilters.subject, dbFilters.ageGroup, dbFilters.minPrice, dbFilters.maxPrice, dbFilters.duration
].filter(Boolean).length;
```

### Step 3: Replace Static Div in Listing Page
In `courses/page.tsx`, replace lines ~294-300:
```
OLD:
<div className="mb-4 flex items-center gap-2 md:hidden">
  <div className="flex items-center gap-1.5 rounded-lg border ...">
    <Filter ... /> Bộ lọc
  </div>
</div>

NEW:
<div className="mb-4">
  <CourseMobileFilterTrigger currentFilters={dbFilters} activeFilterCount={activeFilterCount} />
</div>
```

Remove the `Filter` import from listing page if no longer used there.

## Todo
- [ ] Create `src/components/courses/course-mobile-filter-trigger.tsx`
- [ ] Compute `activeFilterCount` in listing page
- [ ] Replace static div with `<CourseMobileFilterTrigger>`
- [ ] Remove unused `Filter` import from listing page
- [ ] Test: open drawer on mobile, apply filter, verify URL updates
- [ ] Test: drawer closes when user navigates
- [ ] `npm run build` succeeds

## Success Criteria
- Mobile "Bộ lọc" button opens a left-slide Sheet drawer
- Filter sidebar inside drawer is fully functional (checkboxes, price inputs, duration pills)
- Active filter count shows as badge on trigger button
- Drawer closes on overlay click or X button
- No hydration errors (client component boundary is clean)

## Risk Assessment
- Risk: `CourseFilterSidebar` uses `useRouter().replace()` for URL updates — this works inside Sheet since Sheet doesn't unmount on navigation, but the Sheet may remain open after filter change. Acceptable UX; parent can close manually.
- Mitigation: Could add `onOpenChange` to close Sheet after filter change, but YAGNI for now.
