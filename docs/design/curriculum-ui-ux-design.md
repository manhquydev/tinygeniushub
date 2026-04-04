# Abeka Curriculum Organization System — UI/UX Design Document

**Project:** Cung Con Tu Hoc (Abeka Curriculum Module)  
**Version:** 1.0  
**Date:** April 3, 2026  
**Status:** Design Specification  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design System](#2-design-system)
3. [User Personas & Device Context](#3-user-personas--device-context)
4. [Wireframe Descriptions](#4-wireframe-descriptions)
5. [Component Hierarchy](#5-component-hierarchy)
6. [State Management](#6-state-management)
7. [Route Structure](#7-route-structure)
8. [Responsive Design Strategy](#8-responsive-design-strategy)
9. [Gamification System](#9-gamification-system)
10. [Accessibility & Age Considerations](#10-accessibility--age-considerations)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the complete UI/UX design system for the Abeka Curriculum Organization System — a specialized module within Cung Con Tu Hoc that enables structured K4-12 curriculum management, parent planning tools, and gamified student learning experiences.

### 1.2 Key Differentiation

| Aspect | Lesson Wizard | Abeka Curriculum System |
|--------|--------------|------------------------|
| **Theme** | Space/Nebula | Skill Tree/Adventure Map |
| **Mascot** | KidMascot (child fox) | Kisu (scholar fox) |
| **Primary User** | Students (active learning) | Parents (planning) + Students (progression) |
| **Visual Metaphor** | Space journey | RPG skill tree/map exploration |
| **Interaction Model** | Linear step-by-step | Non-linear branching paths |
| **Background** | Animated stars/nebula | Stylized parchment/map texture |

### 1.3 Core Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Clarity First** | Clear visual hierarchy; parents can plan in 5 minutes |
| **Gamified Progression** | RPG-style skill tree for students; badges and streaks |
| **Age-Appropriate** | K4-5: Large touch targets, minimal text; G6-12: Dense info, self-navigation |
| **Brand Consistency** | Kisu mascot integration; Vietnamese cultural elements |
| **Responsive by Default** | Desktop-first for parents; tablet-optimized for students |

---

## 2. Design System

### 2.1 Brand Colors

```
Primary Palette (from Kisu Character Bible):
├── Amber Điệp       #C97A2F  → Primary actions, highlights, warmth
├── Ink Blue         #1B4F8A  → Headers, trust elements, links
├── Chàm Jade        #4ECDC4  → Success states, accents, gamification
├── Navy Đêm         #1A2744  → Text, dark mode backgrounds
├── Ivory Ấm         #F5EDD6  → Cards, content backgrounds
├── Soil Brown       #7A3B2E  → Borders, subtle accents
└── Gold Star        #FFD700  → Achievements, milestones

Extended Curriculum Palette:
├── Grade K4-K5      #FF9F43  → Warm orange (early childhood)
├── Grade 1-2        #F368E0  → Playful pink (early elementary)
├── Grade 3-4        #54A0FF  → Curious blue (upper elementary)
├── Grade 5-6        #5F27CD  → Deep purple (middle transition)
├── Grade 7-8        #00D2D3  → Fresh teal (middle school)
├── Grade 9-10       #FF6B6B  → Bold red (high school intro)
├── Grade 11-12      #48DBFB  → Sky blue (college prep)
└── Subject Neutral  #8395A7  → Slate gray (multi-subject)
```

### 2.2 Typography

**Font Stack:**
```css
/* Vietnamese-optimized Google Fonts */
--font-heading: 'Be Vietnam Pro', 'Inter', sans-serif;
--font-body: 'Be Vietnam Pro', 'Inter', sans-serif;
--font-display: 'Quicksand', 'Be Vietnam Pro', sans-serif; /* Playful for kids */
```

**Type Scale:**

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| **Hero** | 2.5rem/40px | 800 | Parent dashboard welcome |
| **H1** | 2rem/32px | 700 | Section headers |
| **H2** | 1.5rem/24px | 600 | Card titles |
| **H3** | 1.25rem/20px | 600 | Subsection headers |
| **Body** | 1rem/16px | 400 | General content |
| **Small** | 0.875rem/14px | 400 | Metadata, timestamps |
| **Tiny** | 0.75rem/12px | 500 | Labels, badges |
| **Kid Display** | 1.25rem/20px | 700 | Student-facing headers (larger for readability) |

### 2.3 Spacing System

```
Spacing Scale (based on 4px grid):
├── xs:   4px   → Micro spacing (icon gaps)
├── sm:   8px   → Tight spacing (button padding)
├── md:   16px  → Standard spacing (card padding)
├── lg:   24px  → Section gaps
├── xl:   32px  → Major section breaks
├── 2xl:  48px  → Page-level spacing
└── 3xl:  64px  → Hero/dramatic spacing
```

### 2.4 Component Primitives

**Buttons:**
```
Primary:    bg-Amber-Điệp #C97A2F, text-white, rounded-xl, shadow-md
Secondary:  bg-Ivory, border-Soil-Brown, text-Navy-Đêm, rounded-xl
Ghost:      bg-transparent, hover:bg-slate-100, text-Navy-Đêm
Kid Primary: bg-Chàm-Jade #4ECDC4, text-white, rounded-2xl, shadow-lg, scale-on-press
```

**Cards:**
```
Standard:   bg-white, rounded-2xl, border-slate-200, shadow-sm
Elevated:   bg-white, rounded-2xl, shadow-lg (for modals/featured)
Kid Card:   bg-gradient-to-br, rounded-3xl, border-2 (color by grade)
Map Node:   Circular, glow effect, pulse animation when available
```

**Progress Indicators:**
```
Linear:     Rounded-full track, gradient fill (brand colors)
Circular:   SVG ring, stroke-dashoffset animation
Streak:     Flame icon + number, gradient text (yellow→orange→red)
```

---

## 3. User Personas & Device Context

### 3.1 Parent (Planner)

**Profile:**
- Age: 28-45
- Tech comfort: Medium-High
- Primary device: Desktop/Laptop (planning sessions)
- Secondary: Mobile (quick checks)
- Goals: Plan weekly curriculum, monitor multiple children, customize learning paths

**Pain Points:**
- Overwhelmed by curriculum choices
- Hard to track progress across multiple kids
- Unclear about time requirements
- Need to coordinate with teachers

**Design Priorities:**
1. Quick-glance dashboard
2. Drag-and-drop planning
3. Multi-child toggle
4. Clear time estimates

### 3.2 Student (K4-12)

**Profile:**
- Age: 4-18 (wide range!)
- Tech comfort: High (digital natives)
- Primary device: Tablet (iPad/Android, 10-11")
- Secondary: Desktop (school/lab)
- Goals: Complete lessons, unlock content, maintain streaks, earn badges

**Age-Specific Considerations:**

| Grade | Age | Cognitive | UI Requirements |
|-------|-----|-----------|-----------------|
| K4-K5 | 4-5 | Pre-reading | Large touch targets (min 60x60px), audio narration, picture-based navigation |
| G1-G2 | 6-7 | Early reading | Simple text labels, visual icons, guided tutorials |
| G3-G5 | 8-10 | Concrete thinking | Gamification rewards, progress visualization, some autonomy |
| G6-G8 | 11-13 | Abstract thinking | Self-directed navigation, social features, achievement tracking |
| G9-G12| 14-18 | Complex reasoning | Full functionality, study planning tools, exam prep focus |

### 3.3 Teacher (Assignment Manager)

**Profile:**
- Age: 25-55
- Tech comfort: Variable
- Primary device: Desktop (lesson planning)
- Secondary: Tablet (classroom management)
- Goals: Assign work, track class progress, adjust curriculum

---

## 4. Wireframe Descriptions

### 4.1 Parent Dashboard

**Layout: Desktop (1440px+)**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Nav]  🦊 Kisu  |  Dashboard  |  Curriculum  |  Reports  |  [User] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  👋 Welcome Back, [Parent]      [Child Selector ▼]           │   │
│  │  "Here's your curriculum overview for this week"             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ 📚 Subjects  │ │ 📅 Weekly    │ │ 🔥 Streak    │ │ ⏱️ Time     ││
│  │    5 Active  │ │   12 Lessons │ │   7 Days     │ │   4.5 hrs   ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘│
│                                                                     │
│  ┌─────────────────────────────────┐  ┌───────────────────────────┐  │
│  │  📊 CURRICULUM MAP              │  │  📋 THIS WEEK'S PLAN      │  │
│  │  ┌───┐  ┌───┐  ┌───┐           │  │  Mon: Phonics, Math...    │  │
│  │  │ENG│──│MTH│──│SCI│           │  │  Tue: Reading, Art...     │  │
│  │  └───┘  └───┘  └───┘           │  │  Wed: [+ Add Lesson]      │  │
│  │  ┌───┐  ┌───┐                   │  │                           │  │
│  │  │ART│  │HIS│                   │  │  [Customize Plan →]       │  │
│  │  └───┘  └───┘                   │  └───────────────────────────┘  │
│  │  [View Full Map →]              │                                 │  │
│  └─────────────────────────────────┘  ┌───────────────────────────┐  │
│                                       │  🎯 QUICK ACTIONS          │  │
│  ┌─────────────────────────────────┐  │  • Create Custom Path     │  │
│  │  👦 CHILDREN PROGRESS           │  │  • Assign to [Child]      │  │
│  │  ┌────────┐ ┌────────┐          │  │  • Browse Library         │  │
│  │  │Emma    │ │Jack    │          │  │  • View Reports           │  │
│  │  │85% ▲   │ │62% ▲   │          │  └───────────────────────────┘  │
│  │  └────────┘ └────────┘          │                                 │  │
│  └─────────────────────────────────┘                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Interactions:**
- **Child Selector:** Dropdown with avatars; selecting updates all widgets
- **Subject Nodes:** Hover reveals progress %; click opens subject detail
- **Weekly Plan:** Drag lessons between days; click to edit time estimates
- **Quick Actions:** Primary CTA = "Create Custom Learning Path"

**Mobile Adaptation (375px):**
- Stack all widgets vertically
- Horizontal scroll for subject nodes
- Weekly plan becomes swipeable cards (one day per card)
- Floating action button for quick actions

---

### 4.2 Student Learning Map (Skill Tree View)

**Layout: Tablet Landscape (1024px)** — Primary Student View

```
┌─────────────────────────────────────────────────────────────────────┐
│  [← Back]  🦊 Kisu    "Chào bé [Name]! Cùng khám phá nhé!"           │
├─────────────────────────────────────────────────────────────────────┤
│  [Grade Filter: K4 ▼]  [Subject Filter: All ▼]   [🔍 Search]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│        ╭─────────╮                                                  │
│        │  🎓     │ ← Current Position (Bouncing Kisu avatar)        │
│        │ GRADE 1 │                                                  │
│        ╰────┬────╯                                                  │
│             │                                                       │
│       ┌─────┴─────┐                                                 │
│       │           │                                                 │
│   ╭───┴───╮   ╭───┴───╮                                             │
│   │📖 ENG │   │🔢 MTH │                                             │
│   │  85%  │   │  62%  │                                             │
│   ╰───┬───╯   ╰───┬───╯                                             │
│       │           │                                                 │
│   ┌───┴───┐   ┌───┴───┐                                             │
│   │       │   │       │                                             │
│ ╭─┴─╮   ╭─┴─╮ ╭─┴─╮   ╭─┴─╮                                         │
│ │🔓 │   │🔓 │ │🔐 │   │🔐 │                                         │
│ │RD │   │WR │ │SC │   │AR │                                         │
│ │100│   │70 │ │?? │   │?? │                                         │
│ ╰───╯   ╰───╯ ╰───╯   ╰───╯                                         │
│                                                                     │
│  [Legend: 🔓 Unlocked  🔐 Locked  ⭐ Mastery  🎯 In Progress]        │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐│
│  │  📱 TODAY'S MISSION                                            ││
│  │  • Complete "Phonics: Short A" (15 min)                       ││
│  │  • Practice "Counting 1-20" (10 min)                          ││
│  │  • [Start Learning →]                                          ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Visual Design Details:**

**Node States:**
```
UNLOCKED (🔓):
├── Background: Grade color gradient
├── Border: 3px solid white, glow effect
├── Icon: Subject emoji/icon
├── Progress: Circular badge showing %
└── Animation: Subtle pulse (CSS keyframes)

LOCKED (🔐):
├── Background: Desaturated gray (#94A3B8)
├── Border: Dashed border
├── Icon: Lock icon (Lucide)
├── Overlay: "Complete [Prerequisite] to unlock"
└── Animation: Shake on attempted click

MASTERY (⭐):
├── Background: Gold gradient (#FFD700)
├── Border: 4px solid #FFD700 with sparkle
├── Icon: Star badge
├── Badge: "Xuất sắc" banner
└── Animation: Sparkle particles on hover

IN_PROGRESS (🎯):
├── Background: Chàm Jade gradient
├── Border: 3px dashed Chàm Jade
├── Icon: Target/crosshair
├── Indicator: Progress ring around node
└── Animation: Gentle bounce
```

**Kisu Avatar on Map:**
- Positioned at "current" node
- Small animated avatar (60x60px)
- Faces direction of next recommended node
- Click opens encouragement dialog

**Interactions:**
- **Node Tap:** Opens lesson preview modal with video thumbnail
- **Path Drag:** Can view prerequisites by tracing connections
- **Zoom/Pan:** Pinch to zoom on mobile; scrollbars on desktop
- **Filter:** Real-time tree filtering without page reload

---

### 4.3 Curriculum Browser

**Layout: Desktop (1440px)**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Nav]  🦊 Kisu  |  Dashboard  |  **Curriculum**  |  Reports       │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Search Curriculum...                              [Filters ▼]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│  │ [X] Grade: │ │ [X] Subject│ │ [X] Topic  │ │ [X] Format │     │
│  │ K4, K5     │ │ Math, Eng  │ │ Phonics    │ │ Video      │     │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SORT BY: Relevance ▼    124 Results    [View: Grid | List] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │               │ │               │ │               │             │
│  │  [Thumbnail]  │ │  [Thumbnail]  │ │  [Thumbnail]  │             │
│  │  ▶️ 12:34     │ │  ▶️ 08:45     │ │  ▶️ 15:20     │             │
│  │               │ │               │ │               │             │
│  │ Phonics: A    │ │ Counting 1-10 │ │ Colors &      │             │
│  │ Grade: K4     │ │ Grade: K4     │ │ Shapes        │             │
│  │ Subject: ENG  │ │ Subject: MTH  │ │ Grade: K4     │             │
│  │               │ │               │ │ Subject: ART  │             │
│  │ ⭐ 4.8 (124)  │ │ ⭐ 4.6 (89)   │ │ ⭐ 4.9 (203)  │             │
│  │               │ │               │ │               │             │
│  │ [+ Add to     │ │ [+ Add to     │ │ [+ Add to     │             │
│  │    Plan]      │ │    Plan]      │ │    Plan]      │             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
│                                                                     │
│  [← Previous]  Page 1 of 5  [Next →]                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Card Components:**

**Curriculum Card (Grid View):**
```
Structure:
├── Thumbnail (16:9, object-cover)
│   ├── Play icon overlay (center)
│   ├── Duration badge (bottom-right)
│   └── Grade badge (top-left, color-coded)
├── Content
│   ├── Title (2 lines max, ellipsis)
│   ├── Metadata row: Subject badge + Grade
│   ├── Rating: Stars + count
│   └── Description (1 line, gray text)
└── Action
    ├── [Quick Preview] → Modal video player
    ├── [+ Add to Plan] → Dropdown: select child/plan
    └── [Details →] → Full lesson page
```

**Quick Preview Modal:**
```
┌────────────────────────────────────────┐
│  [X]  Phonics: Short Vowel "A"          │
├────────────────────────────────────────┤
│                                        │
│     ┌────────────────────────────┐     │
│     │                            │     │
│     │    [Video Player Area]     │     │
│     │    ▶️ Click to Preview     │     │
│     │                            │     │
│     └────────────────────────────┘     │
│                                        │
│  📚 Learning Objectives:               │
│  • Recognize short "a" sound          │
│  • Identify words: cat, hat, mat        │
│                                        │
│  ⏱️ Duration: 12:34  |  🎯 Age: 4-5    │
│                                        │
│  [+ Add to [Emma]'s Plan]  [Close]    │
└────────────────────────────────────────┘
```

---

### 4.4 Daily Plan View (Student-Facing)

**Layout: Tablet Portrait (768px)** — Primary for students

```
┌─────────────────────────────────────┐
│ [←]  📅 Hôm nay, 3 Tháng 4     [🔔]│
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🔥 Streak: 7 ngày            │  │
│  │  ████████░░ 7/10 → Phần thưởng │  │
│  └───────────────────────────────┘  │
│                                     │
│  ⏰ Còn lại: ~45 phút              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  📖 Tiếng Anh                  │  │
│  │  ════════════════░░░░  70%    │  │
│  │  [🎬] Phonics: Short A (12:34) │  │
│  │     ▶️ Đang xem...            │  │
│  │  [📝] Từ vựng: Động vật       │  │
│  │     ✏️ Chưa làm               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🔢 Toán Tư Duy                │  │
│  │  ═══════░░░░░░░░░░░  30%      │  │
│  │  [🎬] Đếm số 1-20 (08:45)     │  │
│  │     ▶️ Bắt đầu                │  │
│  │  [🎯] Trò chơi: Sắp xếp số    │  │
│  │     🔒 Khóa                   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🎨 Mỹ Thuật                   │  │
│  │  ═░░░░░░░░░░░░░░░░░  0%       │  │
│  │  [🎬] Tô màu cầu vồng (15:20) │  │
│  │     ▶️ Bắt đầu                │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🦊 Kisu nói:                 │  │
│  │  "Con đang làm rất tốt!       │  │
│  │   Cố lên hoàn thành bài       │  │
│  │   Tiếng Anh nhé!"             │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Lesson Item States:**

```
NOT_STARTED:
├── Icon: Subject icon (outlined)
├── Status: "Bắt đầu" button
├── Time: Estimated duration
└── Style: Default opacity

IN_PROGRESS:
├── Icon: Subject icon (filled, Chàm Jade)
├── Status: Progress bar + "Đang xem..."
├── Time: Remaining time calculation
└── Style: Elevated card, subtle glow

COMPLETED:
├── Icon: Checkmark in circle (green)
├── Status: "Hoàn thành!" badge
├── Time: "Đã xem 12:34"
└── Style: Reduced opacity, checkmark overlay

LOCKED:
├── Icon: Lock icon
├── Status: "Hoàn thành [prerequisite] để mở"
├── Time: Hidden
└── Style: Grayscale, 50% opacity
```

**Streak Component Detail:**
```
Visual:
├── Flame icon (animated CSS)
├── Number: Large, gradient text (yellow→red)
├── Progress: Horizontal bar to next reward
├── Reward preview: "Còn 3 ngày → Huy hiệu Vàng"
└── Confetti trigger on milestone
```

---

## 5. Component Hierarchy

### 5.1 Component Tree

```
app/
├── (curriculum)/
│   ├── layout.tsx                    # Curriculum layout with Kisu sidebar
│   ├── page.tsx                      # Redirect to /parent/curriculum
│   ├── parent/
│   │   ├── curriculum/
│   │   │   ├── page.tsx              # Parent Dashboard (main view)
│   │   │   ├── browser/
│   │   │   │   └── page.tsx          # Curriculum Browser
│   │   │   ├── planner/
│   │   │   │   └── page.tsx          # Custom Learning Path Creator
│   │   │   └── reports/
│   │   │       └── page.tsx          # Progress Reports
│   │   └── dashboard/
│   │       └── page.tsx              # Existing parent dashboard
│   └── student/
│       ├── map/
│       │   └── page.tsx              # Skill Tree Learning Map
│       ├── daily/
│       │   └── page.tsx              # Daily Plan View
│       └── lesson/
│           └── [id]/
│               └── page.tsx          # Lesson Player (existing)
│
components/
├── curriculum/
│   ├── parent/
│   │   ├── curriculum-dashboard.tsx
│   │   ├── subject-grid.tsx          # Subject node grid
│   │   ├── weekly-planner.tsx        # Drag-drop weekly view
│   │   ├── child-progress-cards.tsx  # Multi-child overview
│   │   ├── time-estimate-display.tsx
│   │   └── quick-actions-panel.tsx
│   │
│   ├── student/
│   │   ├── skill-tree-map.tsx        # Main skill tree canvas/SVG
│   │   ├── skill-node.tsx            # Individual tree node
│   │   ├── connection-path.tsx       # SVG paths between nodes
│   │   ├── daily-plan-view.tsx
│   │   ├── lesson-item.tsx
│   │   ├── streak-display.tsx
│   │   ├── kisu-guide-dialog.tsx     # Mascot encouragement
│   │   └── achievement-popup.tsx
│   │
│   ├── shared/
│   │   ├── curriculum-card.tsx       # Reusable lesson card
│   │   ├── subject-badge.tsx         # Color-coded badges
│   │   ├── progress-ring.tsx         # Circular progress
│   │   ├── difficulty-indicator.tsx
│   │   ├── filter-panel.tsx
│   │   ├── search-bar.tsx
│   │   └── empty-state.tsx
│   │
│   └── browser/
│       ├── curriculum-grid.tsx
│       ├── curriculum-list.tsx       # List view alternative
│       ├── filter-chips.tsx
│       ├── preview-modal.tsx
│       └── pagination.tsx
│
├── ui/
│   └── (shadcn components - existing)
│
└── mascot/
    └── kisu-avatar.tsx               # Animated Kisu component
```

### 5.2 Key Component Specifications

**SkillTreeMap Component:**
```typescript
interface SkillTreeMapProps {
  childId: string;
  grade: string;           // K4, K5, G1, etc.
  subjects: SubjectNode[];
  currentPosition: string; // nodeId
  unlockedNodes: string[];
  completedNodes: string[];
  onNodeClick: (nodeId: string) => void;
  onNodeHover: (nodeId: string | null) => void;
}

interface SubjectNode {
  id: string;
  subject: 'ENG' | 'MTH' | 'SCI' | 'ART' | 'HIS';
  title: string;
  description: string;
  grade: string;
  progress: number;        // 0-100
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';
  prerequisites: string[];
  lessons: LessonRef[];
  position: { x: number; y: number }; // Canvas coordinates
}
```

**WeeklyPlanner Component:**
```typescript
interface WeeklyPlannerProps {
  childId: string;
  weekStart: Date;
  days: PlannedDay[];
  availableLessons: LessonRef[];
  onMoveLesson: (lessonId: string, fromDay: number, toDay: number) => void;
  onAddLesson: (day: number, lessonId: string) => void;
  onRemoveLesson: (day: number, lessonId: string) => void;
  onTimeEstimateChange: (day: number, minutes: number) => void;
}

interface PlannedDay {
  dayOfWeek: number;       // 0-6 (Sun-Sat)
  date: Date;
  lessons: PlannedLesson[];
  totalMinutes: number;
  isRestDay: boolean;
}
```

---

## 6. State Management

### 6.1 Global State (Zustand Store)

```typescript
// stores/curriculum-store.ts
interface CurriculumState {
  // Active selections
  activeChildId: string | null;
  activeGrade: string;
  activeSubject: string | null;
  
  // Filter states
  filters: {
    grades: string[];
    subjects: string[];
    topics: string[];
    formats: ('video' | 'interactive' | 'worksheet')[];
    searchQuery: string;
  };
  
  // View preferences
  viewMode: 'grid' | 'list' | 'map';
  sortBy: 'relevance' | 'newest' | 'popular' | 'progress';
  
  // Planning state
  draftPlan: DraftPlan | null;
  isPlanningDirty: boolean;
  
  // Actions
  setActiveChild: (childId: string) => void;
  setFilter: (key: keyof Filters, value: unknown) => void;
  clearFilters: () => void;
  updateDraftPlan: (plan: DraftPlan) => void;
  savePlan: () => Promise<void>;
}
```

### 6.2 Server State (TanStack Query)

```typescript
// queries/curriculum-queries.ts
export function useCurriculumMap(childId: string, grade: string) {
  return useQuery({
    queryKey: ['curriculum', 'map', childId, grade],
    queryFn: () => fetchCurriculumMap(childId, grade),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDailyPlan(childId: string, date: Date) {
  return useQuery({
    queryKey: ['curriculum', 'daily', childId, date],
    queryFn: () => fetchDailyPlan(childId, date),
    staleTime: 1 * 60 * 1000, // 1 minute (fresher data)
  });
}

export function useProgressUpdate() {
  return useMutation({
    mutationFn: updateLessonProgress,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
```

### 6.3 Local State (Component-Level)

```typescript
// SkillTreeMap internal state
const [zoom, setZoom] = useState(1);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [hoveredNode, setHoveredNode] = useState<string | null>(null);
const [selectedNode, setSelectedNode] = useState<string | null>(null);

// WeeklyPlanner internal state
const [draggingLesson, setDraggingLesson] = useState<string | null>(null);
const [expandedDay, setExpandedDay] = useState<number | null>(null);
const [showConflictModal, setShowConflictModal] = useState(false);
```

### 6.4 URL State (TanStack Router)

```typescript
// Route parameters and search params
{
  // /curriculum/parent/browser?grade=K4,K5&subject=ENG&view=grid
  path: '/curriculum/parent/browser',
  search: {
    grade: z.array(z.string()).optional(),
    subject: z.array(z.string()).optional(),
    topic: z.string().optional(),
    view: z.enum(['grid', 'list']).default('grid'),
    page: z.number().default(1),
  }
}

// /curriculum/student/map?childId=xxx&grade=K4
{
  path: '/curriculum/student/map',
  search: {
    childId: z.string(),
    grade: z.string(),
    focusNode: z.string().optional(), // for deep linking
  }
}
```

---

## 7. Route Structure

### 7.1 Route Definitions (TanStack Router)

```typescript
// routes/curriculum.tsx
export const curriculumRoute = rootRoute.createRoute({
  path: 'curriculum',
  component: CurriculumLayout,
});

// Parent Routes
export const parentCurriculumRoute = curriculumRoute.createRoute({
  path: 'parent',
  component: ParentCurriculumLayout,
});

export const parentDashboardRoute = parentCurriculumRoute.createRoute({
  path: '/',
  component: ParentCurriculumDashboard,
});

export const browserRoute = parentCurriculumRoute.createRoute({
  path: 'browser',
  component: CurriculumBrowser,
  validateSearch: z.object({
    grade: z.array(z.string()).optional(),
    subject: z.array(z.string()).optional(),
    topic: z.string().optional(),
    search: z.string().optional(),
    view: z.enum(['grid', 'list']).default('grid'),
    page: z.number().min(1).default(1),
    sort: z.enum(['relevance', 'newest', 'popular']).default('relevance'),
  }),
});

export const plannerRoute = parentCurriculumRoute.createRoute({
  path: 'planner',
  component: LearningPathPlanner,
  validateSearch: z.object({
    childId: z.string(),
    week: z.string().optional(), // ISO week format: 2026-W14
  }),
});

export const reportsRoute = parentCurriculumRoute.createRoute({
  path: 'reports',
  component: CurriculumReports,
  validateSearch: z.object({
    childId: z.string().optional(),
    period: z.enum(['week', 'month', 'semester']).default('week'),
  }),
});

// Student Routes
export const studentCurriculumRoute = curriculumRoute.createRoute({
  path: 'student',
  component: StudentCurriculumLayout,
});

export const studentMapRoute = studentCurriculumRoute.createRoute({
  path: 'map',
  component: SkillTreeMapView,
  validateSearch: z.object({
    childId: z.string(),
    grade: z.string(),
    focusNode: z.string().optional(),
  }),
});

export const dailyPlanRoute = studentCurriculumRoute.createRoute({
  path: 'daily',
  component: DailyPlanView,
  validateSearch: z.object({
    childId: z.string(),
    date: z.string().optional(), // ISO date: 2026-04-03
  }),
});
```

### 7.2 Route Guards & Layouts

```typescript
// layouts/curriculum-layout.tsx
export function CurriculumLayout() {
  const { user } = useAuth();
  const { childId } = useSearch({ from: '/curriculum' });
  
  // Validate child belongs to parent
  const { data: children } = useUserChildren();
  const validChild = children?.find(c => c.id === childId);
  
  if (!validChild) {
    return <Navigate to="/parent/dashboard" />;
  }
  
  return (
    <div className="curriculum-layout">
      <KisuSidebar childId={validChild.id} />
      <main className="curriculum-main">
        <Outlet />
      </main>
    </div>
  );
}

// layouts/parent-curriculum-layout.tsx
export function ParentCurriculumLayout() {
  const { user } = useAuth();
  
  if (user.role !== 'parent') {
    return <Navigate to="/unauthorized" />;
  }
  
  return (
    <div className="parent-curriculum-layout">
      <CurriculumBreadcrumb />
      <ParentCurriculumNav />
      <Outlet />
    </div>
  );
}

// layouts/student-curriculum-layout.tsx
export function StudentCurriculumLayout() {
  const { user } = useAuth();
  
  // Students access via parent-linked account or direct
  if (!user.isStudent && !user.isLinkedToParent) {
    return <Navigate to="/parent/dashboard" />;
  }
  
  return (
    <div className="student-curriculum-layout">
      <StudentHeader />
      <Outlet />
      <KisuEncouragementWidget />
    </div>
  );
}
```

---

## 8. Responsive Design Strategy

### 8.1 Breakpoint System

```typescript
// Tailwind config additions
screens: {
  'xs': '375px',      // Small phones
  'sm': '640px',      // Large phones
  'md': '768px',      // Tablets portrait
  'lg': '1024px',     // Tablets landscape / small laptops
  'xl': '1280px',     // Desktops
  '2xl': '1536px',    // Large monitors
}
```

### 8.2 Device-Specific Adaptations

**Desktop (1280px+):** Parent Planning Mode
```
Features:
├── Side-by-side layout (plan + preview)
├── Drag-and-drop lesson scheduling
├── Multi-child split view (optional)
├── Full filter panel (always visible)
└── Keyboard shortcuts support
```

**Tablet Landscape (1024px):** Student Learning Mode
```
Features:
├── Skill tree full width
├── Hover tooltips (stylus/finger)
├── Split view: map + daily plan
├── Gesture support (pinch zoom)
└── Floating Kisu assistant
```

**Tablet Portrait (768px):** Student Daily Mode
```
Features:
├── Single column layout
├── Swipeable lesson cards
├── Large touch targets (min 60px)
├── Bottom sheet for details
└── Simplified navigation
```

**Mobile (375px):** Quick Check Mode
```
Features:
├── Collapsible sections
├── Horizontal scroll for subjects
├── Bottom nav bar
├── Pull-to-refresh
└── Offline indicator
```

### 8.3 Responsive Component Examples

**SubjectGrid Responsive:**
```tsx
// Desktop: 5 columns, full cards
// Tablet: 3 columns, compact cards
// Mobile: Horizontal scroll, snap points

function SubjectGrid({ subjects }: SubjectGridProps) {
  return (
    <div className="
      grid gap-4
      grid-cols-1                  // Mobile: 1 col (scroll)
      sm:grid-cols-2              // Small tablet: 2 cols
      md:grid-cols-3              // Tablet: 3 cols
      lg:grid-cols-4              // Desktop: 4 cols
      xl:grid-cols-5              // Large: 5 cols
      overflow-x-auto             // Mobile scroll
      sm:overflow-visible         // Desktop no scroll
      snap-x snap-mandatory       // Mobile snap
    ">
      {subjects.map(subject => (
        <SubjectCard 
          key={subject.id} 
          subject={subject}
          compact={useIsMobile()}   // Compact mode on mobile
        />
      ))}
    </div>
  );
}
```

**Skill Tree Zoom/Pan:**
```tsx
// Mobile: Pinch to zoom, pan with 2 fingers
// Desktop: Scroll to zoom, drag to pan
// Both: Animated transitions

function useSkillTreeNavigation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  
  // Touch gestures (mobile)
  usePinch(containerRef, ({ offset: [scale] }) => {
    setTransform(t => ({ ...t, scale: clamp(scale, 0.5, 2) }));
  });
  
  usePan(containerRef, ({ offset: [x, y] }) => {
    setTransform(t => ({ ...t, x, y }));
  });
  
  // Wheel zoom (desktop)
  useWheel(containerRef, ({ delta: [, dy] }) => {
    setTransform(t => ({ 
      ...t, 
      scale: clamp(t.scale + dy * 0.001, 0.5, 2) 
    }));
  });
  
  return { containerRef, transform };
}
```

---

## 9. Gamification System

### 9.1 Visual Reward Elements

**Streak Display:**
```
Component: StreakFlame
├── Animated SVG flame (CSS keyframes)
├── Number with gradient fill
├── Progress bar to next milestone
├── Milestone markers (3, 7, 14, 30, 60, 100 days)
└── Confetti trigger on milestone reach

Animation States:
├── Idle: Gentle flame flicker
├── Growing: Intensify flame, scale number
├── Milestone: Explosion of confetti + flame burst
└── Broken: Fade out, sad Kisu reaction
```

**Achievement Badges:**
```
Badge Types:
├── Subject Mastery: "Bậc Thầy Toán Học" (Math Master)
├── Streak: "Người Kiên Trì" (7 days), "Huyền Thoại" (100 days)
├── Exploration: "Nhà Thám Hiểm" (try all subjects)
├── Speed: "Tia Chớp" (complete 3 lessons in one day)
└── Social: "Người Truyền Lửa" (help sibling complete lesson)

Badge Visual:
├── Circular badge with subject color
├── Icon: Subject symbol + achievement type
├── Border: Star points for rarity
└── Glow effect on hover
```

**Progress Celebrations:**
```
Trigger Points:
├── Lesson Complete: Small pop + Kisu cheer
├── Daily Plan Complete: Medium celebration + streak update
├── Weekly Plan Complete: Large confetti + badge unlock
├── Subject Mastery: Epic animation + certificate
└── Grade Completion: Full-screen celebration + Kisu dance

Animation Library:
├── canvas-confetti for particle effects
├── Framer Motion for UI transitions
├── CSS keyframes for continuous animations
└── Lottie for complex mascot animations
```

### 9.2 Gamification State Integration

```typescript
interface GamificationState {
  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  streakStartDate: Date;
  lastActivityDate: Date;
  streakAtRisk: boolean; // 20+ hours since last activity
  
  // Achievements
  unlockedAchievements: Achievement[];
  achievementProgress: Record<string, number>;
  newAchievements: string[]; // Pending notification
  
  // Level/XP
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  
  // Subject-specific
  subjectProgress: Record<string, {
    lessonsCompleted: number;
    masteryScore: number;
    timeSpent: number;
  }>;
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak_7',
    title: 'Người Kiên Trì',
    description: 'Học liên tục 7 ngày',
    icon: '🔥',
    rarity: 'bronze',
    condition: (state) => state.currentStreak >= 7,
  },
  {
    id: 'math_master',
    title: 'Bậc Thầy Toán Học',
    description: 'Hoàn thành 50 bài Toán',
    icon: '🔢',
    rarity: 'gold',
    condition: (state) => state.subjectProgress.MTH?.lessonsCompleted >= 50,
  },
  // ... more achievements
];
```

---

## 10. Accessibility & Age Considerations

### 10.1 WCAG 2.1 AA Compliance

```
Color Contrast:
├── All text: Minimum 4.5:1 ratio
├── Large text (18px+): Minimum 3:1 ratio
├── UI components: Minimum 3:1 ratio
└── Use Stark or A11y plugin for verification

Focus Indicators:
├── Visible focus ring on all interactive elements
├── High contrast focus color (Chàm Jade)
├── Skip links for keyboard navigation
└── Focus trap in modals

Screen Reader Support:
├── ARIA labels on all icons
├── Live regions for dynamic updates
├── Heading hierarchy (h1→h6)
├── Alt text on all images
└── Role attributes for custom components
```

### 10.2 Age-Specific Accessibility

**K4-K5 (Ages 4-5):**
```
Design Adjustments:
├── Touch targets: Minimum 60x60px
├── Text size: 18px minimum
├── High contrast mode by default
├── Audio narration for all text
├── Picture-based navigation (minimal reading)
├── Simplified UI (3 options max)
└── Parental gate for exiting

Interaction Model:
├── Tap to select (no drag)
├── Visual feedback for every action
├── No time pressure animations
├── Full-screen mode by default
└── Auto-save progress continuously
```

**G6-G12 (Ages 11-18):**
```
Design Adjustments:
├── Standard touch targets (44px)
├── Normal text sizes (16px)
├── Information-dense layouts OK
├── Keyboard shortcuts supported
├── Customizable themes
├── Study timer/pomodoro features
└── Social sharing (with parent approval)
```

### 10.3 Motion Preferences

```typescript
// Respect prefers-reduced-motion
const prefersReducedMotion = useReducedMotion();

// Animation wrapper component
function AccessibleAnimation({ 
  children, 
  animation,
  reducedMotionFallback 
}: AccessibleAnimationProps) {
  if (prefersReducedMotion) {
    return reducedMotionFallback || children;
  }
  
  return (
    <motion.div {...animation}>
      {children}
    </motion.div>
  );
}

// Usage
<AccessibleAnimation
  animation={{
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  }}
  reducedMotionFallback={<div>{content}</div>}
>
  <CelebrationContent />
</AccessibleAnimation>
```

### 10.4 Parental Controls Integration

```
Features:
├── Time limit settings (daily/weekly)
├── Content filters by grade level
├── Progress sharing preferences
├── Social feature enable/disable
├── Offline mode restrictions
└── Purchase protection

UI Location:
├── Settings gear in parent dashboard
├── Child profile management section
├── Quick toggle in main navigation
└── Setup wizard for new families
```

---

## Appendix A: Design Tokens Reference

```css
/* CSS Variables for the Design System */
:root {
  /* Brand Colors */
  --color-amber-diep: #C97A2F;
  --color-ink-blue: #1B4F8A;
  --color-cham-jade: #4ECDC4;
  --color-navy-dem: #1A2744;
  --color-ivory-am: #F5EDD6;
  --color-soil-brown: #7A3B2E;
  --color-gold-star: #FFD700;
  
  /* Grade Colors */
  --grade-k4: #FF9F43;
  --grade-k5: #FF9F43;
  --grade-g1: #F368E0;
  --grade-g2: #F368E0;
  --grade-g3: #54A0FF;
  --grade-g4: #54A0FF;
  --grade-g5: #5F27CD;
  --grade-g6: #5F27CD;
  --grade-g7: #00D2D3;
  --grade-g8: #00D2D3;
  --grade-g9: #FF6B6B;
  --grade-g10: #FF6B6B;
  --grade-g11: #48DBFB;
  --grade-g12: #48DBFB;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* Typography */
  --font-heading: 'Be Vietnam Pro', sans-serif;
  --font-body: 'Be Vietnam Pro', sans-serif;
  --font-display: 'Quicksand', sans-serif;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-glow: 0 0 20px rgba(78, 205, 196, 0.3);
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Animations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## Appendix B: Icon System

```
Icon Library: Lucide React
Size Guidelines:
├── Navigation: 24px
├── Buttons: 20px
├── Inline text: 16px
├── Badges: 14px
└── Decorative: 32px+ (with container)

Common Icons:
├── Navigation: Home, BookOpen, BarChart3, Settings
├── Actions: Plus, Trash2, Edit, Save, X
├── Status: CheckCircle2, Circle, Lock, Unlock
├── Learning: Play, Pause, BookOpen, GraduationCap
├── Gamification: Flame, Star, Trophy, Target
└── Communication: MessageCircle, Bell, Mail
```

---

## Appendix C: Unresolved Questions

1. **Internationalization:** Should curriculum content support bilingual (VN/EN) switching for international families?
2. **Offline Mode:** What curriculum features should work offline? Video download permissions?
3. **Teacher Role:** Do teachers need a separate dashboard, or can they use parent view with elevated permissions?
4. **Real-time Collaboration:** Should multiple parents edit a plan simultaneously? Conflict resolution strategy?
5. **Data Retention:** How long to keep completed lesson data vs. aggregate progress only?

---

*Document generated: April 3, 2026*  
*Status: Design Specification Ready for Implementation*  
*Next Steps: Component implementation in `src/components/curriculum/`*
