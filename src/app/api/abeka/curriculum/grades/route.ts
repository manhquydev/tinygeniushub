import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['published', 'draft', 'all']).default('published'),
  includeSubjects: z.boolean().default(false),
  includeLessonCount: z.boolean().default(false),
});

/**
 * GET /api/abeka/curriculum/grades
 * List all available grades with optional subject/lesson data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      status: searchParams.get('status') || 'published',
      includeSubjects: searchParams.get('includeSubjects') === 'true',
      includeLessonCount: searchParams.get('includeLessonCount') === 'true',
    });

    const where = query.status === 'all'
      ? {}
      : { status: query.status.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'HIDDEN' };

    const grades = await prisma.abekaGrade.findMany({
      where,
      include: {
        subjects: query.includeSubjects ? {
          where: { status: 'PUBLISHED' },
          orderBy: { orderNo: 'asc' },
        } : false,
        _count: query.includeLessonCount ? {
          select: { lessons: true },
        } : false,
      },
      orderBy: { level: 'asc' },
    });

    return Response.json({ grades });
  } catch (error) {
    console.error('Error fetching grades:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid query parameters', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}
