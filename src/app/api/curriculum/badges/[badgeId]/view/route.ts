import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/curriculum/badges/[badgeId]/view
 * Mark a badge as viewed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    const { badgeId } = await params;

    // Get the badge earning record with badge info
    const earnedBadge = await prisma.childEarnedBadge.findUnique({
      where: { id: badgeId },
      include: {
        badge: {
          select: {
            id: true,
            nameVi: true,
            iconUrl: true,
          },
        },
      },
    });

    if (!earnedBadge) {
      return Response.json({ error: 'Badge not found' }, { status: 404 });
    }

    // Mark as viewed
    const updated = await prisma.childEarnedBadge.update({
      where: { id: badgeId },
      data: {
        viewedAt: new Date(),
      },
      include: {
        badge: {
          select: {
            id: true,
            nameVi: true,
            iconUrl: true,
          },
        },
      },
    });

    return Response.json({
      success: true,
      badge: updated.badge,
      viewedAt: updated.viewedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error marking badge as viewed:', error);
    return Response.json({ error: 'Failed to mark badge as viewed' }, { status: 500 });
  }
}
