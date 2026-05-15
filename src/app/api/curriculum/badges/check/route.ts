import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkBadgesSchema = z.object({
  childId: z.string(),
});

/**
 * POST /api/curriculum/badges/check
 * Check and award badges for a child
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId } = checkBadgesSchema.parse(body);

    // Get child journeys to find assignments
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

    // Get completed assignments count
    const completedLessonsCount = await prisma.abekaAssignment.count({
      where: {
        dailyPlanId: { in: dailyPlanIds },
        status: 'COMPLETED',
      },
    });

    const streak = await prisma.abekaStreak.findUnique({
      where: { childId },
    });

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

    const newBadges: Array<{
      id: string;
      code: string;
      nameVi: string;
      iconUrl: string;
    }> = [];

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
          code: earned.badge.code,
          nameVi: earned.badge.nameVi,
          iconUrl: earned.badge.iconUrl || '',
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: childId,
            type: 'ACHIEVEMENT',
            title: 'New badge!',
            message: `I just received my badge.${earned.badge.nameVi}"!`,
            href: '/abeka/badges',
          },
        });
      }
    }

    return Response.json({ newBadges });
  } catch (error) {
    console.error('Error checking badges:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request body', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to check badges' }, { status: 500 });
  }
}
