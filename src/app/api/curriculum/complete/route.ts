import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const completeLessonSchema = z.object({
  childId: z.string(),
  assignmentId: z.string(),
  videoId: z.string().optional(),
  minutesLearned: z.number().min(0).optional().default(15),
});

interface BadgeResult {
  id: string;
  nameVi: string;
  iconUrl: string;
}

/**
 * POST /api/curriculum/complete
 * Complete a curriculum assignment and trigger gamification updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = completeLessonSchema.parse(body);

    // Get assignment with related data to verify ownership
    const assignment = await prisma.abekaAssignment.findUnique({
      where: { id: data.assignmentId },
      include: {
        journey: true,
        dailyPlan: {
          include: {
            weeklyPlan: {
              include: {
                journey: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Verify assignment belongs to the child
    const assignmentChildId = assignment.dailyPlan?.weeklyPlan?.journey?.childId;
    if (assignmentChildId !== data.childId) {
      return Response.json({ error: 'Assignment does not belong to child' }, { status: 403 });
    }

    // Update assignment status
    const completedAssignment = await prisma.abekaAssignment.update({
      where: { id: data.assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update video progress if videoId provided
    if (data.videoId) {
      await prisma.abekaWatchProgress.upsert({
        where: {
          childId_videoId: { childId: data.childId, videoId: data.videoId },
        },
        create: {
          childId: data.childId,
          videoId: data.videoId,
          watchPercent: 100,
          watchSeconds: data.minutesLearned * 60,
          isCompleted: true,
          completedAt: new Date(),
          lastWatchedAt: new Date(),
        },
        update: {
          watchPercent: 100,
          isCompleted: true,
          completedAt: new Date(),
          lastWatchedAt: new Date(),
        },
      });
    }

    // Update streak
    const streakResult = await updateStreak(data.childId);

    // Check and award badges
    const newBadges = await checkAndAwardBadges(data.childId);

    // Update daily plan progress
    await updateDailyPlanProgress(assignment.dailyPlanId);

    // Update weekly plan progress
    const weeklyPlanId = assignment.dailyPlan?.weeklyPlan?.id;
    if (weeklyPlanId) {
      await updateWeeklyPlanProgress(weeklyPlanId);
    }

    return Response.json({
      success: true,
      assignment: completedAssignment,
      streakUpdated: streakResult.updated,
      streakIncreased: streakResult.streakIncreased,
      currentStreak: streakResult.currentStreak,
      newBadges,
    });
  } catch (error) {
    console.error('Error completing assignment:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request body', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to complete assignment' }, { status: 500 });
  }
}

/**
 * Update streak for a child
 */
async function updateStreak(childId: string): Promise<{
  updated: boolean;
  streakIncreased: boolean;
  currentStreak: number;
  usedFreeze: boolean;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.abekaStreak.upsert({
    where: { childId },
    create: {
      childId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      freezeCount: 0,
    },
    update: {},
  });

  // Check if already active today
  if (streak.lastActivityDate?.getTime() === today.getTime()) {
    return {
      updated: false,
      streakIncreased: false,
      currentStreak: streak.currentStreak,
      usedFreeze: false,
    };
  }

  const lastActivity = streak.lastActivityDate;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = streak.currentStreak;
  let usedFreeze = false;
  let streakIncreased = false;

  if (lastActivity?.getTime() === yesterday.getTime()) {
    // Consecutive day - increment streak
    newStreak++;
    streakIncreased = true;
  } else if (lastActivity && lastActivity < yesterday) {
    // Gap detected - check for freeze tokens
    if (streak.freezeCount > 0) {
      // Use freeze token to maintain streak
      await prisma.abekaStreak.update({
        where: { id: streak.id },
        data: {
          freezeCount: { decrement: 1 },
          freezeUsedDate: today,
        },
      });
      newStreak++;
      streakIncreased = true;
      usedFreeze = true;
    } else {
      // Reset streak
      newStreak = 1;
    }
  }

  // Update streak
  const updated = await prisma.abekaStreak.update({
    where: { id: streak.id },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActivityDate: today,
    },
  });

  // Record in history
  await prisma.abekaStreakHistory.create({
    data: {
      streakId: streak.id,
      date: today,
      streakCount: newStreak,
      activityMinutes: 0,
      lessonsCompleted: 1,
      streakMaintained: true,
      freezeUsed: usedFreeze,
    },
  });

  // Award freeze tokens for milestones
  if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
    await prisma.abekaStreak.update({
      where: { id: streak.id },
      data: {
        freezeCount: { increment: 1 },
      },
    });
  }

  return {
    updated: true,
    streakIncreased,
    currentStreak: updated.currentStreak,
    usedFreeze,
  };
}

/**
 * Check and award badges for a child
 */
async function checkAndAwardBadges(childId: string): Promise<BadgeResult[]> {
  const newBadges: BadgeResult[] = [];

  // Get completed assignments count for this child
  const childJourneys = await prisma.abekaLearningJourney.findMany({
    where: { childId },
    select: { id: true },
  });
  const journeyIds = childJourneys.map((j) => j.id);

  const weeklyPlans = await prisma.abekaWeeklyPlan.findMany({
    where: { journeyId: { in: journeyIds } },
    select: { id: true },
  });
  const weeklyPlanIds = weeklyPlans.map((wp) => wp.id);

  const dailyPlans = await prisma.abekaDailyPlan.findMany({
    where: { weeklyPlanId: { in: weeklyPlanIds } },
    select: { id: true },
  });
  const dailyPlanIds = dailyPlans.map((dp) => dp.id);

  const completedLessonsCount = await prisma.abekaAssignment.count({
    where: {
      dailyPlanId: { in: dailyPlanIds },
      status: 'COMPLETED',
    },
  });

  // Get streak data
  const streak = await prisma.abekaStreak.findUnique({
    where: { childId },
  });

  // Get total learning time
  const totalTimeResult = await prisma.abekaWatchProgress.aggregate({
    where: { childId },
    _sum: { watchSeconds: true },
  });
  const totalMinutes = Math.round((totalTimeResult._sum.watchSeconds || 0) / 60);

  // Get available badges
  const availableBadges = await prisma.abekaBadge.findMany({
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
    let meetsCriteria = false;

    switch (badge.requirementType) {
      case 'lessons':
        meetsCriteria = completedLessonsCount >= (badge.requirementValue || 0);
        break;

      case 'streak':
        meetsCriteria = (streak?.currentStreak || 0) >= (badge.requirementValue || 0);
        break;

      case 'time':
        meetsCriteria = totalMinutes >= (badge.requirementValue || 0);
        break;

      default:
        meetsCriteria = false;
    }

    if (meetsCriteria) {
      const earned = await prisma.childEarnedBadge.create({
        data: {
          childId,
          badgeId: badge.id,
          earnedContext: {
            type: badge.requirementType,
            value: badge.requirementValue,
          },
        },
        include: { badge: true },
      });

      newBadges.push({
        id: earned.badge.id,
        nameVi: earned.badge.nameVi,
        iconUrl: earned.badge.iconUrl || '',
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: childId,
          type: 'ACHIEVEMENT',
          title: 'Huy hiệu mới!',
          message: `Con vừa nhận được huy hiệu "${earned.badge.nameVi}"!`,
          href: '/abeka/badges',
        },
      });
    }
  }

  return newBadges;
}

/**
 * Update daily plan progress
 */
async function updateDailyPlanProgress(dailyPlanId: string): Promise<void> {
  const assignments = await prisma.abekaAssignment.findMany({
    where: { dailyPlanId },
  });

  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;
  const isCompleted = completedCount === assignments.length && assignments.length > 0;

  await prisma.abekaDailyPlan.update({
    where: { id: dailyPlanId },
    data: {
      completedAssignments: completedCount,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });
}

/**
 * Update weekly plan progress
 */
async function updateWeeklyPlanProgress(weeklyPlanId: string): Promise<void> {
  const dailyPlans = await prisma.abekaDailyPlan.findMany({
    where: { weeklyPlanId },
  });

  const completedLessons = dailyPlans.reduce((sum, dp) => sum + dp.completedAssignments, 0);
  const actualMinutes = dailyPlans.reduce((sum, dp) => sum + dp.actualMinutes, 0);

  await prisma.abekaWeeklyPlan.update({
    where: { id: weeklyPlanId },
    data: {
      completedLessons,
      actualMinutes,
    },
  });
}
