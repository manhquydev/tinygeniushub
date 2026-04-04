import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { packageAccessControl } from '@/lib/abeka/access';
import { z } from 'zod';
import { ok, fail } from '@/lib/http';
import { handleRouteError } from '@/lib/route-error';

/**
 * GET /api/abeka/videos/check-access
 * 
 * Check if user has access to a specific grade/subject without fetching videos.
 * Useful for UI gating before showing video list.
 * 
 * Query Parameters:
 * - parentId: Parent account ID
 * - childId: Child profile ID (required)
 * - grade: Grade level to check ("0"=K4, "1"=K5, "2"=G1, etc.)
 * - subject: Optional subject code
 * 
 * Response:
 * ```json
 * {
 *   "ok": true,
 *   "data": {
 *     "hasAccess": true,
 *     "accessibleGrades": ["0", "1", "2"],
 *     "reason": null,
 *     "subscription": {...}
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const querySchema = z.object({
      parentId: z.string().min(1, 'parentId is required'),
      childId: z.string().min(1, 'childId is required'),
      grade: z.string().min(1, 'grade is required'),
      subject: z.string().optional(),
    });
    
    const parsed = querySchema.safeParse({
      parentId: searchParams.get('parentId'),
      childId: searchParams.get('childId'),
      grade: searchParams.get('grade'),
      subject: searchParams.get('subject') || undefined,
    });
    
    if (!parsed.success) {
      return fail('Invalid query parameters', 400, parsed.error.issues);
    }
    
    const { parentId, childId, grade, subject } = parsed.data;
    
    // 2. Verify child belongs to parent
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId },
      select: { id: true, nickname: true },
    });
    
    if (!child) {
      return fail('Child profile not found or does not belong to parent', 403);
    }
    
    // 3. Check access
    const result = await packageAccessControl.canAccessVideo(
      parentId,
      childId,
      grade,
      subject
    );
    
    // 4. Get all accessible grades for context
    const accessibleGrades = await packageAccessControl.getAccessibleGrades(
      parentId,
      childId
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
