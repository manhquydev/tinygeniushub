---
title: "Phase 2: Parent Interface - Desktop-Focused Implementation"
description: "Curriculum browser, weekly planner with drag-drop, child progress dashboard, and assignment creation flows"
status: pending
priority: P1
effort: 30h
dependencies: ["phase-01-foundation"]
blocked_by: ["Database schema", "Core API endpoints"]
phase: 2
---

# Phase 2: Parent Interface - Desktop-Focused Implementation

## Overview

This phase implements the parent-facing desktop interface for the Abeka Curriculum System. Parents can browse the full curriculum, create weekly learning plans, track child progress, and manage assignments. The interface is optimized for desktop/tablet use with rich interactions.

**Duration**: Week 2-3  
**Effort**: 30 hours  
**Team Size**: 1-2 developers  
**Parallel**: Yes (can run concurrently with Phase 3 after Phase 1 DB is ready)

---

## Design System

### Color Palette

```typescript
// src/components/abeka/design/tokens.ts

export const abekaColors = {
  // Brand
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',  // Sky blue
    600: '#0284c7',
    700: '#0369a1',
  },
  
  // Subjects
  subjects: {
    phonics: '#8b5cf6',      // Purple
    arithmetic: '#10b981',   // Emerald
    bible: '#f59e0b',        // Amber
    writing: '#ef4444',      // Red
    science: '#06b6d4',      // Cyan
    history: '#d946ef',      // Fuchsia
    activities: '#84cc16',   // Lime
  },
  
  // Progress
  progress: {
    notStarted: '#e5e7eb',
    inProgress: '#3b82f6',
    completed: '#22c55e',
    overdue: '#ef4444',
  },
  
  // UI
  surface: '#ffffff',
  background: '#f8fafc',
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    muted: '#94a3b8',
  },
};
```

### Component Library

```typescript
// Key components to build/reuse

import {
  // shadcn/ui base
  Button, Card, Dialog, DropdownMenu,
  
  // Custom Abeka components
  GradeBadge,
  SubjectIcon,
  LessonCard,
  VideoThumbnail,
  ProgressBar,
  StreakFlame,
  WeeklyCalendar,
  AssignmentDroppable,
} from '@/components/abeka';
```

---

## Task Breakdown

### Task 2.1: Curriculum Browser (10h)

**Owner**: Frontend Developer

#### 2.1.1 Browser Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  📚 Duyệt Giáo Trình Abeka                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐ │
│  │  🎓 LỚP     │  │  📖 BÀI HỌC                              │ │
│  │             │  │                                          │ │
│  │ • K4        │  │  [🔍 Tìm bài học...    ] [⚙️ Bộ lọc ▼] │ │
│  │ • K5        │  │                                          │ │
│  │ • Lớp 1  ◄──┼──┤  ┌─────────────────────────────────┐    │ │
│  │ • Lớp 2     │  │  │ Bài 1: Phonics & Arithmetic    │    │ │
│  │ • Lớp 3     │  │  │ ┌─────┬─────┬─────┬─────┐      │    │ │
│  │ • ...       │  │  │ │ PH  │ AT  │ BI  │ CW  │      │    │ │
│  │             │  │  │ │ 15' │ 20' │ 10' │ 15' │      │    │ │
│  │             │  │  │ └─────┴─────┴─────┴─────┘      │    │ │
│  │             │  │  │ ✅ 4 videos | ⏱ 60 phút        │    │ │
│  │             │  │  └─────────────────────────────────┘    │ │
│  │             │  │                                          │ │
│  │             │  │  ┌─────────────────────────────────┐    │ │
│  │             │  │  │ Bài 2: Phonics & Arithmetic    │    │ │
│  │             │  │  │ ...                             │    │ │
│  │             │  │  └─────────────────────────────────┘    │ │
│  │             │  │                                          │ │
│  │             │  │  [← Trước]  Trang 1 / 17  [Sau →]      │ │
│  │             │  │                                          │ │
│  └─────────────┘  └──────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Implementation

```typescript
// src/app/(dashboard)/abeka/curriculum/page.tsx

export default async function CurriculumBrowserPage() {
  const session = await requireAuth();
  const grades = await fetchGrades();
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Grade Selector */}
      <aside className="w-64 border-r bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold">🎓 Chọn Lớp</h2>
        <GradeList grades={grades} />
      </aside>
      
      {/* Main Content - Lesson Browser */}
      <main className="flex-1 overflow-auto p-6">
        <LessonBrowser />
      </main>
    </div>
  );
}

// src/components/abeka/curriculum/LessonBrowser.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LessonCard } from './LessonCard';
import { LessonFilters } from './LessonFilters';
import { Pagination } from '@/components/ui/pagination';

export function LessonBrowser() {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    subjects: [] as AbekaSubjectCode[],
    status: 'all' as const,
    search: '',
  });
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['abeka-lessons', selectedGrade, filters, page],
    queryFn: () => fetchLessons({ 
      gradeId: selectedGrade, 
      ...filters,
      page,
      limit: 20,
    }),
    enabled: !!selectedGrade,
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📚 Duyệt Giáo Trình</h1>
          <p className="text-muted-foreground">
            Khám phá {data?.totalLessons || 0} bài học Abeka
          </p>
        </div>
        <LessonFilters 
          filters={filters} 
          onChange={setFilters}
        />
      </div>
      
      {/* Lesson Grid */}
      {isLoading ? (
        <LessonGridSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.lessons.map(lesson => (
              <LessonCard 
                key={lesson.id} 
                lesson={lesson}
                onSelect={() => openLessonDetail(lesson)}
              />
            ))}
          </div>
          
          <Pagination
            current={page}
            total={data?.totalPages || 1}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

#### 2.1.3 Lesson Card Component

```typescript
// src/components/abeka/curriculum/LessonCard.tsx

interface LessonCardProps {
  lesson: AbekaLessonWithPackages;
  onSelect: () => void;
  onAddToPlan?: () => void;
}

export function LessonCard({ lesson, onSelect, onAddToPlan }: LessonCardProps) {
  const totalDuration = lesson.packages.reduce(
    (sum, pkg) => sum + (pkg.durationMinutes || 0), 
    0
  );
  const videoCount = lesson.packages.reduce(
    (sum, pkg) => sum + pkg.videos.length, 
    0
  );
  
  return (
    <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              Bài {lesson.lessonNumber}
            </Badge>
            <CardTitle className="text-lg">
              {lesson.title || `Bài học ${lesson.lessonNumber}`}
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlan?.();
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent onClick={onSelect}>
        {/* Subject Grid */}
        <div className="grid grid-cols-4 gap-2">
          {lesson.packages.map(pkg => (
            <div 
              key={pkg.subjectCode}
              className="flex flex-col items-center rounded-lg p-2"
              style={{ 
                backgroundColor: `${abekaColors.subjects[pkg.subjectCode.toLowerCase()]}20`,
              }}
            >
              <SubjectIcon 
                code={pkg.subjectCode} 
                className="h-6 w-6"
                style={{ 
                  color: abekaColors.subjects[pkg.subjectCode.toLowerCase()],
                }}
              />
              <span className="mt-1 text-xs text-muted-foreground">
                {pkg.durationMinutes || '--'}'
              </span>
            </div>
          ))}
        </div>
        
        {/* Footer Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>🎥 {videoCount} videos</span>
          <span>⏱️ {totalDuration} phút</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 2.1.4 Lesson Detail Modal

```typescript
// src/components/abeka/curriculum/LessonDetailModal.tsx

interface LessonDetailModalProps {
  lesson: AbekaLessonWithPackages;
  isOpen: boolean;
  onClose: () => void;
  onAddToPlan: () => void;
}

export function LessonDetailModal({ 
  lesson, 
  isOpen, 
  onClose,
  onAddToPlan,
}: LessonDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Bài {lesson.lessonNumber}</span>
            {lesson.bibleVerse && (
              <Badge variant="secondary">📖 {lesson.bibleVerse}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Subject Videos */}
          {lesson.packages.map(pkg => (
            <div key={pkg.subjectCode} className="space-y-2">
              <div className="flex items-center gap-2">
                <SubjectIcon code={pkg.subjectCode} />
                <h3 className="font-semibold">
                  {getSubjectNameVi(pkg.subjectCode)}
                </h3>
              </div>
              
              <div className="grid gap-2">
                {pkg.videos.map(video => (
                  <VideoRow 
                    key={video.id} 
                    video={video}
                    onPlay={() => openVideoPlayer(video)}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {/* Memory Work */}
          {lesson.memoryWork && (
            <div className="rounded-lg bg-amber-50 p-4">
              <h4 className="mb-2 font-semibold text-amber-900">
                📝 Bài tập ghi nhớ
              </h4>
              <p className="text-amber-800">{lesson.memoryWork}</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={onAddToPlan}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm vào Kế hoạch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoRow({ video, onPlay }: { video: AbekaVideo; onPlay: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div 
        className="relative h-16 w-28 cursor-pointer overflow-hidden rounded"
        onClick={onPlay}
      >
        <VideoThumbnail url={video.thumbnailUrl} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="h-6 w-6 text-white" />
        </div>
      </div>
      
      <div className="flex-1">
        <p className="font-medium">{video.title}</p>
        <p className="text-sm text-muted-foreground">
          {video.teacherName} • {video.durationMinutes || '--'} phút
        </p>
      </div>
      
      <Button variant="ghost" size="sm" onClick={onPlay}>
        <Play className="mr-1 h-4 w-4" />
        Xem
      </Button>
    </div>
  );
}
```

---

### Task 2.2: Weekly Planner with Drag-Drop (10h)

**Owner**: Frontend Developer

#### 2.2.1 Planner Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  📅 Kế Hoạch Học Tập Tuần này                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ 🗓️ Tháng 4, 2026                                             │   │
│  │ [◀ Tuần trước]        Tuần 14          [Tuần sau ▶]         │   │
│  │ T2    T3    T4    T5    T6    T7    CN                      │   │
│  │ 7/4   8/4   9/4   10/4  11/4  12/4  13/4                    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────┐  ┌─────────────────────────────────────────────┐    │
│  │ 📚 KHO BÀI  │  │ 📅 LỊCH TUẦN                                │    │
│  │             │  │                                             │    │
│  │ Bài 135     │  │ ┌─────────┬─────────┬─────────┬─────────┐  │    │
│  │ Bài 136     │  │ │ T2 7/4  │ T3 8/4  │ T4 9/4  │ ...     │  │    │
│  │ Bài 137     │  │ ├─────────┼─────────┼─────────┼─────────┤  │    │
│  │ ...         │  │ │ 🎓      │ 🎓      │ 🎓      │         │  │    │
│  │             │  │ │ PH      │ PH      │ PH      │         │  │    │
│  │ Kéo thả     │  │ │ AT      │ AT      │ AT      │  Nghỉ   │  │    │
│  │ bài học     │  │ │         │ 🏊      │         │  cuối   │  │    │
│  │ vào đây     │  │ │         │ (bơi)   │         │  tuần   │  │    │
│  │             │  │ │ 2h      │ 2.5h    │ 2h      │         │  │    │
│  │             │  │ └─────────┴─────────┴─────────┴─────────┘  │    │
│  │             │  │                                             │    │
│  └─────────────┘  └─────────────────────────────────────────────┘    │
│                                                                       │
│  Tổng: 12.5 giờ/tuần | Mục tiêu: 10 giờ/tuần  ✅ Vượt mục tiêu      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### 2.2.2 DnD Implementation

```typescript
// src/components/abeka/planner/WeeklyPlanner.tsx

'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { LessonPool } from './LessonPool';
import { DayColumn } from './DayColumn';
import { LessonCard } from '../curriculum/LessonCard';

interface WeeklyPlannerProps {
  journeyId: string;
  weekNumber: number;
  lessons: AbekaLesson[];
  initialPlan?: AbekaWeeklyPlan;
}

export function WeeklyPlanner({ 
  journeyId, 
  weekNumber, 
  lessons,
  initialPlan,
}: WeeklyPlannerPlannerProps) {
  const [plan, setPlan] = useState<WeeklyPlanData>(() => 
    initializePlan(initialPlan, lessons)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Dragging from pool to day
    if (activeId.startsWith('pool-') && overId.startsWith('day-')) {
      const lessonId = activeId.replace('pool-', '');
      const dayIndex = parseInt(overId.replace('day-', ''), 10);
      
      addLessonToDay(lessonId, dayIndex);
    }
    
    // Dragging between days
    if (activeId.startsWith('day-') && overId.startsWith('day-')) {
      moveLessonBetweenDays(activeId, overId);
    }
    
    setActiveId(null);
  }
  
  async function savePlan() {
    await fetch(`/api/abeka/plans/weekly/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyPlans: plan.dailyPlans,
      }),
    });
    
    toast.success('Đã lưu kế hoạch tuần!');
  }
  
  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          📅 Tuần {weekNumber}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={autoGeneratePlan}>
            <Wand2 className="mr-2 h-4 w-4" />
            Tự động tạo
          </Button>
          <Button onClick={savePlan}>
            <Save className="mr-2 h-4 w-4" />
            Lưu kế hoạch
          </Button>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {/* Lesson Pool */}
          <LessonPool 
            lessons={lessons}
            usedLessonIds={getUsedLessonIds(plan)}
          />
          
          {/* Weekly Calendar */}
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, index) => (
                <DayColumn
                  key={day.key}
                  id={`day-${index}`}
                  day={day}
                  assignments={plan.dailyPlans[index]?.assignments || []}
                  onRemove={removeAssignment}
                />
              ))}
            </div>
            
            {/* Week Summary */}
            <WeekSummary plan={plan} />
          </div>
        </div>
        
        <DragOverlay>
          {activeId ? (
            <LessonCard 
              lesson={findLesson(activeId)} 
              isDragging 
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

#### 2.2.3 Day Column Component

```typescript
// src/components/abeka/planner/DayColumn.tsx

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DayColumnProps {
  id: string;
  day: { key: string; label: string; date: Date };
  assignments: AbekaAssignment[];
  onRemove: (assignmentId: string) => void;
}

export function DayColumn({ id, day, assignments, onRemove }: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  const totalMinutes = assignments.reduce(
    (sum, a) => sum + (a.lessonPackage?.durationMinutes || 0),
    0
  );
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border-2 p-2 transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-muted'
      )}
    >
      {/* Day Header */}
      <div className="mb-2 text-center">
        <div className="font-semibold">{day.label}</div>
        <div className="text-xs text-muted-foreground">
          {format(day.date, 'd/M')}
        </div>
      </div>
      
      {/* Assignments */}
      <div className="flex-1 space-y-2">
        <SortableContext items={assignments.map(a => a.id)}>
          {assignments.map(assignment => (
            <SortableAssignment
              key={assignment.id}
              assignment={assignment}
              onRemove={() => onRemove(assignment.id)}
            />
          ))}
        </SortableContext>
        
        {assignments.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded border border-dashed">
            <span className="text-xs text-muted-foreground">
              Kéo bài học vào đây
            </span>
          </div>
        )}
      </div>
      
      {/* Day Footer */}
      <div className="mt-2 border-t pt-2 text-center text-xs">
        <span className={cn(
          totalMinutes > 180 && 'text-orange-600 font-medium'
        )}>
          ⏱️ {Math.round(totalMinutes / 60 * 10) / 10}h
        </span>
      </div>
    </div>
  );
}

function SortableAssignment({ 
  assignment, 
  onRemove 
}: { 
  assignment: AbekaAssignment;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded border bg-white p-2 shadow-sm',
        isDragging && 'opacity-50'
      )}
    >
      <div 
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <SubjectIcon 
            code={assignment.subjectCode} 
            className="h-4 w-4"
          />
          <span className="text-sm font-medium truncate">
            Bài {assignment.lessonPackage.lesson.lessonNumber}
          </span>
        </div>
        
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{assignment.lessonPackage.durationMinutes || '--'} phút</span>
          <Badge 
            variant={assignment.status === 'COMPLETED' ? 'default' : 'secondary'}
            className="text-[10px]"
          >
            {getStatusLabel(assignment.status)}
          </Badge>
        </div>
      </div>
      
      <button
        onClick={onRemove}
        className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 group-hover:flex"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
```

---

### Task 2.3: Progress Dashboard (6h)

**Owner**: Frontend Developer

#### 2.3.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Tiến Độ Học Tập                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ 🔥 Chuỗi    │ │ 📚 Bài đã   │ │ ⏱️ Tổng     │ │ 🎯 Tiến độ  │ │
│  │    12       │ │    học 45   │ │   28.5 giờ  │ │   26%       │ │
│  │ ngày liên   │ │             │ │             │ │   Lớp 1     │ │
│  │ tiếp        │ │             │ │             │ │             │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📈 Tiến độ theo thời gian                                    ││
│  │                                                              ││
│  │        ┤                                                     ││
│  │  Bài   ┤    ╭─╮                                             ││
│  │  học   ┤   ╭╯ ╰╮  ╭─╮                                       ││
│  │        ┤  ╭╯   ╰──╯ ╰────╮                                  ││
│  │        ┤╭─╯               ╰───                               ││
│  │        ┼────┬────┬────┬────┬────┬────┬────                  ││
│  │           T1   T2   T3   T4   T5   T6   T7                   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📚 Tiến độ theo môn                                          ││
│  │                                                              ││
│  │ Phonics      ████████████████████░░░░░░  65%                  ││
│  │ Arithmetic   ██████████████░░░░░░░░░░░  45%                  ││
│  │ Writing      ██████████░░░░░░░░░░░░░░░  35%                  ││
│  │ Bible        ███████████████████░░░░░░  70%                  ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📅 Lịch sử hoạt động gần đây                                  ││
│  │                                                              ││
│  │ Hôm nay 09:15   ✅ Hoàn thành Bài 45 - Phonics              ││
│  │ Hôm nay 08:30   ⏱️  Đang học Bài 45 - Arithmetic            ││
│  │ Hôm qua 14:20   ✅ Hoàn thành Bài 44 - Tất cả môn           ││
│  │ ...                                                           ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### 2.3.2 Dashboard Implementation

```typescript
// src/app/(dashboard)/abeka/progress/page.tsx

export default async function ProgressDashboardPage() {
  const session = await requireAuth();
  const children = await fetchChildren(session.user.id);
  
  return (
    <div className="container mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">📊 Tiến Độ Học Tập</h1>
      
      <ChildSelector children={children} />
      
      <Suspense fallback={<DashboardSkeleton />}>
        <ProgressDashboard childId={children[0]?.id} />
      </Suspense>
    </div>
  );
}

// src/components/abeka/progress/ProgressDashboard.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { StatsCards } from './StatsCards';
import { ProgressChart } from './ProgressChart';
import { SubjectProgress } from './SubjectProgress';
import { ActivityHistory } from './ActivityHistory';

interface ProgressDashboardProps {
  childId: string;
}

export function ProgressDashboard({ childId }: ProgressDashboardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['abeka-progress', childId],
    queryFn: () => fetchProgressDashboard(childId),
  });
  
  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={data.stats} />
      
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📈 Tiến độ theo tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={data.weeklyProgress} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📚 Tiến độ theo môn</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectProgress subjects={data.subjectProgress} />
          </CardContent>
        </Card>
      </div>
      
      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📅 Lịch sử hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHistory activities={data.recentActivity} />
        </CardContent>
      </Card>
    </div>
  );
}

// Stats Cards Component
function StatsCards({ stats }: { stats: ProgressStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Flame className="h-5 w-5 text-orange-500" />}
        label="Chuỗi ngày liên tiếp"
        value={stats.currentStreak}
        subtext={`Kỷ lục: ${stats.longestStreak} ngày`}
        trend={stats.streakTrend}
      />
      
      <StatCard
        icon={<BookOpen className="h-5 w-5 text-blue-500" />}
        label="Bài học đã hoàn thành"
        value={stats.completedLessons}
        subtext={`/${stats.totalLessons} bài`}
        trend={stats.lessonsTrend}
      />
      
      <StatCard
        icon={<Clock className="h-5 w-5 text-green-500" />}
        label="Tổng thời gian"
        value={`${(stats.totalMinutes / 60).toFixed(1)}h`}
        subtext="Từ ngày bắt đầu"
      />
      
      <StatCard
        icon={<Target className="h-5 w-5 text-purple-500" />}
        label="Tiến độ tổng thể"
        value={`${Math.round(stats.overallProgress)}%`}
        subtext={stats.estimatedCompletion}
        progress={stats.overallProgress}
      />
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  trend,
  progress,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">{icon}</div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
          {trend && (
            <Badge variant={trend > 0 ? 'default' : 'destructive'}>
              {trend > 0 ? '+' : ''}{trend}%
            </Badge>
          )}
        </div>
        
        {progress !== undefined && (
          <Progress value={progress} className="mt-3" />
        )}
        
        <p className="mt-2 text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}
```

---

### Task 2.4: Assignment Creation (4h)

**Owner**: Frontend Developer

#### 2.4.1 Quick Assignment Flow

```typescript
// src/components/abeka/planner/QuickAssignModal.tsx

interface QuickAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: AbekaLesson;
  childId: string;
  journeyId: string;
}

export function QuickAssignModal({
  isOpen,
  onClose,
  lesson,
  childId,
  journeyId,
}: QuickAssignModalProps) {
  const [step, setStep] = useState<'date' | 'subjects' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSubjects, setSelectedSubjects] = useState<AbekaSubjectCode[]>(
    lesson.packages.map(p => p.subjectCode)
  );
  
  async function handleAssign() {
    await fetch('/api/abeka/plans/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId,
        journeyId,
        lessonId: lesson.id,
        date: selectedDate,
        subjects: selectedSubjects,
      }),
    });
    
    toast.success('Đã thêm bài học vào lịch!');
    onClose();
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📝 Thêm vào lịch học</DialogTitle>
        </DialogHeader>
        
        {/* Step Indicator */}
        <div className="mb-4 flex justify-center gap-2">
          {['date', 'subjects', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-2 w-8 rounded-full transition-colors',
                step === s ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
        
        {/* Step Content */}
        {step === 'date' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chọn ngày cho bài học này:
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              disabled={(date) => date < new Date()}
            />
            <Button onClick={() => setStep('subjects')} className="w-full">
              Tiếp theo
            </Button>
          </div>
        )}
        
        {step === 'subjects' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chọn môn học muốn giao:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {lesson.packages.map(pkg => (
                <label
                  key={pkg.subjectCode}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors',
                    selectedSubjects.includes(pkg.subjectCode)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  )}
                >
                  <Checkbox
                    checked={selectedSubjects.includes(pkg.subjectCode)}
                    onCheckedChange={(checked) => {
                      setSelectedSubjects(prev =>
                        checked
                          ? [...prev, pkg.subjectCode]
                          : prev.filter(s => s !== pkg.subjectCode)
                      );
                    }}
                  />
                  <SubjectIcon code={pkg.subjectCode} className="h-4 w-4" />
                  <span className="text-sm">
                    {getSubjectNameVi(pkg.subjectCode)}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('date')} className="flex-1">
                Quay lại
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex-1">
                Tiếp theo
              </Button>
            </div>
          </div>
        )}
        
        {step === 'confirm' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Xác nhận giao việc:</p>
            
            <div className="rounded-lg bg-muted p-4">
              <div className="mb-2 text-sm text-muted-foreground">Bài học</div>
              <div className="font-medium">Bài {lesson.lessonNumber}</div>
              
              <div className="mb-2 mt-3 text-sm text-muted-foreground">Ngày</div>
              <div className="font-medium">
                {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </div>
              
              <div className="mb-2 mt-3 text-sm text-muted-foreground">Môn học</div>
              <div className="flex flex-wrap gap-1">
                {selectedSubjects.map(code => (
                  <Badge key={code} variant="secondary">
                    {getSubjectNameVi(code)}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('subjects')} className="flex-1">
                Quay lại
              </Button>
              <Button onClick={handleAssign} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Xác nhận
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Testing Strategy

### Component Tests

```typescript
// tests/components/abeka/LessonCard.test.tsx

describe('LessonCard', () => {
  const mockLesson = {
    id: '1',
    lessonNumber: 1,
    packages: [
      { subjectCode: 'PHONICS', durationMinutes: 15, videos: [] },
      { subjectCode: 'ARITHMETIC', durationMinutes: 20, videos: [] },
    ],
  };
  
  it('renders lesson number and title', () => {
    render(<LessonCard lesson={mockLesson} onSelect={() => {}} />);
    expect(screen.getByText('Bài 1')).toBeInTheDocument();
  });
  
  it('displays total duration', () => {
    render(<LessonCard lesson={mockLesson} onSelect={() => {}} />);
    expect(screen.getByText('35 phút')).toBeInTheDocument();
  });
  
  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<LessonCard lesson={mockLesson} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('article'));
    expect(onSelect).toHaveBeenCalled();
  });
});
```

### E2E Tests

```typescript
// tests/e2e/abeka/parent-planner.spec.ts

test('parent can create weekly plan', async ({ page }) => {
  // Login as parent
  await page.goto('/login');
  await page.fill('[name="email"]', 'parent@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Navigate to planner
  await page.goto('/abeka/planner');
  await expect(page.getByText('Kế Hoạch Học Tập')).toBeVisible();
  
  // Drag lesson to day
  const lesson = page.getByText('Bài 135').first();
  const dayColumn = page.getByText('T2').first();
  
  await lesson.dragTo(dayColumn);
  
  // Verify assignment created
  await expect(page.getByText('Bài 135').nth(1)).toBeVisible();
  
  // Save plan
  await page.click('text=Lưu kế hoạch');
  await expect(page.getByText('Đã lưu')).toBeVisible();
});
```

---

## Success Criteria

- [ ] Curriculum browser displays all 14 grades and 170 lessons per grade
- [ ] Filters work by subject, lesson number, and search
- [ ] Weekly planner supports drag-drop from lesson pool to days
- [ ] Progress dashboard shows accurate stats and charts
- [ ] Assignment creation flow is < 3 clicks
- [ ] All UI text is in Vietnamese
- [ ] Responsive down to 768px (tablet landscape)
- [ ] E2E tests pass for main user flows

---

## Time Estimates

| Task | Estimate | Actual | Status |
|------|----------|--------|--------|
| 2.1 Curriculum Browser | 10h | | |
| 2.2 Weekly Planner | 10h | | |
| 2.3 Progress Dashboard | 6h | | |
| 2.4 Assignment Creation | 4h | | |
| **Total** | **30h** | | |
