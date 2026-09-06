import { NextRequest } from 'next/server';
import { requireParentAndOwnedChild } from '@/lib/auth/require-parent-child';
import { prisma } from '@/lib/prisma';
import { packageAccessControl } from '@/lib/abeka/access';
import { z } from 'zod';
import { ok, fail } from '@/lib/http';
import { handleRouteError } from '@/lib/route-error';

/**
 * GET /api/abeka/videos/check-access
 * Session cookie required. Query parentId is ignored.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId') ?? '';
    const authed = await requireParentAndOwnedChild(request, childId);
    if (!authed.ok) {
      return authed.response;
    }

    const querySchema = z.object({
      grade: z.string().min(1, 'grade is required'),
      subject: z.string().optional(),
    });

    const parsed = querySchema.safeParse({
      grade: searchParams.get('grade'),
      subject: searchParams.get('subject') || undefined,
    });

    if (!parsed.success) {
      return fail('Invalid query parameters', 400, parsed.error.issues);
    }

    const { grade, subject } = parsed.data;
    const parentId = authed.parent.id;

    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId },
      select: { id: true, nickname: true },
    });

    if (!child) {
      return fail('Child profile not found or does not belong to parent', 403);
    }

    const result = await packageAccessControl.canAccessVideo(
      parentId,
      childId,
      grade,
      subject,
    );

    const accessibleGrades = await packageAccessControl.getAccessibleGrades(
      parentId,
      childId,
    );

    return ok({
      hasAccess: result.hasAccess,
      reason: result.reason ?? null,
      accessibleGrades,
      subscription: result.subscription ?? null,
      child: {
        id: child.id,
        nickname: child.nickname,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
