import { NextRequest } from 'next/server';
import { requireParentAndOwnedChild } from '@/lib/auth/require-parent-child';
import { prisma } from '@/lib/prisma';
import { packageAccessControl, packageValidator } from '@/lib/abeka/access';
import { z } from 'zod';
import { ok, fail } from '@/lib/http';
import { handleRouteError } from '@/lib/route-error';

/**
 * GET /api/abeka/videos/accessible
 * Session cookie required. Query parentId is ignored.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childIdParam = searchParams.get('childId') ?? '';
    const authed = await requireParentAndOwnedChild(request, childIdParam);
    if (!authed.ok) {
      return authed.response;
    }

    const querySchema = z.object({
      childId: z.string().min(1, 'childId is required'),
      grade: z.string().optional(),
      subject: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    });

    const parsed = querySchema.safeParse({
      childId: searchParams.get('childId'),
      grade: searchParams.get('grade') || undefined,
      subject: searchParams.get('subject') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!parsed.success) {
      return fail('Invalid query parameters', 400, parsed.error.issues);
    }

    const { childId, grade, subject, page, limit } = parsed.data;
    const parentId = authed.parent.id;
    
    // 2. Verify child belongs to parent
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId },
      select: { id: true, nickname: true },
    });
    
    if (!child) {
      return fail('Child profile not found or does not belong to parent', 403);
    }
    
    // 3. Validate subscription first (early validation for better UX)
    const validation = await packageValidator.validateSubscription(parentId);
    
    if (!validation.isValid) {
      return fail(
        validation.errors[0] ?? 'Subscription is not active',
        403,
        {
          reason: 'Package upgrade required',
          accessibleGrades: [],
          subscription: validation,
        }
      );
    }
    
    // 4. Get accessible videos
    const result = await packageAccessControl.getAccessibleVideos(
      parentId,
      childId,
      {
        grade,
        subject,
        page,
        limit,
      }
    );
    
    // 5. Get accessible grades for the user
    const accessibleGrades = await packageAccessControl.getAccessibleGrades(
      parentId,
      childId
    );
    
    return ok({
      videos: result.videos,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
      accessibleGrades,
      child: {
        id: child.id,
        nickname: child.nickname,
      },
      packageInfo: {
        planCode: validation.planCode,
        planName: validation.planName,
        expiresAt: validation.expiresAt,
        daysRemaining: validation.daysRemaining,
        warnings: validation.warnings,
      },
    });
    
  } catch (error) {
    return handleRouteError(error);
  }
}
