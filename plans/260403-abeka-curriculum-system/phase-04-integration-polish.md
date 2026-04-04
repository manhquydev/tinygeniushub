---
title: "Phase 4: Integration & Polish - Lesson Wizard, Testing, QA"
description: "Lesson Wizard integration, progress tracking, gamification system, comprehensive testing and production readiness"
status: completed
priority: P1
effort: 20h
dependencies: ["phase-02-parent-interface", "phase-03-student-interface"]
blocked_by: ["Parent interface complete", "Student interface complete"]
phase: 4
---

# Phase 4: Integration & Polish

## Overview

This phase integrates all components, connects the existing Lesson Wizard video player, implements comprehensive progress tracking, activates the gamification system, and ensures production readiness through testing and optimization.

**Duration**: Week 3-4  
**Effort**: 20 hours  
**Team Size**: 1-2 developers  
**Parallel**: No (requires completion of Phases 2 & 3)

---

## Task Breakdown

### Task 4.1: Lesson Wizard Integration (6h)

**Owner**: Full-Stack Developer

#### 4.1.1 Integration Architecture

The existing Lesson Wizard video player needs to integrate with the Abeka curriculum system to track progress and trigger completions.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lesson Wizard Integration                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ Abeka Video │───▶│   Wizard    │───▶│   Progress  │          │
│  │   Click     │    │   Player    │    │   Update    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                            │                                     │
│                            ▼                                     │
│                    ┌─────────────┐                               │
│                    │  Completion │                               │
│                    │   Check     │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│              ┌────────────┼────────────┐                        │
│              ▼            ▼            ▼                        │
│        ┌────────┐  ┌────────┐  ┌────────┐                     │
│        │  Badge │  │ Streak │  │ Weekly │                     │
│        │  Check │  │ Update │  │  Plan  │                     │
│        └────────┘  └────────┘  └────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Abeka Video Player Component

```typescript
// src/components/abeka/video/AbekaVideoPlayer.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import { LessonWizard } from '@/components/lesson-wizard/LessonWizard';
import { useMutation, useQuery } from '@tanstack/react-query';

interface AbekaVideoPlayerProps {
  videoId: string;
  childId: string;
  assignmentId?: string; // If from a daily plan assignment
  onComplete?: () => void;
  onProgress?: (progress: VideoProgress) => void;
}

export function AbekaVideoPlayer({
  videoId,
  childId,
  assignmentId,
  onComplete,
  onProgress,
}: AbekaVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [lastSavedPosition, setLastSavedPosition] = useState(0);
  
  // Fetch video details
  const { data: video } = useQuery({
    queryKey: ['abeka-video', videoId],
    queryFn: () => fetchVideoDetails(videoId),
  });
  
  // Progress save mutation
  const saveProgress = useMutation({
    mutationFn: async (progress: VideoProgress) => {
      const res = await fetch('/api/abeka/progress/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          videoId,
          assignmentId,
          watchPercent: progress.percent,
          watchSeconds: progress.seconds,
          lastPosition: progress.position,
        }),
      });
      return res.json();
    },
  });
  
  // Debounced progress save (every 5 seconds or 10% increase)
  const debouncedSaveProgress = useCallback(
    debounce((progress: VideoProgress) => {
      saveProgress.mutate(progress);
    }, 5000),
    [childId, videoId]
  );
  
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const percent = Math.round((video.currentTime / video.duration) * 100);
    const seconds = Math.round(video.currentTime);
    
    setWatchProgress(percent);
    
    const progress = {
      percent,
      seconds,
      position: video.currentTime,
      duration: video.duration,
    };
    
    onProgress?.(progress);
    
    // Save on 10% milestones or every 5 seconds
    if (percent % 10 === 0 && percent !== lastSavedPosition) {
      setLastSavedPosition(percent);
      saveProgress.mutate(progress);
    } else {
      debouncedSaveProgress(progress);
    }
  };
  
  const handleEnded = async () => {
    // Mark as completed (90%+ watched)
    const result = await saveProgress.mutateAsync({
      percent: 100,
      seconds: videoRef.current?.duration || 0,
      position: 0, // Reset to start for replay
    });
    
    // Show completion celebration
    if (result.newBadges?.length > 0) {
      showBadgeCelebration(result.newBadges);
    }
    
    onComplete?.();
  };
  
  if (!video) return <VideoSkeleton />;
  
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={video.cdnUrl}
        poster={video.thumbnailUrl}
        className="h-full w-full"
        controls
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      {/* Progress Overlay */}
      <div className="absolute bottom-16 left-4 right-4">
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm font-medium">
            Tiến độ: {watchProgress}%
          </span>
          <div className="flex-1 rounded-full bg-white/30">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${watchProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Completion Overlay */}
      <AnimatePresence>
        {watchProgress >= 90 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl bg-white p-6 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1 }}
              >
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              </motion.div>
              <h3 className="mt-4 text-xl font-bold">Hoàn thành!</h3>
              <p className="mt-2 text-muted-foreground">
                Con đã xem xong video này!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### 4.1.3 Assignment Completion Hook

```typescript
// src/hooks/useAssignmentCompletion.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useAssignmentCompletion(childId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      assignmentId,
      videoId,
      minutesLearned,
    }: {
      assignmentId: string;
      videoId: string;
      minutesLearned: number;
    }) => {
      const res = await fetch('/api/abeka/assignments/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          videoId,
          minutesLearned,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to complete assignment');
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['daily-plan', childId],
      });
      queryClient.invalidateQueries({
        queryKey: ['progress', childId],
      });
      queryClient.invalidateQueries({
        queryKey: ['streak', childId],
      });
      
      // Show success toast
      toast.success('🎉 Hoàn thành bài học!', {
        description: 'Tiến độ đã được lưu lại',
      });
      
      // Handle badge unlocks
      if (data.newBadges?.length > 0) {
        data.newBadges.forEach((badge: Badge) => {
          toast.success(
            <div className="flex items-center gap-3">
              <img src={badge.iconUrl} alt="" className="h-10 w-10" />
              <div>
                <p className="font-bold">Huy hiệu mới!</p>
                <p>{badge.nameVi}</p>
              </div>
            </div>,
            { duration: 5000 }
          );
        });
      }
      
      // Handle streak update
      if (data.streakUpdated) {
        toast.success(
          `🔥 Chuỗi ${data.currentStreak} ngày!`,
          { duration: 3000 }
        );
      }
    },
    onError: (error) => {
      toast.error('Không thể lưu tiến độ', {
        description: error instanceof Error ? error.message : 'Thử lại sau',
      });
    },
  });
}
```

---

### Task 4.2: Progress Tracking Implementation (4h)

**Owner**: Backend Developer

#### 4.2.1 Progress Calculation Service

```typescript
// src/lib/abeka/progress/calculator.ts

export class ProgressCalculator {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Calculate overall progress for a child in a grade
   */
  async calculateGradeProgress(
    childId: string,
    gradeId: string
  ): Promise<GradeProgress> {
    const grade = await this.prisma.abekaGrade.findUnique({
      where: { id: gradeId },
      include: {
        lessons: {
          include: {
            packages: {
              include: {
                videos: {
                  include: {
                    watchProgress: {
                      where: { childId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!grade) throw new Error('Grade not found');
    
    let totalVideos = 0;
    let completedVideos = 0;
    let totalMinutes = 0;
    const subjectProgress: Record<string, { total: number; completed: number }> = {};
    
    for (const lesson of grade.lessons) {
      for (const pkg of lesson.packages) {
        for (const video of pkg.videos) {
          totalVideos++;
          
          // Initialize subject tracking
          if (!subjectProgress[pkg.subjectCode]) {
            subjectProgress[pkg.subjectCode] = { total: 0, completed: 0 };
          }
          subjectProgress[pkg.subjectCode].total++;
          
          // Check if completed
          const progress = video.watchProgress[0];
          if (progress?.isCompleted) {
            completedVideos++;
            subjectProgress[pkg.subjectCode].completed++;
            totalMinutes += Math.round(progress.watchSeconds / 60);
          }
        }
      }
    }
    
    return {
      overallPercent: Math.round((completedVideos / totalVideos) * 100),
      completedVideos,
      totalVideos,
      totalMinutes,
      currentLesson: this.findCurrentLesson(grade.lessons, childId),
      subjectProgress: Object.entries(subjectProgress).map(([code, stats]) => ({
        subjectCode: code,
        percent: Math.round((stats.completed / stats.total) * 100),
        completed: stats.completed,
        total: stats.total,
      })),
    };
  }
  
  /**
   * Calculate lesson completion status
   */
  async calculateLessonCompletion(
    childId: string,
    lessonId: string
  ): Promise<LessonCompletionStatus> {
    const lesson = await this.prisma.abekaLesson.findUnique({
      where: { id: lessonId },
      include: {
        packages: {
          include: {
            videos: {
              include: {
                watchProgress: {
                  where: { childId },
                },
              },
            },
          },
        },
      },
    });
    
    const subjectStatus: Record<string, {
      total: number;
      completed: number;
      percent: number;
      status: 'locked' | 'available' | 'in_progress' | 'completed';
    }> = {};
    
    for (const pkg of lesson?.packages || []) {
      const total = pkg.videos.length;
      const completed = pkg.videos.filter(
        v => v.watchProgress[0]?.isCompleted
      ).length;
      
      subjectStatus[pkg.subjectCode] = {
        total,
        completed,
        percent: Math.round((completed / total) * 100),
        status: completed === 0 ? 'available' : 
                completed === total ? 'completed' : 'in_progress',
      };
    }
    
    const allCompleted = Object.values(subjectStatus).every(
      s => s.status === 'completed'
    );
    
    return {
      lessonId,
      isCompleted: allCompleted,
      subjectStatus,
      completedAt: allCompleted ? new Date() : null,
    };
  }
  
  private findCurrentLesson(lessons: AbekaLesson[], childId: string): number {
    // Find first lesson with incomplete videos
    for (const lesson of lessons) {
      for (const pkg of lesson.packages) {
        for (const video of pkg.videos) {
          const progress = video.watchProgress[0];
          if (!progress?.isCompleted) {
            return lesson.lessonNumber;
          }
        }
      }
    }
    return lessons.length; // All complete
  }
}
```

#### 4.2.2 Progress Update Worker

```typescript
// src/workers/abeka-progress-worker.ts

import { Worker } from 'bullmq';
import { ProgressCalculator } from '@/lib/abeka/progress/calculator';
import { StreakManager } from '@/lib/abeka/gamification/streak';

const progressWorker = new Worker(
  'abeka-progress-updates',
  async (job) => {
    const { childId, videoId, watchData } = job.data;
    
    const calculator = new ProgressCalculator(prisma);
    const streakManager = new StreakManager(prisma);
    
    // Update video progress
    await saveWatchProgress(childId, videoId, watchData);
    
    // Recalculate grade progress
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      include: { abekaJourneys: true },
    });
    
    if (child?.abekaJourneys[0]) {
      const progress = await calculator.calculateGradeProgress(
        childId,
        child.abekaJourneys[0].gradeId
      );
      
      // Update child progress snapshot
      await prisma.childProfile.update({
        where: { id: childId },
        data: {
          progressSnapshot: {
            ...child.progressSnapshot,
            abeka: progress,
          },
        },
      });
    }
    
    // Update streak
    await streakManager.updateStreak(childId);
    
    // Check for badge unlocks
    const newBadges = await checkBadgeUnlocks(childId);
    
    return {
      progress,
      newBadges,
      streakUpdated: true,
    };
  },
  {
    connection: redis,
    concurrency: 10,
  }
);

export default progressWorker;
```

---

### Task 4.3: Gamification System Activation (4h)

**Owner**: Full-Stack Developer

#### 4.3.1 Badge Service

```typescript
// src/lib/abeka/gamification/badges.ts

export class BadgeService {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Check and award badges for a child
   */
  async checkAndAwardBadges(childId: string): Promise<AbekaBadge[]> {
    const newBadges: AbekaBadge[] = [];
    const child = await this.getChildWithProgress(childId);
    
    // Get all badges not yet earned
    const availableBadges = await this.prisma.abekaBadge.findMany({
      where: {
        status: 'PUBLISHED',
        earnedBadges: {
          none: {
            childId,
          },
        },
      },
    });
    
    for (const badge of availableBadges) {
      const meetsCriteria = await this.checkBadgeCriteria(badge, child);
      
      if (meetsCriteria) {
        const earned = await this.prisma.childEarnedBadge.create({
          data: {
            childId,
            badgeId: badge.id,
            earnedContext: this.buildEarnContext(badge, child),
          },
          include: { badge: true },
        });
        
        newBadges.push(earned.badge);
        
        // Trigger notification
        await this.notifyBadgeEarned(childId, earned);
      }
    }
    
    return newBadges;
  }
  
  private async checkBadgeCriteria(
    badge: AbekaBadge,
    child: ChildWithProgress
  ): Promise<boolean> {
    switch (badge.requirementType) {
      case 'lessons':
        const completedLessons = await this.countCompletedLessons(child.id);
        return completedLessons >= badge.requirementValue;
        
      case 'streak':
        const streak = await this.getCurrentStreak(child.id);
        return streak.currentStreak >= badge.requirementValue;
        
      case 'time':
        const totalMinutes = await this.getTotalLearningTime(child.id);
        return totalMinutes >= badge.requirementValue;
        
      case 'subject_mastery':
        const subjectProgress = await this.getSubjectProgress(child.id);
        return Object.values(subjectProgress).some(
          p => p >= badge.requirementValue
        );
        
      case 'perfect_week':
        return await this.checkPerfectWeek(child.id);
        
      default:
        return false;
    }
  }
  
  private async countCompletedLessons(childId: string): Promise<number> {
    const result = await this.prisma.abekaWatchProgress.groupBy({
      by: ['videoId'],
      where: {
        childId,
        isCompleted: true,
      },
      _count: { videoId: true },
    });
    
    return result.length;
  }
  
  private async notifyBadgeEarned(
    childId: string, 
    earned: ChildEarnedBadgeWithBadge
  ): Promise<void> {
    // In-app notification
    await prisma.notification.create({
      data: {
        userId: childId,
        type: 'ACHIEVEMENT',
        title: 'Huy hiệu mới!',
        message: `Con vừa nhận được huy hiệu "${earned.badge.nameVi}"!`,
        href: '/abeka/badges',
      },
    });
    
    // Queue for real-time push (if implemented)
    await notificationQueue.add('badge-earned', {
      childId,
      badgeName: earned.badge.nameVi,
      badgeIcon: earned.badge.iconUrl,
    });
  }
}
```

#### 4.3.2 Streak Manager

```typescript
// src/lib/abeka/gamification/streak.ts

export class StreakManager {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Update streak for a child after activity
   */
  async updateStreak(childId: string): Promise<StreakUpdateResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const streak = await this.prisma.abekaStreak.upsert({
      where: { childId },
      create: {
        childId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      },
      update: {},
    });
    
    // Check if already active today
    if (streak.lastActivityDate?.getTime() === today.getTime()) {
      return { updated: false, streak };
    }
    
    const lastActivity = streak.lastActivityDate;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = streak.currentStreak;
    let usedFreeze = false;
    
    if (lastActivity?.getTime() === yesterday.getTime()) {
      // Consecutive day - increment streak
      newStreak++;
    } else if (lastActivity && lastActivity < yesterday) {
      // Gap detected - check for freeze tokens
      if (streak.freezeCount > 0) {
        // Use freeze token to maintain streak
        await this.prisma.abekaStreak.update({
          where: { id: streak.id },
          data: {
            freezeCount: { decrement: 1 },
            freezeUsedDate: today,
          },
        });
        newStreak++;
        usedFreeze = true;
      } else {
        // Reset streak
        newStreak = 1;
      }
    }
    
    // Update streak
    const updated = await this.prisma.abekaStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActivityDate: today,
      },
    });
    
    // Record in history
    await this.prisma.abekaStreakHistory.create({
      data: {
        streakId: streak.id,
        date: today,
        streakCount: newStreak,
        activityMinutes: await this.getTodayActivityMinutes(childId),
        lessonsCompleted: await this.getTodayLessonsCompleted(childId),
        streakMaintained: true,
        freezeUsed: usedFreeze,
      },
    });
    
    return {
      updated: true,
      streak: updated,
      streakIncreased: newStreak > streak.currentStreak,
      usedFreeze,
    };
  }
  
  /**
   * Award freeze tokens for milestones
   */
  async awardFreezeToken(childId: string, reason: string): Promise<void> {
    await this.prisma.abekaStreak.update({
      where: { childId },
      data: {
        freezeCount: { increment: 1 },
      },
    });
    
    await prisma.notification.create({
      data: {
        userId: childId,
        type: 'ACHIEVEMENT',
        title: 'Token đóng băng!',
        message: `Con nhận được 1 token đóng băng: ${reason}`,
      },
    });
  }
}
```

---

### Task 4.4: Testing & QA (6h)

**Owner**: QA Engineer

#### 4.4.1 Test Plan

```typescript
// tests/e2e/abeka/integration.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Abeka Curriculum Integration', () => {
  test.describe('End-to-End Flows', () => {
    test('complete parent creates plan → child completes lesson → progress tracked', async ({ 
      browser 
    }) => {
      // Create parent context
      const parentContext = await browser.newContext();
      const parentPage = await parentContext.newPage();
      
      // Login as parent
      await parentPage.goto('/login');
      await parentPage.fill('[name="email"]', 'parent@test.com');
      await parentPage.fill('[name="password"]', 'password');
      await parentPage.click('button[type="submit"]');
      
      // Create weekly plan
      await parentPage.goto('/abeka/planner');
      await parentPage.click('text=Tạo kế hoạch mới');
      await parentPage.selectOption('select[name="grade"]', '2'); // Grade 1
      await parentPage.click('text=Tạo');
      
      // Drag lesson to day
      const lesson = parentPage.getByText('Bài 1').first();
      const dayColumn = parentPage.getByText('T2').first();
      await lesson.dragTo(dayColumn);
      await parentPage.click('text=Lưu kế hoạch');
      
      // Create child context
      const childContext = await browser.newContext();
      const childPage = await childContext.newPage();
      
      // Login as child
      await childPage.goto('/abeka/today');
      
      // Should see assigned lesson
      await expect(childPage.getByText('Phonics')).toBeVisible();
      
      // Start lesson
      await childPage.click('text=BẮT ĐẦU HỌC');
      
      // Video player opens
      await expect(childPage.locator('video')).toBeVisible();
      
      // Simulate video completion (in reality would need to mock video duration)
      await childPage.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration - 1;
          video.dispatchEvent(new Event('ended'));
        }
      });
      
      // Should see completion celebration
      await expect(childPage.getByText('Hoàn thành!')).toBeVisible();
      
      // Check progress updated in parent view
      await parentPage.reload();
      await parentPage.goto('/abeka/progress');
      await expect(parentPage.getByText('1 bài')).toBeVisible();
      
      await parentContext.close();
      await childContext.close();
    });
  });
  
  test.describe('Performance', () => {
    test('skill tree renders within performance budget', async ({ page }) => {
      await page.goto('/abeka/skill-tree');
      
      // Wait for initial render
      await page.waitForSelector('[data-testid="skill-node"]', { timeout: 5000 });
      
      // Check render time
      const timing = await page.evaluate(() => {
        return performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      });
      
      // Should load within 3 seconds
      expect(timing.loadEventEnd - timing.startTime).toBeLessThan(3000);
      
      // Check frame rate during animation
      const frameRate = await page.evaluate(async () => {
        const frames: number[] = [];
        const startTime = performance.now();
        
        return new Promise((resolve) => {
          let count = 0;
          const measure = () => {
            count++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(measure);
            } else {
              resolve(count);
            }
          };
          requestAnimationFrame(measure);
        });
      });
      
      // Should maintain 30+ fps
      expect(frameRate).toBeGreaterThan(30);
    });
    
    test('curriculum browser pagination works smoothly', async ({ page }) => {
      await page.goto('/abeka/curriculum');
      
      // Wait for first page
      await page.waitForSelector('[data-testid="lesson-card"]');
      
      // Click next page
      const nextButton = page.getByText('Sau');
      await nextButton.click();
      
      // Should load next page within 1 second
      await expect(page.getByText('Bài 21')).toBeVisible({ timeout: 1000 });
    });
  });
  
  test.describe('Accessibility', () => {
    test('all interactive elements are keyboard accessible', async ({ page }) => {
      await page.goto('/abeka/curriculum');
      
      // Tab through all interactive elements
      const tabbableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
      
      for (let i = 0; i < Math.min(tabbableElements, 20); i++) {
        await page.keyboard.press('Tab');
        const focused = await page.locator(':focus').count();
        expect(focused).toBe(1);
      }
    });
    
    test('meets WCAG color contrast requirements', async ({ page }) => {
      await page.goto('/abeka/today');
      
      // Run axe-core accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
  });
  
  test.describe('Responsive', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1440, height: 900 },
    ];
    
    for (const viewport of viewports) {
      test(`renders correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        
        await page.goto('/abeka/today');
        
        // Take screenshot for visual regression
        await expect(page).toHaveScreenshot(`today-${viewport.name}.png`);
        
        // Ensure no horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      });
    }
  });
});
```

#### 4.4.2 Load Testing Script

```typescript
// tests/load/abeka-load-test.ts

import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp to 100
    { duration: '3m', target: 100 },  // Stay at 100
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.1'],    // < 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test curriculum API
  const curriculumRes = http.get(`${BASE_URL}/api/abeka/curriculum/grades`);
  check(curriculumRes, {
    'curriculum status is 200': (r) => r.status === 200,
    'curriculum response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test progress API
  const childId = 'test-child-id';
  const progressRes = http.get(
    `${BASE_URL}/api/abeka/progress/grade?childId=${childId}`
  );
  check(progressRes, {
    'progress status is 200': (r) => r.status === 200,
    'progress response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  // Test daily plan API
  const planRes = http.get(
    `${BASE_URL}/api/abeka/plans/daily?childId=${childId}&date=2026-04-03`
  );
  check(planRes, {
    'daily plan status is 200': (r) => r.status === 200,
    'daily plan response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Performance benchmarks met
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Environment variables configured

### Deployment

- [ ] Database migration run successfully
- [ ] Abeka data imported
- [ ] CDN URLs verified
- [ ] Feature flags configured
- [ ] Monitoring alerts set

### Post-Deployment

- [ ] Smoke tests pass
- [ ] Error rates acceptable
- [ ] Response times acceptable
- [ ] User feedback collected

---

## Time Estimates

| Task | Estimate | Actual | Status |
|------|----------|--------|--------|
| 4.1 Lesson Wizard Integration | 6h | | |
| 4.2 Progress Tracking | 4h | | |
| 4.3 Gamification System | 4h | | |
| 4.4 Testing & QA | 6h | | |
| **Total** | **20h** | | |

---

## Unresolved Questions

1. Should we implement offline support for video viewing progress?
2. What happens when a child switches grades mid-year?
3. Do we need parent approval for badge sharing on social media?
4. Should streaks be per-grade or global across all Abeka content?
