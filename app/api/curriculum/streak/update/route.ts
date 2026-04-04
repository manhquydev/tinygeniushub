import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkBadgesSchema = z.object({
  childId: z.string(),
});

/**
 * POST /api/curriculum/streak/update
 * Update streak after activity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId } = checkBadgesSchema.parse(body);

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
      return Response.json({
        updated: false,
        streakIncreased: false,
        currentStreak: streak.currentStreak,
        usedFreeze: false,
      });
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

    return Response.json({
      updated: true,
      streakIncreased,
      currentStreak: updated.currentStreak,
      usedFreeze,
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request body', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}
