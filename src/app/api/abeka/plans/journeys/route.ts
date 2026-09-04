import { NextRequest } from "next/server";
import { requireParentAndOwnedChild } from "@/lib/auth/require-parent-child";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createJourneySchema = z.object({
  childId: z.string(),
  gradeId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  daysPerWeek: z.number().int().min(1).max(7).default(5),
  minutesPerDay: z.number().int().min(15).max(480).default(120),
});

/**
 * GET /api/abeka/plans/journeys
 * List learning journeys for authenticated parent
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication
    // const session = await requireAuth();
    // if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    const where: { childId?: string; status?: 'PUBLISHED' } = { status: 'PUBLISHED' };
    if (childId) {
      where.childId = childId;
    }

    const journeys = await prisma.abekaLearningJourney.findMany({
      where,
      include: {
        child: {
          select: { id: true, nickname: true },
        },
        grade: {
          select: { id: true, name: true, nameVi: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ journeys });
  } catch (error) {
    console.error('Error fetching journeys:', error);
    return Response.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}

/**
 * POST /api/abeka/plans/journeys
 * Create new learning journey for a child
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createJourneySchema.parse(body);

    const authed = await requireParentAndOwnedChild(request, data.childId);
    if (!authed.ok) {
      return authed.response;
    }


    // Get grade info
    const grade = await prisma.abekaGrade.findUnique({
      where: { id: data.gradeId },
    });

    if (!grade) {
      return Response.json({ error: 'Grade not found' }, { status: 404 });
    }

    // Create journey
    const journey = await prisma.abekaLearningJourney.create({
      data: {
        childId: data.childId,
        gradeId: data.gradeId,
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        daysPerWeek: data.daysPerWeek,
        minutesPerDay: data.minutesPerDay,
        totalLessons: grade.totalLessons,
        currentLessonNo: 1,
        createdById: authed.parent.id,
      },
    });

    // TODO: Auto-generate first week plan
    // await generateWeeklyPlan(journey.id, 1, new Date(data.startDate));

    return Response.json({ journey }, { status: 201 });
  } catch (error) {
    console.error('Error creating journey:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request body', issues: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create journey' }, { status: 500 });
  }
}
