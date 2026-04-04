import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProgressSchema = z.object({
  childId: z.string(),
  videoId: z.string(),
  watchedMinutes: z.number().min(0),
  lastPositionSeconds: z.number().min(0).optional(),
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

    const progress = await prisma.abekaProgress.findMany({
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

    // Verify video exists and get grade info
    const video = await prisma.abekaVideo.findUnique({
      where: { id: data.videoId },
    });

    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if progress record exists
    const existingProgress = await prisma.abekaProgress.findUnique({
      where: {
        childId_videoId: { childId: data.childId, videoId: data.videoId },
      },
    });

    const isCompleted = data.watchedMinutes >= (video.durationMinutes || 0) * 0.9;
    const now = new Date();

    if (existingProgress) {
      // Update existing progress
      const progress = await prisma.abekaProgress.update({
        where: {
          childId_videoId: { childId: data.childId, videoId: data.videoId },
        },
        data: {
          watchedMinutes: data.watchedMinutes,
          lastPositionSeconds: data.lastPositionSeconds ?? existingProgress.lastPositionSeconds,
          isCompleted: isCompleted || existingProgress.isCompleted,
          completedAt: isCompleted && !existingProgress.isCompleted ? now : existingProgress.completedAt,
          lastWatchedAt: now,
          watchCount: { increment: 1 },
        },
      });

      return Response.json({
        progress,
        isCompleted: progress.isCompleted,
      });
    } else {
      // Create new progress record
      const progress = await prisma.abekaProgress.create({
        data: {
          childId: data.childId,
          videoId: data.videoId,
          gradeId: String(video.gradeLevel),
          lessonId: String(video.lessonNumber),
          subjectCode: video.subjectCode,
          watchedMinutes: data.watchedMinutes,
          lastPositionSeconds: data.lastPositionSeconds ?? 0,
          isCompleted,
          completedAt: isCompleted ? now : null,
          lastWatchedAt: now,
          watchCount: 1,
        },
      });

      return Response.json({
        progress,
        isCompleted: progress.isCompleted,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error updating watch progress:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request body', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update watch progress' }, { status: 500 });
  }
}
