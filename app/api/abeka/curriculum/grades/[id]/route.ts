import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string(),
});

const querySchema = z.object({
  includeSubjects: z.boolean().default(false),
  includeLessons: z.boolean().default(false),
});

/**
 * GET /api/abeka/curriculum/grades/[id]
 * Get a specific grade with optional related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = paramsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      includeSubjects: searchParams.get('includeSubjects') === 'true',
      includeLessons: searchParams.get('includeLessons') === 'true',
    });

    const grade = await prisma.abekaGrade.findUnique({
      where: { id },
      include: {
        subjects: query.includeSubjects ? {
          where: { status: 'PUBLISHED' },
          orderBy: { orderNo: 'asc' },
        } : false,
        lessons: query.includeLessons ? {
          where: { status: 'PUBLISHED' },
          orderBy: { lessonNumber: 'asc' },
        } : false,
      },
    });

    if (!grade) {
      return Response.json({ error: 'Grade not found' }, { status: 404 });
    }

    return Response.json({ grade });
  } catch (error) {
    console.error('Error fetching grade:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid parameters', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to fetch grade' }, { status: 500 });
  }
}
