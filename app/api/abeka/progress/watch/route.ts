import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProgressSchema = z.object({
  childId: z.string(),
  videoId: z.string(),
  watchPercent: z.number().min(0).max(100),
  watchSeconds: z.number().min(0),
  lastPosition: z.number().min(0).optional(),
});

/**
 * GET /api/abeka/progress/watch
 * Get watch progress for a child
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const videoId = searchParams.get('videoId');

    if (!childId) {
      return Response.json({ error: 'childId is required' }, { status: 400 });
    }

    const where: { childId: string; videoId?: string } = { childId };
    if (videoId) {
      where.videoId = videoId;
    }

    const progress = await prisma.abekaWatchProgress.findMany({
      where,
      include: {
        video: {
          select: {
            id: true,
            videoId: true,
            title: true,
            thumbnailUrl: true,
            durationMinutes: true,
            lessonNumber: true,
            gradeLevel: true,
          },
        },
      },
      orderBy: { lastWatchedAt: 'desc' },
    });

    return Response.json({ progress });
  } catch (error) {
    console.error('Error fetching watch progress:', error);
    return Response.json({ error: 'Failed to fetch watch progress' }, { status: 500 });
  }
}

/**
 * POST /api/abeka/progress/watch
 * Update video watch progress
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = updateProgressSchema.parse(body);

    // Verify child exists
    const child = await prisma.childProfile.findUnique({
      where: { id: data.childId },
    });

    if (!child) {
      return Response.json({ error: 'Child not found' }, { status: 404 });
    }

    // Verify video exists
    const video = await prisma.abekaVideo.findUnique({
      where: { id: data.videoId },
    });

    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Calculate duration in seconds if available
    const durationSeconds = video.durationMinutes ? video.durationMinutes * 60 : null;

    // Update or create progress
    const progress = await prisma.abekaWatchProgress.upsert({
      where: {
        childId_videoId: { childId: data.childId, videoId: data.videoId },
      },
      create: {
        childId: data.childId,
        videoId: data.videoId,
        watchPercent: data.watchPercent,
        watchSeconds: data.watchSeconds,
        durationSeconds,
        lastPosition: data.lastPosition ?? 0,
        isCompleted: data.watchPercent >= 90,
        completedAt: data.watchPercent >= 90 ? new Date() : null,
        lastWatchedAt: new Date(),
      },
      update: {
        watchPercent: data.watchPercent,
        watchSeconds: data.watchSeconds,
        durationSeconds,
        lastPosition: data.lastPosition ?? 0,
        isCompleted: data.watchPercent >= 90,
        completedAt: data.watchPercent >= 90 ? new Date() : null,
        lastWatchedAt: new Date(),
      },
    });

    // TODO: Trigger streak update and badge checks
    // await updateStreak(data.childId);
    // const newBadges = await checkBadgeUnlocks(data.childId, 'watch', { videoId: data.videoId });

    return Response.json({
      progress,
      isCompleted: progress.isCompleted,
      // newBadges,
    });
  } catch (error) {
    console.error('Error updating watch progress:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request body', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update watch progress' }, { status: 500 });
  }
}
