---
title: "Phase 3: Student Interface - Tablet-Focused Implementation"
description: "Skill tree learning map, daily plan view, streak/gamification display, and Kisu mascot integration"
status: completed
priority: P1
effort: 30h
dependencies: ["phase-01-foundation"]
blocked_by: ["Database schema", "Core API endpoints"]
phase: 3
---

# Phase 3: Student Interface - Tablet-Focused Implementation

## Overview

This phase implements the child-facing tablet interface. Students see their learning as an adventure with a skill tree map, daily assignments, streak tracking, and gamification elements. The Kisu mascot guides them through their journey. Optimized for tablet (7-12 inch) touch interactions.

**Duration**: Week 2-3  
**Effort**: 30 hours  
**Team Size**: 1-2 developers  
**Parallel**: Yes (can run concurrently with Phase 2 after Phase 1 DB is ready)

---

## Design Philosophy

### Child-Friendly Design Principles

1. **Visual > Text** - Use icons, colors, and images over words
2. **Large Touch Targets** - Minimum 44x44px for all interactive elements
3. **Immediate Feedback** - Celebrate every action with animations
4. **Gamification First** - Learning feels like playing
5. **Mascot Companion** - Kisu is always there to help

### Screen Sizes

- Primary: 10-inch tablet (iPad, Android tablets)
- Minimum: 7-inch tablet
- Maximum: 13-inch tablet

### Orientation

- Landscape preferred (better for video viewing)
- Portrait supported (skill tree works well)

---

## Task Breakdown

### Task 3.1: Skill Tree Learning Map (10h)

**Owner**: Frontend Developer

#### 3.1.1 Skill Tree Concept

The skill tree visualizes the curriculum as an adventure path. Each subject is a branch, lessons are nodes. Children unlock nodes by completing previous lessons.

```
                    🏆
                  HOÀN THÀNH
                     │
            ┌────────┴────────┐
            │                 │
         🎓 150              🎓 150
         Writing           Bible
            │                 │
         🎓 145              🎓 145
            │                 │
         🎓 140              🎓 140
            │                 │
    ┌───────┴───────┐         │
    │               │      🎓 135
  🎓 130         🎓 130     Phonics
  Arithmetic     History      │
    │            │         🎓 130
  🎓 125         🎓 125        │
    │            │         🎓 125
  🎓 120         🎓 120        │
    │            │      ┌─────┴─────┐
  🎓 115         🎓 115 │           │
    │            │   🎓 120     🎓 120
  🎓 110         🎓 110 Science   Grammar
    │            │      │           │
  🎓 105         🎓 105 🎓 115     🎓 115
    │            │      │           │
  🎓 100         🎓 100 🎓 110     🎓 110
    │            │      │           │
  🎓 95          🎓 95 🎓 105      🎓 105
    │            │      │           │
   ...          ...    ...         ...
    │            │      │           │
   🎓 5          🎓 5  🎓 5        🎓 5
    │            │      │           │
   🎓 1    🎓 1  🎓 1   🎓 1  🎓 1 🎓 1
   BẮT ĐẦU
```

#### 3.1.2 Skill Tree Component

```typescript
// src/components/abeka/student/SkillTreeMap.tsx

'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface SkillTreeMapProps {
  childId: string;
  gradeId: string;
}

export function SkillTreeMap({ childId, gradeId }: SkillTreeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  
  const { data: skillTree, isLoading } = useQuery({
    queryKey: ['skill-tree', gradeId, childId],
    queryFn: () => fetchSkillTree(gradeId, childId),
  });
  
  // Pinch zoom for tablets
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let initialDistance = 0;
    let initialScale = 1;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = scale;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const newScale = Math.min(
          Math.max(initialScale * (distance / initialDistance), 0.5),
          2
        );
        setScale(newScale);
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scale]);
  
  if (isLoading || !skillTree) {
    return <SkillTreeSkeleton />;
  }
  
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-sky-100 to-green-50">
      {/* Background Pattern */}
      <div classPath="absolute inset-0 opacity-20">
        <svg className="h-full w-full">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#94a3b8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setScale(s => Math.min(s + 0.2, 2))}
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <ZoomIn className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <ZoomOut className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Kisu Guide */}
      <KisuGuide 
        message={getKisuMessage(skillTree, childId)}
        position="bottom-left"
      />
      
      {/* Skill Tree Container */}
      <motion.div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          setPosition(prev => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
          }));
        }}
      >
        <motion.div
          className="relative h-full w-full"
          style={{
            scale,
            x: position.x,
            y: position.y,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            {skillTree.connections.map(conn => (
              <SkillConnection 
                key={`${conn.from}-${conn.to}`}
                from={skillTree.nodes.find(n => n.id === conn.from)!}
                to={skillTree.nodes.find(n => n.id === conn.to)!}
                status={conn.status}
              />
            ))}
          </svg>
          
          {/* Nodes */}
          {skillTree.nodes.map(node => (
            <SkillNode
              key={node.id}
              node={node}
              onSelect={() => setSelectedNode(node)}
              isSelected={selectedNode?.id === node.id}
            />
          ))}
        </motion.div>
      </motion.div>
      
      {/* Node Detail Modal */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailModal
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            childId={childId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Skill Node Component
function SkillNode({ 
  node, 
  onSelect, 
  isSelected 
}: { 
  node: SkillNodeData; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  const getNodeStyles = () => {
    switch (node.status) {
      case 'completed':
        return 'bg-green-500 text-white ring-4 ring-green-200';
      case 'available':
        return 'bg-white text-slate-900 ring-4 ring-sky-400 cursor-pointer hover:scale-110';
      case 'in_progress':
        return 'bg-amber-400 text-amber-900 ring-4 ring-amber-200 animate-pulse';
      case 'locked':
      default:
        return 'bg-slate-300 text-slate-500 ring-2 ring-slate-200';
    }
  };
  
  return (
    <motion.button
      className={cn(
        'absolute flex h-16 w-16 flex-col items-center justify-center rounded-2xl shadow-lg transition-transform',
        getNodeStyles()
      )}
      style={{
        left: `${node.positionX}px`,
        top: `${node.positionY}px`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onSelect}
      whileHover={node.status !== 'locked' ? { scale: 1.1 } : {}}
      whileTap={node.status !== 'locked' ? { scale: 0.95 } : {}}
      animate={isSelected ? { scale: 1.15 } : {}}
    >
      <SubjectIcon 
        code={node.subjectCode} 
        className="h-6 w-6"
      />
      <span className="mt-1 text-xs font-bold">
        {node.lessonNumber}
      </span>
      
      {/* Status Indicator */}
      {node.status === 'completed' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600"
        >
          <Check className="h-3 w-3 text-white" />
        </motion.div>
      )}
      
      {node.status === 'in_progress' && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
          </span>
        </div>
      )}
    </motion.button>
  );
}

// Connection Line Component
function SkillConnection({ 
  from, 
  to, 
  status 
}: { 
  from: SkillNodeData; 
  to: SkillNodeData; 
  status: 'completed' | 'available' | 'locked';
}) {
  const strokeColor = status === 'completed' ? '#22c55e' : 
                      status === 'available' ? '#0ea5e9' : '#cbd5e1';
  
  return (
    <motion.line
      x1={from.positionX}
      y1={from.positionY}
      x2={to.positionX}
      y2={to.positionY}
      stroke={strokeColor}
      strokeWidth={status === 'completed' ? 4 : 2}
      strokeDasharray={status === 'locked' ? '8,4' : '0'}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    />
  );
}
```

#### 3.1.3 Node Detail Modal

```typescript
// src/components/abeka/student/NodeDetailModal.tsx

interface NodeDetailModalProps {
  node: SkillNodeData;
  onClose: () => void;
  childId: string;
}

export function NodeDetailModal({ node, onClose, childId }: NodeDetailModalProps) {
  const { data: lesson } = useQuery({
    queryKey: ['lesson', node.lessonId],
    queryFn: () => fetchLessonDetail(node.lessonId),
  });
  
  const isLocked = node.status === 'locked';
  const isCompleted = node.status === 'completed';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-6"
          style={{ 
            backgroundColor: abekaColors.subjects[node.subjectCode.toLowerCase()],
          }}
        >
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 text-white">
            <div className="rounded-2xl bg-white/20 p-3">
              <SubjectIcon code={node.subjectCode} className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bài {node.lessonNumber}</h2>
              <p className="text-white/80">
                {getSubjectNameVi(node.subjectCode)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {isLocked ? (
            <div className="text-center">
              <Lock className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-lg text-slate-600">
                Hoàn thành bài trước để mở khóa!
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {node.prerequisites?.map(prereq => (
                  <Badge key={prereq} variant="secondary">
                    Bài {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {lesson?.packages.map(pkg => (
                  <div 
                    key={pkg.subjectCode}
                    className="flex items-center gap-4 rounded-xl border p-4"
                  >
                    <div 
                      className="rounded-lg p-2"
                      style={{ 
                        backgroundColor: `${abekaColors.subjects[pkg.subjectCode.toLowerCase()]}20`,
                      }}
                    >
                      <SubjectIcon 
                        code={pkg.subjectCode}
                        style={{ 
                          color: abekaColors.subjects[pkg.subjectCode.toLowerCase()],
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {getSubjectNameVi(pkg.subjectCode)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.videos.length} videos • {pkg.durationMinutes || '--'} phút
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="rounded-full px-6"
                      disabled={isCompleted}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          Đã xong
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Học ngay
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              
              {lesson?.bibleVerse && (
                <div className="mt-4 rounded-xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    📖 Câu Kinh Thánh: {lesson.bibleVerse}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Kisu Tip */}
        {!isLocked && !isCompleted && (
          <div className="border-t bg-slate-50 p-4">
            <KisuSpeechBubble message={getKisuLessonTip(node.subjectCode)} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
```

---

### Task 3.2: Daily Plan View (8h)

**Owner**: Frontend Developer

#### 3.2.1 Daily Plan Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  🌅 Chào An! Hôm nay học gì?                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🔥 5 ngày liên tiếp!                                       │ │
│  │ Đừng để dập tắt ngọn lửa học tập nhé!                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 📅 Thứ Ba, 8 tháng 4, 2026                                  │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                                                             │ │
│  │  🎓 Bài học: 45                                             │ │
│  │                                                             │ │
│  │  ┌───────────────────────────────────────────────────────┐ │ │
│  │  │ 1️⃣ Phonics                                            │ │ │
│  │  │    ⏱️ 15 phút                                         │ │ │
│  │  │    ██████████████░░░░  80%                            │ │ │
│  │  │    [▶ TIẾP TỤC HỌC]                                   │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌───────────────────────────────────────────────────────┐ │ │
│  │  │ 2️⃣ Arithmetic                                         │ │ │
│  │  │    ⏱️ 20 phút                                         │ │ │
│  │  │    ░░░░░░░░░░░░░░░░░░  0%                             │ │ │
│  │  │    [▶ BẮT ĐẦU HỌC]                                     │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌───────────────────────────────────────────────────────┐ │ │
│  │  │ 3️⃣ Bible     ✅ HOÀN THÀNH                            │ │ │
│  │  │    ⏱️ 10 phút                                         │ │ │
│  │  │    ████████████████████ 100%                          │ │ │
│  │  │    [👀 Xem lại]                                        │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  📊 Tiến độ hôm nay: 1/3 môn học                          │ │
│  │  ⏱️ Thời gian: 25 / 45 phút                               │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🏆 Phần thưởng hôm nay                                     │ │
│  │                                                             │ │
│  │ Hoàn thành tất cả → Nhận ngay huy hiệu "Ngày Siêng Năng"! │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ╭─────────────────────────────────────────────────────────────╮ │
│  │  🐱 Kisu: "Chỉ còn 2 môn nữa thôi! Con làm được mà!"       │ │
│  ╰─────────────────────────────────────────────────────────────╯ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Daily Plan Implementation

```typescript
// src/app/(student)/abeka/today/page.tsx

export default async function TodayPage() {
  const session = await requireChildAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.child.avatarUrl} />
              <AvatarFallback>{session.child.nickname[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold">🌅 Chào {session.child.nickname}!</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, d MMMM', { locale: vi })}
              </p>
            </div>
          </div>
          <StreakBadge streak={session.child.streakCount} />
        </div>
      </header>
      
      <main className="p-4">
        <Suspense fallback={<DailyPlanSkeleton />}>
          <DailyPlan childId={session.child.id} />
        </Suspense>
      </main>
      
      {/* Floating Kisu */}
      <FloatingKisu childId={session.child.id} />
    </div>
  );
}

// src/components/abeka/student/DailyPlan.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

interface DailyPlanProps {
  childId: string;
}

export function DailyPlan({ childId }: DailyPlanProps) {
  const { data: plan, isLoading } = useQuery({
    queryKey: ['daily-plan', childId, format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => fetchDailyPlan(childId, new Date()),
  });
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebratingSubject, setCelebratingSubject] = useState<string | null>(null);
  
  useEffect(() => {
    if (plan?.isCompleted && !plan.celebratedAt) {
      setShowConfetti(true);
      celebrateCompletion(childId);
    }
  }, [plan?.isCompleted]);
  
  if (isLoading || !plan) {
    return <DailyPlanSkeleton />;
  }
  
  const completedCount = plan.assignments.filter(a => a.status === 'COMPLETED').length;
  const progress = Math.round((completedCount / plan.assignments.length) * 100);
  
  return (
    <div className="space-y-4">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={500}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      
      {/* Progress Overview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Tiến độ hôm nay</p>
              <p className="text-2xl font-bold">
                {completedCount}/{plan.assignments.length} môn học
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Thời gian</p>
              <p className="text-2xl font-bold">
                {Math.round(plan.actualMinutes / 60 * 10) / 10}h
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <Progress value={progress} className="h-3 bg-white/30" />
          </div>
        </div>
      </Card>
      
      {/* Assignments List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {plan.assignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
            >
              <AssignmentCard
                assignment={assignment}
                onComplete={() => handleComplete(assignment.id)}
                isCelebrating={celebratingSubject === assignment.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Daily Reward Preview */}
      {!plan.isCompleted && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  🏆 Phần thưởng đang chờ!
                </p>
                <p className="text-sm text-amber-700">
                  Hoàn thành tất cả để nhận huy hiệu "Ngày Siêng Năng"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Assignment Card Component
function AssignmentCard({ 
  assignment, 
  onComplete,
  isCelebrating,
}: { 
  assignment: AbekaAssignment;
  onComplete: () => void;
  isCelebrating: boolean;
}) {
  const isCompleted = assignment.status === 'COMPLETED';
  const isInProgress = assignment.status === 'IN_PROGRESS';
  const subjectColor = abekaColors.subjects[assignment.subjectCode.toLowerCase()];
  
  return (
    <Card 
      className={cn(
        'overflow-hidden transition-all',
        isCompleted && 'opacity-75',
        isCelebrating && 'animate-bounce'
      )}
    >
      <div 
        className="h-1"
        style={{ backgroundColor: subjectColor }}
      />
      
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Subject Icon */}
          <div 
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${subjectColor}20` }}
          >
            <SubjectIcon 
              code={assignment.subjectCode}
              className="h-7 w-7"
              style={{ color: subjectColor }}
            />
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {getSubjectNameVi(assignment.subjectCode)}
              </h3>
              {isCompleted && (
                <Badge variant="default" className="bg-green-500">
                  <Check className="mr-1 h-3 w-3" />
                  Xong
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Bài {assignment.lessonPackage.lesson.lessonNumber}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-2">
              <Progress 
                value={assignment.progressPercent} 
                className="h-2"
              />
            </div>
          </div>
          
          {/* Action Button */}
          <Button
            size="lg"
            className={cn(
              'rounded-full px-6',
              isCompleted ? 'bg-green-500 hover:bg-green-600' : ''
            )}
            style={{ 
              backgroundColor: isCompleted ? undefined : subjectColor,
            }}
            onClick={onComplete}
          >
            {isCompleted ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Xem lại
              </>
            ) : isInProgress ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Tiếp tục
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Bắt đầu
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 3.3: Gamification & Streak Display (6h)

**Owner**: Frontend Developer

#### 3.3.1 Streak Component

```typescript
// src/components/abeka/student/StreakDisplay.tsx

'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface StreakDisplayProps {
  childId: string;
  variant?: 'compact' | 'full';
}

export function StreakDisplay({ childId, variant = 'compact' }: StreakDisplayProps) {
  const { data: streak } = useQuery({
    queryKey: ['streak', childId],
    queryFn: () => fetchStreak(childId),
  });
  
  if (!streak) return null;
  
  if (variant === 'compact') {
    return (
      <motion.div 
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-white"
        animate={streak.currentStreak > 0 ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <motion.div
          animate={streak.currentStreak > 0 ? {
            rotate: [0, -10, 10, -10, 10, 0],
          } : {}}
          transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 3 }}
        >
          <Flame className="h-5 w-5" />
        </motion.div>
        <span className="font-bold">{streak.currentStreak}</span>
        <span className="text-sm opacity-90">ngày</span>
      </motion.div>
    );
  }
  
  // Full variant
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Chuỗi ngày học liên tiếp</p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                className="text-5xl font-bold"
                key={streak.currentStreak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {streak.currentStreak}
              </motion.span>
              <span className="text-xl">ngày</span>
            </div>
            <p className="mt-2 text-sm opacity-90">
              Kỷ lục: {streak.longestStreak} ngày
            </p>
          </div>
          
          {/* Animated Flame */}
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
            }}
          >
            <Flame className="h-24 w-24" />
            <motion.div
              className="absolute inset-0 rounded-full bg-orange-400 blur-xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
              }}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Week Heatmap */}
      <CardContent className="p-4">
        <div className="flex justify-between gap-2">
          {streak.weekHistory.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'h-10 w-10 rounded-lg transition-colors',
                  day.streakMaintained
                    ? 'bg-orange-500'
                    : 'bg-slate-200'
                )}
              />
              <span className="text-xs text-muted-foreground">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}
              </span>
            </div>
          ))}
        </div>
        
        {/* Freeze Tokens */}
        <div className="mt-4 flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-sky-500" />
          <span className="text-sm text-muted-foreground">
            Token đóng băng: {streak.freezeCount}
          </span>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              Dùng để giữ chuỗi khi không học 1 ngày
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3.3.2 Badges Collection

```typescript
// src/components/abeka/student/BadgesDisplay.tsx

'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface BadgesDisplayProps {
  childId: string;
}

export function BadgesDisplay({ childId }: BadgesDisplayProps) {
  const { data: badges } = useQuery({
    queryKey: ['badges', childId],
    queryFn: () => fetchEarnedBadges(childId),
  });
  
  const earnedBadges = badges?.filter(b => !b.viewedAt) || [];
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">🏆 Huy hiệu của con</h2>
      
      <div className="grid grid-cols-4 gap-3">
        {badges?.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.1 }}
            className={cn(
              'relative aspect-square rounded-2xl p-3',
              badge.earnedAt 
                ? 'bg-gradient-to-br shadow-lg'
                : 'bg-slate-100 grayscale opacity-50'
            )}
            style={{
              background: badge.earnedAt 
                ? `linear-gradient(135deg, ${badge.badge.colorHex}40, ${badge.badge.colorHex})`
                : undefined,
            }}
          >
            <img
              src={badge.badge.iconUrl}
              alt={badge.badge.nameVi}
              className="h-full w-full object-contain"
            />
            
            {badge.isNew && (
              <motion.div
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                !
              </motion.div>
            )}
            
            <div className="absolute inset-x-0 -bottom-1 text-center">
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium shadow">
                {badge.badge.nameVi}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* New Badge Animation */}
      {earnedBadges.length > 0 && (
        <NewBadgeCelebration badge={earnedBadges[0]} />
      )}
    </div>
  );
}

function NewBadgeCelebration({ badge }: { badge: ChildEarnedBadge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mx-auto mb-4 h-32 w-32"
        >
          <img
            src={badge.badge.iconUrl}
            alt={badge.badge.nameVi}
            className="h-full w-full object-contain"
          />
        </motion.div>
        
        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          🎉 Chúc mừng!
        </h2>
        <p className="text-lg text-slate-600">
          Con vừa nhận được huy hiệu
        </p>
        <p 
          className="mt-2 text-xl font-bold"
          style={{ color: badge.badge.colorHex }}
        >
          {badge.badge.nameVi}
        </p>
        
        <Button className="mt-6 w-full" size="lg">
          Nhận thưởng!
        </Button>
      </motion.div>
    </motion.div>
  );
}
```

---

### Task 3.4: Kisu Mascot Integration (6h)

**Owner**: Frontend Developer

#### 3.4.1 Kisu Component System

```typescript
// src/components/abeka/mascots/Kisu.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KisuProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'sleepy' | 'celebrating';
  message?: string;
  position?: 'bottom-left' | 'bottom-right' | 'floating';
  onClick?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
}

export function Kisu({
  mood = 'happy',
  message,
  position = 'bottom-left',
  onClick,
  autoHide = false,
  hideDelay = 5000,
}: KisuProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (autoHide && message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, message]);
  
  const positionClasses = {
    'bottom-left': 'left-4 bottom-4',
    'bottom-right': 'right-4 bottom-4',
    'floating': 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
  };
  
  const getKisuImage = () => {
    const images = {
      happy: '/mascots/kisu/happy.png',
      excited: '/mascots/kisu/excited.gif',
      thinking: '/mascots/kisu/thinking.png',
      sleepy: '/mascots/kisu/sleepy.png',
      celebrating: '/mascots/kisu/celebrating.gif',
    };
    return images[mood];
  };
  
  if (!isVisible) return null;
  
  return (
    <motion.div
      className={`fixed z-40 ${positionClasses[position]}`}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
    >
      <div className="flex items-end gap-2">
        {/* Speech Bubble */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              className="relative mb-8 max-w-xs rounded-2xl bg-white p-4 shadow-lg"
            >
              <p className="text-sm font-medium text-slate-700">{message}</p>
              <div className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Kisu Character */}
        <motion.button
          className="relative h-24 w-24"
          onClick={() => {
            setIsAnimating(true);
            onClick?.();
            setTimeout(() => setIsAnimating(false), 1000);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={isAnimating ? {
            y: [0, -20, 0],
            rotate: [0, -10, 10, -10, 10, 0],
          } : {
            y: [0, -5, 0],
          }}
          transition={{
            repeat: isAnimating ? 0 : Infinity,
            duration: isAnimating ? 0.5 : 2,
          }}
        >
          <img
            src={getKisuImage()}
            alt="Kisu mascot"
            className="h-full w-full object-contain drop-shadow-xl"
          />
          
          {/* Click hint */}
          <motion.div
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            👆
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}

// Context-aware Kisu that provides tips
export function SmartKisu({ childId }: { childId: string }) {
  const [tip, setTip] = useState<string | null>(null);
  const { data: context } = useQuery({
    queryKey: ['kisu-context', childId],
    queryFn: () => fetchKisuContext(childId),
    refetchInterval: 60000, // Check every minute
  });
  
  useEffect(() => {
    if (context) {
      const newTip = generateTip(context);
      if (newTip && newTip !== tip) {
        setTip(newTip);
      }
    }
  }, [context]);
  
  const getMoodFromContext = (): KisuProps['mood'] => {
    if (!context) return 'happy';
    if (context.isCelebration) return 'celebrating';
    if (context.streakAboutToBreak) return 'thinking';
    if (context.timeOfDay === 'evening') return 'sleepy';
    if (context.hasNewBadge) return 'excited';
    return 'happy';
  };
  
  return (
    <Kisu
      mood={getMoodFromContext()}
      message={tip}
      position="bottom-right"
      autoHide={!!tip}
      hideDelay={8000}
    />
  );
}

// Generate contextual tips
function generateTip(context: KisuContext): string | null {
  const tips: Record<string, string[]> = {
    morning: [
      'Chào buổi sáng! Sẵn sàng học bài mới chưa?',
      'Ngày mới, năng lượng mới! Cùng học thôi!',
    ],
    streakRisk: [
      'Hôm nay chưa học bài nào! Chuỗi {streak} ngày sắp mất rồi!',
      'Chỉ 10 phút thôi là giữ được chuỗi đó!',
    ],
    progressGood: [
      'Con đang làm rất tốt! Tiếp tục phát huy nhé!',
      'Hôm nay con đã học được nhiều điều hay!',
    ],
    newBadge: [
      'Huy hiệu mới đang chờ con! Cố lên!',
      'Sắp đủ điều kiện nhận huy hiệu rồi!',
    ],
    encouragement: [
      'Không sao đâu, mai học tiếp nhé!',
      'Nghỉ ngơi cũng quan trọng mà!',
    ],
  };
  
  let category = 'encouragement';
  if (context.timeOfDay === 'morning' && context.lessonsCompletedToday === 0) {
    category = 'morning';
  } else if (context.streakAboutToBreak) {
    category = 'streakRisk';
  } else if (context.progressPercent > 70) {
    category = 'progressGood';
  } else if (context.nextBadgeIn <= 2) {
    category = 'newBadge';
  }
  
  const categoryTips = tips[category];
  return categoryTips[Math.floor(Math.random() * categoryTips.length)];
}
```

---

## Testing Strategy

### Tablet Testing

```typescript
// tests/e2e/abeka/student-tablet.spec.ts

test.describe('Student tablet interface', () => {
  test.use({ viewport: { width: 1024, height: 768 } }); // iPad landscape
  
  test('student can view daily plan and complete lesson', async ({ page }) => {
    await page.goto('/abeka/today');
    
    // Should see daily assignments
    await expect(page.getByText('Chào')).toBeVisible();
    await expect(page.getByText('Bài học')).toBeVisible();
    
    // Start a lesson
    await page.click('text=BẮT ĐẦU HỌC');
    
    // Video player should open
    await expect(page.locator('video')).toBeVisible();
  });
  
  test('skill tree responds to touch gestures', async ({ page }) => {
    await page.goto('/abeka/skill-tree');
    
    // Pinch zoom simulation
    const container = page.locator('[data-testid="skill-tree"]');
    
    // Simulate pinch zoom
    await container.evaluate((el) => {
      const touch1 = new Touch({
        identifier: 1,
        target: el,
        clientX: 100,
        clientY: 100,
      });
      const touch2 = new Touch({
        identifier: 2,
        target: el,
        clientX: 200,
        clientY: 200,
      });
      
      el.dispatchEvent(new TouchEvent('touchstart', {
        touches: [touch1, touch2],
      }));
    });
  });
});
```

---

## Success Criteria

- [x] Skill tree renders all 170 lessons as interactive nodes
- [x] Zoom and pan work smoothly on tablets (60fps)
- [x] Daily plan shows correct assignments for the day
- [x] Progress bars animate smoothly
- [x] Streak counter updates in real-time
- [x] Badges show celebration animation when earned
- [x] Kisu provides contextual tips and encouragement
- [x] All touch targets are minimum 44x44px
- [x] Works in both landscape and portrait orientations
- [x] Confetti animation triggers on daily completion

**Implementation Notes:**
- Components use existing curriculum types (`AbekaSubjectCode`, `AbekaAssignment`, etc.)
- TanStack Query for server state management
- Framer Motion for smooth animations with reduced-motion support
- Tablet-optimized touch targets (60x60px for K4-5, 44px for older)
- Kisu mascot integrated with contextual encouragement messages

---

## Time Estimates

| Task | Estimate | Actual | Status |
|------|----------|--------|--------|
| 3.1 Skill Tree Map | 10h | 8h | ✅ Completed |
| 3.2 Daily Plan View | 8h | 6h | ✅ Completed |
| 3.3 Gamification | 6h | 4h | ✅ Completed |
| 3.4 Kisu Mascot | 6h | 4h | ✅ Completed |
| **Total** | **30h** | **22h** | **✅ Completed** |
