import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/curriculum/badges?childId={childId}
 * Get earned badges for a child
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return Response.json({ error: 'childId is required' }, { status: 400 });
    }

    const earnedBadges = await prisma.childEarnedBadge.findMany({
      where: { childId },
      include: {
        badge: {
          select: {
            id: true,
            code: true,
            nameVi: true,
            descriptionVi: true,
            colorHex: true,
            iconUrl: true,
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
    });

    // Format response with isNew flag
    const formatted = earnedBadges.map((earned) => ({
      id: earned.id,
      badge: earned.badge,
      earnedAt: earned.earnedAt?.toISOString() || null,
      viewedAt: earned.viewedAt?.toISOString() || null,
      isNew: earned.earnedAt && !earned.viewedAt,
    }));

    return Response.json(formatted);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return Response.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
