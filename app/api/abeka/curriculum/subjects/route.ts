import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  gradeId: z.string().optional(),
  status: z.enum(['published', 'draft', 'all']).default('published'),
});

/**
 * GET /api/abeka/curriculum/subjects
 * List subjects, optionally filtered by grade
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      gradeId: searchParams.get('gradeId') || undefined,
      status: searchParams.get('status') || 'published',
    });

    const where: {
      gradeId?: string;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'HIDDEN';
    } = {};

    if (query.gradeId) {
      where.gradeId = query.gradeId;
    }

    if (query.status !== 'all') {
      where.status = query.status.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'HIDDEN';
    }

    const subjects = await prisma.abekaSubject.findMany({
      where,
      include: {
        grade: {
          select: { id: true, name: true, nameVi: true, level: true },
        },
      },
      orderBy: [{ gradeId: 'asc' }, { orderNo: 'asc' }],
    });

    return Response.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid query parameters', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}
