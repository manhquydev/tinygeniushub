import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  gradeId: z.string().optional(),
  lessonNumber: z.coerce.number().optional(),
  includePackages: z.boolean().default(false),
  includeVideos: z.boolean().default(false),
});

/**
 * GET /api/abeka/curriculum/lessons
 * List lessons, optionally filtered by grade and lesson number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      gradeId: searchParams.get('gradeId') || undefined,
      lessonNumber: searchParams.get('lessonNumber') || undefined,
      includePackages: searchParams.get('includePackages') === 'true',
      includeVideos: searchParams.get('includeVideos') === 'true',
    });

    const where: {
      gradeId?: string;
      lessonNumber?: number;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'HIDDEN';
    } = {
      status: 'PUBLISHED',
    };

    if (query.gradeId) {
      where.gradeId = query.gradeId;
    }

    if (query.lessonNumber) {
      where.lessonNumber = query.lessonNumber;
    }

    const lessons = await prisma.abekaLesson.findMany({
      where,
      include: {
        grade: {
          select: { id: true, name: true, nameVi: true, level: true },
        },
        packages: query.includePackages ? {
          include: query.includeVideos ? {
            videos: {
              select: { id: true, videoId: true, title: true, durationMinutes: true, thumbnailUrl: true },
            },
          } : undefined,
        } : undefined,
        _count: {
          select: { packages: true },
        },
      },
      orderBy: [{ gradeId: 'asc' }, { lessonNumber: 'asc' }],
    });

    return Response.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid query parameters', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}
