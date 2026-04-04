import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/curriculum/streak?childId={childId}
 * Get streak data for a child
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return Response.json({ error: 'childId is required' }, { status: 400 });
    }

    // Get or create streak record
    const streak = await prisma.abekaStreak.upsert({
      where: { childId },
      create: {
        childId,
        currentStreak: 0,
        longestStreak: 0,
        freezeCount: 0,
      },
      update: {},
    });

    // Get week history
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const history = await prisma.abekaStreakHistory.findMany({
      where: {
        streakId: streak.id,
        date: { gte: weekAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Build week history
    const weekHistory: Array<{ day: string; streakMaintained: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayHistory = history.find((h) => 
        h.date.toISOString().split('T')[0] === dateStr
      );
      
      weekHistory.push({
        day: dateStr,
        streakMaintained: !!dayHistory?.streakMaintained,
      });
    }

    // Check if streak is at risk (no activity yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const streakAtRisk = streak.lastActivityDate ? 
      streak.lastActivityDate < yesterday : 
      streak.currentStreak > 0;

    return Response.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate?.toISOString() || null,
      streakAtRisk,
      freezeCount: streak.freezeCount,
      weekHistory,
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return Response.json({ error: 'Failed to fetch streak' }, { status: 500 });
  }
}
