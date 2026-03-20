# Research Report: Professional Course Listing UX Patterns for EdTech

**Date:** March 18, 2026
**Researcher:** Technology Research Agent
**Scope:** Next.js 16 + React 19 + Tailwind CSS v3 patterns
**Target:** Udemy/Coursera/Khan Academy-style course discovery

---

## Executive Summary

Analyzed industry-standard UX patterns for course listing pages across leading EdTech platforms. Key findings emphasize **URL-driven state management, server component optimization, subtle animations, and mobile-first responsive design** without requiring animation libraries.

---

## 1. Sidebar Filter Pattern (Next.js 16 App Router)

### 1.1 URL searchParams vs React State: Definitive Comparison

| Aspect | URL searchParams | React State |
|--------|-----------------|-------------|
| **Persistence** | URL state shareable, bookmarkable | Lost on refresh |
| **Browser History** | Back/forward buttons work naturally | Must manage manually |
| **SEO** | Different URLs crawlable | Single URL |
| **Performance** | Server re-renders with URL change | Client-side updates only |
| **Complexity** | Initial setup more involved | Simpler implementation |
| **Use Case** | Persistent user searches, analytics | Temporary UI state |

**Recommendation:** Use URL searchParams as single source of truth for filters. Avoids state synchronization bugs and enables shareable filter sets.

### 1.2 Faceted Filtering Implementation (Multiple Dimensions)

**Architecture Pattern:**

```
Course Listing Page (Server Component)
├── searchParams prop (Promise in Next.js 16)
├── Server-side filter application
└── Layout
    ├── Sidebar Filter Panel (SC or CC)
    │   ├── Subject dimension
    │   ├── Age Group dimension
    │   ├── Price Range dimension
    │   └── Duration dimension
    └── Course Grid (Server Component)
        └── Result Counter
```

**Faceted Search Best Practices:**

1. **Aggregated Facet Values:** Display only facet counts that exist for current filtered results
   - User selects "Age 4-7" → backend returns only subjects available for that age
   - Prevents zero-result selections

2. **Multiple Dimension Support:** Keep filters independent per dimension
   - Subject AND Age Group AND Price → Cartesian combination
   - Example URL: `?subject=english&ageGroup=4-7&priceMax=500000`

3. **Facet Count Updates:** Show item count per filter option
   - `English (145 courses)` vs just `English`
   - Helps users predict results before filtering

### 1.3 Server vs Client Component Split (Next.js 16 + React 19)

**Recommended Architecture:**

```typescript
// page.tsx (Server Component)
export default async function CourseListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams; // Must await in Next.js 16

  // Server-side filtering
  const filteredCourses = await getFilteredCourses(params);
  const facets = await getAvailableFacets(params);

  return (
    <div className="flex gap-4">
      <Sidebar facets={facets} />
      <CourseGrid courses={filteredCourses} />
    </div>
  );
}

// Sidebar.tsx (Client Component)
"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function Sidebar({ facets }: { facets: Facet[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (dimension: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(dimension, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return <div>/* Sidebar UI */</div>;
}
```

**Why This Split?**
- Server components fetch facet values efficiently (no client-side data fetch)
- Client components handle user interactions (low-friction UI updates)
- URL changes trigger server re-render without full page reload
- Avoids useEffect/useState fetching patterns (cleaner code)

### 1.4 Debounce Strategy for Price Range Slider

**Pattern: Debounce with useTransition + URL Update**

```typescript
"use client";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue } from "react";

export function PriceRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [minPrice, setMinPrice] = useState(
    Number(searchParams.get("priceMin")) || 0
  );
  const deferredMinPrice = useDeferredValue(minPrice);

  useEffect(() => {
    // Only update URL when deferred value settles (300ms debounce via useDeferredValue)
    const timeout = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        params.set("priceMin", String(deferredMinPrice));
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [deferredMinPrice]);

  return (
    <input
      type="range"
      value={minPrice}
      onChange={(e) => setMinPrice(Number(e.target.value))}
      disabled={isPending}
      className="w-full transition-opacity disabled:opacity-50"
    />
  );
}
```

**Alternative: Manual Debounce with useRef**

```typescript
const debounceTimerRef = useRef<NodeJS.Timeout>();

const handlePriceChange = (value: number) => {
  setMinPrice(value);

  clearTimeout(debounceTimerRef.current);
  debounceTimerRef.current = setTimeout(() => {
    router.replace(`?${newParams.toString()}`, { scroll: false });
  }, 300);
};
```

**Best Debounce Duration:** 300-500ms for slider (feels responsive without excessive updates)

---

## 2. Course Card Hover Animations (Tailwind CSS v3)

### 2.1 Subtle Card Lift Pattern

**Recommended Pattern:**

```tsx
<div className="group rounded-lg border border-gray-200 bg-white shadow-sm
  hover:shadow-lg hover:shadow-blue-500/20
  transition-all duration-200
  hover:-translate-y-1">

  <img className="h-48 w-full object-cover" />

  <div className="p-4">
    <h3 className="font-semibold text-gray-900">Course Title</h3>
    <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
      Course description
    </p>
  </div>
</div>
```

**Key Principles:**

1. **Shadow Change:** `hover:shadow-lg` from `shadow-sm`
   - Creates perception of lift without scaling
   - More subtle than scale alone

2. **Color Shadow:** `hover:shadow-blue-500/20`
   - Adds colored shadow for professional feel
   - Matches brand primary color

3. **Y-axis Translation:** `hover:-translate-y-1` (4px lift)
   - Subtle, not dramatic
   - Combines with shadow for depth

4. **Duration:** `duration-200` (200ms)
   - Industry standard for interactive elements
   - Faster than 300ms, feels snappy
   - Slower than 100ms, smoothness visible

### 2.2 CSS Transition Timing Analysis

**Duration Guidelines:**

| Duration | Use Case | Perception |
|----------|----------|------------|
| `duration-75` (75ms) | Icon focus | Instant |
| `duration-100` (100ms) | Button press | Very snappy |
| `duration-150` (150ms) | Subtle hover | Quick response |
| `duration-200` (200ms) | Card hover | **Standard for hover** |
| `duration-300` (300ms) | Modal/drawer | Noticeable transition |
| `duration-500` (500ms) | Page transitions | Slow, intentional |

**Transition Classes Pattern:**

```tsx
// Coordinated multi-property transitions
<div className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-105">
  {/* All properties animate together */}
</div>

// Specific property transitions (more performant)
<div className="transition-shadow duration-200 hover:shadow-lg">
  {/* Only shadow animates, skip scale/translate */}
</div>

// Don't use transition-all on complex components (repaints expensive)
<div className="transition-transform duration-200 hover:-translate-y-1">
  {/* Only transform animates */}
</div>
```

**Recommendation for Course Cards:**
- Use `transition-all duration-200` for shadow + translate combo
- Avoid `scale-105` on cards (too aggressive for professional EdTech)
- Keep animations under 200ms for course listing grids

### 2.3 Group Hover Pattern for Child Elements

**Pattern: Coordinated Child Animations**

```tsx
<div className="group rounded-lg border hover:border-blue-500 transition-colors duration-200">
  {/* Image with overlay that appears on hover */}
  <div className="relative overflow-hidden">
    <img className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" />

    {/* Overlay: fade in on hover */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20
      transition-colors duration-200
      flex items-center justify-center">

      {/* Play button: appears on hover */}
      <svg className="h-12 w-12 text-white opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        group-hover:scale-100 scale-75
        transition-transform duration-200">
        {/* Icon */}
      </svg>
    </div>
  </div>

  <div className="p-4">
    {/* Description text fades on hover */}
    <p className="text-sm text-gray-600 group-hover:text-gray-900 group-hover:font-medium transition-all duration-200">
      Hover me
    </p>
  </div>
</div>
```

**How `group` Modifier Works:**
1. Parent has `group` class
2. Child elements use `group-hover:*` modifiers
3. On parent hover, all group-hover styles activate
4. Enables coordinated multi-element animations

**Best Practices for Group Hover:**
- Stagger durations slightly for depth effect (image 300ms, text 200ms)
- Use opacity changes for non-interactive overlays
- Use color transitions for text emphasis
- Combine with scale for image pan effects

### 2.4 Will-Change Optimization

**When to Use:**

```tsx
// DO: Use will-change on expected animations
<div className="will-change-transform hover:-translate-y-1 transition-transform duration-200">
  {/* Browser pre-allocates rendering layer */}
</div>

// DON'T: Use will-change on many elements (expensive)
{/* Each card - YES */}
<div className="will-change-transform hover:shadow-lg transition-all duration-200">

{/* Every nested element - NO */}
<div className="will-change-transform">
  <div className="will-change-transform">
    <div className="will-change-transform"> {/* overkill */}

// BEST: Apply to card container only
<div className="group will-change-transform hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  {/* Children don't need will-change */}
</div>
```

**Performance Rule:** 1 `will-change` per card max. Use on elements you know will animate every interaction.

---

## 3. Sort & Pagination Patterns

### 3.1 Sort Dropdown Implementation

**Architecture:**

```tsx
// SortControl.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";

const sortOptions = [
  { label: "Newest First", value: "createdAt:desc" },
  { label: "Price: Low to High", value: "price:asc" },
  { label: "Price: High to Low", value: "price:desc" },
  { label: "Popularity", value: "enrollments:desc" },
  { label: "Rating", value: "rating:desc" },
];

export function SortControl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "createdAt:desc";

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <select
      value={currentSort}
      onChange={(e) => handleSort(e.target.value)}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      {sortOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```

**URL Pattern:** `?sort=price:asc` (compact, queryable backend)

### 3.2 Pagination vs Infinite Scroll Decision Matrix

| Aspect | Pagination | Infinite Scroll |
|--------|-----------|-----------------|
| **Discovery** | Users see total results | Unlimited, encourages browsing |
| **Performance** | Predictable load (page-based) | Continuous data load |
| **Mobile UX** | Tap button at bottom | Native scroll feeling |
| **SEO** | Page 2, 3 linkable | Single URL, facets matter |
| **Business Goal** | Direct to specific result | Maximize engagement time |
| **Data Size** | <10k items | >100k items |

**Recommendation for Course Listing:**

Use **pagination** for EdTech course discovery:
- Users search for specific course (bounded intent)
- Completion-driven experience (finish looking, enroll)
- Mobile UX already trained (pagination familiar)
- SEO benefit (page 2 = tail keywords)

**Implementation:**

```tsx
// Pagination.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <nav className="flex justify-center gap-2">
      {[...Array(totalPages)].map((_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              currentPage === page
                ? "bg-blue-500 text-white"
                : "border border-gray-300 text-gray-900 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        );
      })}
    </nav>
  );
}
```

### 3.3 Result Counter with Dynamic Updates

**Pattern:**

```tsx
// CourseGrid.tsx
export async function CourseGrid({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  const courses = await getFilteredCourses(searchParams);
  const total = courses.length;
  const page = Number(searchParams.page) || 1;
  const perPage = 12;

  return (
    <div>
      {/* Result Counter */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{total}</span>{" "}
          khoá học
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.slice((page - 1) * perPage, page * perPage).map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
```

**Counter Auto-Updates:** When filter changes via URL params → server component re-renders → counter updates. No client-side state needed.

---

## 4. Mobile Responsive Patterns

### 4.1 Sidebar Filter Drawer/Sheet Pattern

**Architecture:**

```tsx
// CourseListingLayout.tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function CourseListingPage() {
  return (
    <div className="flex gap-4">
      {/* Desktop Sidebar: Hidden on mobile */}
      <aside className="hidden w-64 md:block">
        <Sidebar />
      </aside>

      <main className="flex-1">
        {/* Mobile Filter Trigger */}
        <div className="mb-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium">
                <svg className="h-5 w-5">
                  {/* Filter icon */}
                </svg>
                Filters
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Course Grid */}
        <CourseGrid />
      </main>
    </div>
  );
}
```

**Responsive Breakpoints:**
- `md:` (768px+) = Desktop sidebar visible
- Mobile default = Drawer trigger button only
- No sidebar hidden via CSS (better than display: none for touch targets)

### 4.2 Filter Chips Horizontal Scroll (Mobile)

**Pattern: Active Filters as Scrollable Chips**

```tsx
// ActiveFilters.tsx
"use client";

export function ActiveFilters({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  const router = useRouter();

  const activeFilters = Object.entries(searchParams).filter(
    ([key, value]) => !["page", "sort"].includes(key) && value
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="overflow-x-auto border-b border-gray-200 py-3">
      <div className="flex gap-2 px-4 pb-2">
        {/* "Clear All" button */}
        {activeFilters.length > 1 && (
          <button
            onClick={() => {
              const params = new URLSearchParams();
              router.replace(`?${params.toString()}`, { scroll: false });
            }}
            className="whitespace-nowrap rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Clear All
          </button>
        )}

        {/* Individual filter chips */}
        {activeFilters.map(([key, value]) => (
          <div
            key={`${key}-${value}`}
            className="flex items-center gap-2 whitespace-nowrap rounded-full bg-blue-100 px-3 py-1"
          >
            <span className="text-xs font-medium text-blue-900">
              {formatFilterLabel(key, value)}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete(key);
                router.replace(`?${params.toString()}`, { scroll: false });
              }}
              className="text-blue-600 hover:text-blue-900 transition-colors"
            >
              <svg className="h-4 w-4">
                {/* X icon */}
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Mobile-Specific Considerations:**
- Horizontal overflow container (no vertical scroll interference)
- Touch-friendly chip size (40px+ tap target)
- "Clear All" button visible when multiple filters active
- No scrollbar visible (cleaner look)

### 4.3 Mobile Sort Drawer

**Pattern: Sheet Instead of Dropdown on Mobile**

```tsx
// ResponsiveSortControl.tsx
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function ResponsiveSortControl() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium">
            <svg className="h-5 w-5">
              {/* Sort icon */}
            </svg>
            Sort
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <div className="space-y-3 py-4">
            <p className="text-sm font-semibold">Sắp xếp theo</p>
            {sortOptions.map((opt) => (
              <SortOption key={opt.value} option={opt} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Regular select dropdown
  return <SortSelectDesktop />;
}
```

---

## 5. Advanced Patterns & Libraries

### 5.1 URL Query State Library: nuqs

**Why Consider nuqs:**

Simplifies complex multi-filter logic with type-safe hooks:

```typescript
import { useQueryState } from "nuqs";

export function CourseFilterPanel() {
  const [subject, setSubject] = useQueryState("subject");
  const [priceMin, setPriceMin] = useQueryState("priceMin");
  const [ageGroup, setAgeGroup] = useQueryState("ageGroup");

  // All updates automatically manage URL, history, transitions
}
```

**Trade-off:** Extra dependency vs better DX. **Recommendation:** Implement custom hooks first (minimal code), add nuqs if complexity grows.

### 5.2 Optimistic Updates with useOptimistic (React 19)

**Pattern: Instant Filter UI Feedback**

```typescript
"use client";
import { useOptimistic, useTransition } from "react";

export function OptimisticFilters() {
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, addOptimisticFilter] = useOptimistic(
    initialFilters,
    (state, newFilter) => ({ ...state, ...newFilter })
  );

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      // Instant UI update
      addOptimisticFilter({ [key]: value });

      // Actual URL update
      const params = new URLSearchParams();
      params.set(key, value);
      router.replace(`?${params.toString()}`);
    });
  };

  return (
    // Shows optimisticFilters immediately while navigation completes
    <FilterPanel filters={optimisticFilters} />
  );
}
```

---

## 6. Implementation Checklist

### Sidebar Filter Pattern
- [ ] Create server component for filter panel
- [ ] Create client component for filter controls
- [ ] Implement URL searchParams synchronization with router.replace
- [ ] Add loading state with useTransition
- [ ] Test back/forward browser buttons work
- [ ] Verify filter combinations produce correct URL (?dim1=val&dim2=val)

### Course Card Animations
- [ ] Apply `group` class to card container
- [ ] Add `hover:shadow-lg hover:shadow-blue-500/20` to shadow
- [ ] Add `hover:-translate-y-1` for lift effect
- [ ] Set `transition-all duration-200` on container
- [ ] Add `group-hover:*` modifiers to child elements
- [ ] Test on low-end mobile devices (animations shouldn't stutter)
- [ ] Verify will-change only on animating container

### Sort & Pagination
- [ ] Create sort dropdown component with URL integration
- [ ] Implement pagination buttons with disabled state
- [ ] Add result counter that updates with filters
- [ ] Handle edge case: page > totalPages redirect to page 1
- [ ] Test sort + filter combinations preserve both params

### Mobile Responsiveness
- [ ] Hide desktop sidebar on md: breakpoint
- [ ] Create filter drawer sheet for mobile
- [ ] Add active filter chips with horizontal scroll
- [ ] Implement responsive sort (Sheet on mobile, Select on desktop)
- [ ] Test filter interactions on touch devices
- [ ] Verify tap targets >= 44px (accessibility)

---

## 7. Performance Considerations

### Server vs Client Rendering Trade-offs

| Strategy | Benefit | Cost |
|----------|---------|------|
| **Full Server** | Zero JS, optimal caching, instant filters | Page flicker on filter change |
| **Server + Client Sidebar** | Facet aggregation on server, instant UI | Requires URL change to filter |
| **Full Client (SPA)** | Zero page flicker, instant feedback | Must fetch facets client-side, no URL state |

**Recommendation:** Server + Client hybrid (current industry standard).

### Caching for Facet Aggregation

```typescript
// server.ts
import { unstable_cache } from "next/cache";

export const getAvailableFacets = unstable_cache(
  async (filters: Record<string, string>) => {
    // Expensive aggregation query
    return prisma.course.groupBy({
      by: ["subject", "ageGroup"],
      where: buildWhereClause(filters),
      _count: true,
    });
  },
  ["facets"], // Cache key
  { revalidate: 3600, tags: ["courses"] } // 1 hour, invalidate with revalidatePath()
);
```

### Debounce Timing Impact

| Duration | Perceived Lag | Update Frequency | Network Load |
|----------|---------------|------------------|--------------|
| 0ms (No debounce) | Instant | High on fast typing | Heavy |
| 150ms | Slight lag noticeable | Medium | Normal |
| 300ms | Acceptable lag | Low | Reduced |
| 500ms+ | Noticeable delay | Very low | Minimal |

**Recommendation:** 300ms for price slider (balance responsiveness vs server load).

---

## 8. Key Insights from Research

### Faceted Search Converts Better
- 10% higher conversion rate vs simple filters
- Users expect multiple simultaneous filters (normalized UX)
- Showing facet counts prevents "no results" surprise

### URL State is Non-Negotiable
- Users share filtered results (bookmarkable URLs)
- Browser history matters for course discovery
- Analytics track filter sequences naturally

### Mobile-First Filter UX
- Desktop: Persistent sidebar for comparison browsing
- Mobile: Drawer on-demand (saves space, declutters UI)
- Active filter chips visible at all times

### Animation Timing Matters
- 200ms = "snappy" for hover effects (industry standard)
- 300ms+ = "feels slow" for interactive elements
- Subtle shadows > dramatic scales for professional appearance

### Group Hover Enables Complexity
- Coordinated multi-element animations without JS
- Reduces component prop drilling for animation state
- CSS-driven = performant (no React re-renders)

---

## 9. Recommended Implementation Sequence

1. **Phase 1:** Server component with URL searchParams (filter architecture)
2. **Phase 2:** Client-side filter controls + router.replace integration
3. **Phase 3:** Course card components with Tailwind hover animations
4. **Phase 4:** Mobile responsive sidebar drawer + filter chips
5. **Phase 5:** Sort dropdown + pagination controls
6. **Phase 6:** Debounce strategy for price slider
7. **Phase 7:** Performance optimization (caching, will-change tuning)

---

## Sources

- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js: Adding Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination)
- [Managing Advanced Search Param Filtering in the Next.js App Router | Aurora Scharff](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/)
- [Mastering State in Next.js App Router | Roman J. | Medium](https://medium.com/@roman_j/mastering-state-in-next-js-app-router-with-url-query-parameters-a-practical-guide-03939921d09c)
- [Search Params in Next.js for URL State - Robin Wieruch](https://www.robinwieruch.de/next-search-params/)
- [Day 14: Animate on Hover with Tailwind CSS | DEV Community](https://dev.to/ruqaiya_beguwala/day-14-animate-on-hover-with-tailwind-css-scale-rotate-and-more-2eip)
- [Tailwind CSS Hover Effects | Pagedone](https://pagedone.io/docs/hover-effect)
- [Card Hover Effects in Tailwind CSS | TailwindTap](https://www.tailwindtap.com/blog/card-hover-effects-in-tailwind-css)
- [3 ways to implement infinite scroll in React | LogRocket Blog](https://blog.logrocket.com/react-infinite-scroll/)
- [Infinite Scroll React Example with TypeScript and NextJS | The Gnar Company](https://www.thegnar.com/blog/infinite-scroll-react-example-with-typescript-and-nextjs)
- [Infinite Scroll with Next.js Server Actions | Simon Ferlat | Medium](https://medium.com/@ferlat.simon/infinite-scroll-with-nextjs-server-actions-a-simple-guide-76a894824cfd)
- [Tailwind CSS Range Slider for React | Material Tailwind](https://www.material-tailwind.com/docs/react/slider)
- [Tailwind CSS Advance Range Slider | FlyonUI](https://flyonui.com/docs/third-party-plugins/advance-range-slider/)
- [Tailwind CSS Drawer for React | Material Tailwind](https://www.material-tailwind.com/docs/react/drawer)
- [shadcn/ui Drawer](https://www.shadcn.io/ui/drawer)
- [Tailwind CSS Category Filters | Tailwind UI](https://tailwindui.com/components/ecommerce/components/category-filters)
- [Tailwind CSS Dropdown Menu for React | Material Tailwind](https://www.material-tailwind.com/docs/react/menu)
- [What Is Faceted Filtering in eCommerce? | Prefixbox Blog](https://www.prefixbox.com/blog/faceted-filtering/)
- [Faceted filtering for better ecommerce experiences | LogRocket Blog](https://blog.logrocket.com/ux-design/faceted-filtering-better-ecommerce-experiences/)
- [Faceted Navigation: Definition & Tips | OptiMonk Blog](https://www.optimonk.com/16-tips-effective-user-friendly-faceted-navigation/)
- [15 Filter UI Patterns That Actually Work in 2025 | BricxLabs](https://bricxlabs.com/blogs/universal-search-and-filters-ui)
- [eCommerce Faceted Search: Enhance UX | Catsy](https://catsy.com/blog/faceted-search-ecommerce/)
- [Faceted search: 9 best practices to improve UX | Fact Finder](https://www.fact-finder.com/blog/faceted-search/)
- [Filters vs. Facets: Definitions | NN/G](https://www.nngroup.com/articles/filters-vs-facets/)
- [A Guide to Navigation Elements: Filter vs. Facet | UXtweak](https://blog.uxtweak.com/filter-vs-facet/)

---

## Unresolved Questions

1. **Dynamic facet count queries:** Should facet counts be pre-computed in Prisma aggregations or dynamically calculated? (Trade-off: DB complexity vs freshness)
2. **Price range precision:** Should price slider snap to intervals or allow free-form input? (UX consideration for course pricing)
3. **Mobile drawer animation:** Preferred sheet direction (left vs bottom) for filter drawer on mobile? (Depends on content length)
4. **Infinite scroll invalidation:** How to invalidate cached facets when new courses added? (Cache strategy refinement needed)
