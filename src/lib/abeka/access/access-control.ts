import { prisma } from '@/lib/prisma';
import { 
  Subscription, 
  SubscriptionStatus, 
  PlanCode,
  ParentAccount,
  ChildProfile,
  Prisma,
} from '@prisma/client';

// ============================================================================
// Package-Grade Mapping Configuration
// ============================================================================

/**
 * Package tiers that define grade access ranges
 * 
 * Example:
 * - "Tiểu Học PRO" (Elementary PRO): Grades G1-G5
 * - "Trung Học PRO" (Middle School PRO): Grades G6-G9
 * - "Toàn Khoá PRO" (Full PRO): All grades K4-G12
 */
export interface PackageGradeMapping {
  planCode: PlanCode;
  minGrade: number; // 0=K4, 1=K5, 2=G1...
  maxGrade: number;
  name: string;
  description: string;
}

/**
 * Default package-to-grade mappings
 * 
 * Note: This is the initial configuration. In the future, this should be
 * moved to a database table (AbekaPackageGradeMap) for admin configurability.
 */
export const PACKAGE_GRADE_MAPPINGS: PackageGradeMapping[] = [
  {
    planCode: PlanCode.TRIAL,
    minGrade: 0, // K4
    maxGrade: 2, // G1 - Trial allows K4, K5, G1
    name: 'Trial',
    description: 'Dùng thử - K4 đến G1',
  },
  {
    planCode: PlanCode.MONTHLY_STANDARD,
    minGrade: 0, // K4
    maxGrade: 5, // G5 - Elementary
    name: 'Tiểu Học PRO',
    description: 'Tiểu Học PRO - K4 đến G5',
  },
  {
    planCode: PlanCode.YEARLY_STANDARD,
    minGrade: 0, // K4
    maxGrade: 5, // G5 - Elementary
    name: 'Tiểu Học PRO (Năm)',
    description: 'Tiểu Học PRO - K4 đến G5',
  },
  {
    planCode: PlanCode.YEARLY_FAMILY_PLUS,
    minGrade: 0, // K4
    maxGrade: 13, // G12 - All grades
    name: 'Toàn Khoá PRO',
    description: 'Toàn Khoá PRO - Tất cả các cấp',
  },
];

// ============================================================================
// Types
// ============================================================================

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  subscription?: {
    planCode: PlanCode;
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
  } | null;
  accessibleGrades?: number[];
}

export interface AccessibleVideosOptions {
  grade?: string; // grade level as string ("0", "1", etc.)
  subject?: string; // subject code
  page: number;
  limit: number;
}

// Video type definition (for when abekaVideo model is available)
export interface AbekaVideo {
  id: string;
  videoId: string;
  gradeLevel: number;
  lessonNumber: number;
  subjectCode: string;
  title: string;
  description: string | null;
  cdnUrl: string;
  thumbnailUrl: string | null;
  durationMinutes: number | null;
  teacherName: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibleVideosResult {
  videos: AbekaVideo[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert grade level number to display name
 */
export function gradeLevelToName(level: number): string {
  if (level === 0) return 'K4';
  if (level === 1) return 'K5';
  return `G${level - 1}`; // G1 = level 2
}

/**
 * Convert display name to grade level number
 */
export function gradeNameToLevel(name: string): number | null {
  const upper = name.toUpperCase();
  if (upper === 'K4') return 0;
  if (upper === 'K5') return 1;
  const match = upper.match(/^G(\d+)$/);
  if (match) {
    const grade = parseInt(match[1], 10);
    if (grade >= 1 && grade <= 12) return grade + 1;
  }
  return null;
}

/**
 * Get package mapping for a plan code
 */
export function getPackageMapping(planCode: PlanCode): PackageGradeMapping | undefined {
  return PACKAGE_GRADE_MAPPINGS.find(m => m.planCode === planCode);
}

/**
 * Get all accessible grade levels for a plan
 */
export function getAccessibleGradeLevels(planCode: PlanCode): number[] {
  const mapping = getPackageMapping(planCode);
  if (!mapping) return [];
  
  const grades: number[] = [];
  for (let i = mapping.minGrade; i <= mapping.maxGrade; i++) {
    grades.push(i);
  }
  return grades;
}

/**
 * Check if a grade level is within package access range
 */
export function isGradeAccessible(
  gradeLevel: number, 
  planCode: PlanCode
): boolean {
  const mapping = getPackageMapping(planCode);
  if (!mapping) return false;
  
  return gradeLevel >= mapping.minGrade && gradeLevel <= mapping.maxGrade;
}

// ============================================================================
// Package Access Control Service
// ============================================================================

export class PackageAccessControl {
  
  /**
   * Check if user has access to a specific video/grade level
   * 
   * @param userId - Parent account ID
   * @param childId - Child profile ID (for permission verification)
   * @param grade - Grade level (as number or string: "0"-"13" or "K4", "K5", "G1"-"G12")
   * @param subject - Optional subject code for additional filtering
   * @returns Promise<AccessCheckResult> - true if access granted
   * 
   * Example:
   * ```typescript
   * const result = await accessControl.canAccessVideo(
   *   'user_123', 
   *   'child_456', 
   *   '2', // G1
   *   'PHONICS'
   * );
   * ```
   */
  async canAccessVideo(
    userId: string,
    childId: string,
    grade: string | number,
    subject?: string
  ): Promise<AccessCheckResult> {
    // Step 1: Verify child belongs to user
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: userId },
      select: { id: true },
    });
    
    if (!child) {
      return {
        hasAccess: false,
        reason: 'Child profile not found or does not belong to user',
      };
    }
    
    // Step 2: Get user's active subscription
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: userId },
      select: {
        planCode: true,
        status: true,
        currentPeriodEnd: true,
      },
    });
    
    // Step 3: Check subscription status
    const validation = this.validateSubscription(subscription);
    if (!validation.isValid) {
      return {
        hasAccess: false,
        reason: validation.reason,
        subscription: subscription || null,
      };
    }
    
    // Step 4: Parse grade level
    const gradeLevel = typeof grade === 'number' 
      ? grade 
      : gradeNameToLevel(grade) ?? parseInt(grade, 10);
    
    if (isNaN(gradeLevel) || gradeLevel < 0 || gradeLevel > 13) {
      return {
        hasAccess: false,
        reason: `Invalid grade level: ${grade}`,
        subscription,
      };
    }
    
    // Step 5: Check if grade is within package access range
    const planCode = subscription!.planCode;
    const accessibleGrades = getAccessibleGradeLevels(planCode);
    
    if (!accessibleGrades.includes(gradeLevel)) {
      const mapping = getPackageMapping(planCode);
      const maxGradeName = gradeLevelToName(mapping?.maxGrade ?? 5);
      return {
        hasAccess: false,
        reason: `Package "${mapping?.name ?? planCode}" chỉ được xem đến lớp ${maxGradeName}. ` +
                `Video này thuộc lớp ${gradeLevelToName(gradeLevel)} yêu cầu nâng cấp gói.`,
        subscription,
        accessibleGrades,
      };
    }
    
    // Subject-level filtering can be added here in the future
    if (subject) {
      // Future: Check if subject is included in package
      // For now, all subjects within grade range are accessible
    }
    
    return {
      hasAccess: true,
      subscription,
      accessibleGrades,
    };
  }
  
  /**
   * Get list of all grades accessible to user's package
   * 
   * @param userId - Parent account ID
   * @param childId - Child profile ID (for permission verification)
   * @returns Promise<string[]> - Array of grade level strings ("0", "1", etc.)
   */
  async getAccessibleGrades(userId: string, childId: string): Promise<string[]> {
    // Verify child belongs to user
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: userId },
      select: { id: true },
    });
    
    if (!child) {
      throw new Error('Child profile not found or does not belong to user');
    }
    
    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: userId },
      select: { planCode: true, status: true, currentPeriodEnd: true },
    });
    
    // Validate subscription
    const validation = this.validateSubscription(subscription);
    if (!validation.isValid) {
      return [];
    }
    
    // Return accessible grade levels as strings
    const gradeLevels = getAccessibleGradeLevels(subscription!.planCode);
    return gradeLevels.map(g => g.toString());
  }
  
  /**
   * Get list of videos accessible to user with pagination
   * 
   * Note: This method uses raw queries when abekaVideo model is not available.
   * When the abekaVideo table is properly configured, it will use Prisma queries.
   * 
   * @param userId - Parent account ID
   * @param childId - Child profile ID (for permission verification)
   * @param options - Filter and pagination options
   * @returns Promise<AccessibleVideosResult>
   */
  async getAccessibleVideos(
    userId: string,
    childId: string,
    options: AccessibleVideosOptions
  ): Promise<AccessibleVideosResult> {
    const { grade, subject, page, limit } = options;
    
    // Verify child belongs to user
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: userId },
      select: { id: true },
    });
    
    if (!child) {
      throw new Error('Child profile not found or does not belong to user');
    }
    
    // Get subscription and accessible grades
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: userId },
      select: { planCode: true, status: true, currentPeriodEnd: true },
    });
    
    const validation = this.validateSubscription(subscription);
    if (!validation.isValid) {
      return {
        videos: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }
    
    // Build grade filter
    const accessibleGrades = getAccessibleGradeLevels(subscription!.planCode);
    let gradeFilter: number[];
    
    if (grade) {
      // If specific grade requested, check if it's accessible
      const requestedGrade = parseInt(grade, 10);
      if (accessibleGrades.includes(requestedGrade)) {
        gradeFilter = [requestedGrade];
      } else {
        // Requested grade not accessible
        return { videos: [], total: 0, page, limit, hasMore: false };
      }
    } else {
      // All accessible grades
      gradeFilter = accessibleGrades;
    }
    
    // Try to fetch videos from abekaVideo table
    // If the table doesn't exist, this will return empty results
    try {
      const skip = (page - 1) * limit;
      
      // Build the where clause
      let whereClause = "status = 'PUBLISHED'";
      if (gradeFilter.length === 1) {
        whereClause += ` AND "gradeLevel" = ${gradeFilter[0]}`;
      } else {
        whereClause += ` AND "gradeLevel" IN (${gradeFilter.join(',')})`;
      }
      if (subject) {
        whereClause += ` AND "subjectCode" = '${subject}'`;
      }
      
      // Use raw query to avoid type issues when model doesn't exist
      const videos = await prisma.$queryRawUnsafe<AbekaVideo[]>(`
        SELECT * FROM "AbekaVideo"
        WHERE ${whereClause}
        ORDER BY "gradeLevel" ASC, "lessonNumber" ASC, "subjectCode" ASC
        LIMIT ${limit}
        OFFSET ${skip}
      `);
      
      // Get total count
      const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`
        SELECT COUNT(*) as count FROM "AbekaVideo"
        WHERE ${whereClause}
      `);
      const total = Number(countResult[0]?.count ?? 0);
      
      return {
        videos: videos || [],
        total,
        page,
        limit,
        hasMore: skip + (videos?.length ?? 0) < total,
      };
    } catch (error) {
      // If table doesn't exist or other error, return empty result
      console.warn('AbekaVideo table may not exist:', error);
      return {
        videos: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }
  }
  
  /**
   * Validate subscription status
   * 
   * @param subscription - Subscription object or null
   * @returns Validation result
   */
  private validateSubscription(
    subscription: { planCode: PlanCode; status: SubscriptionStatus; currentPeriodEnd: Date } | null
  ): { isValid: boolean; reason?: string } {
    if (!subscription) {
      return { isValid: false, reason: 'No active subscription found' };
    }
    
    // Check if subscription is in valid status
    const validStatuses: SubscriptionStatus[] = [
      SubscriptionStatus.TRIALING,
      SubscriptionStatus.ACTIVE_STANDARD,
      SubscriptionStatus.ACTIVE_FAMILYPLUS,
      SubscriptionStatus.GRACE,
    ];
    
    if (!validStatuses.includes(subscription.status)) {
      return { 
        isValid: false, 
        reason: `Subscription status is ${subscription.status}. Please renew your subscription.`,
      };
    }
    
    // Check if subscription has expired
    const now = new Date();
    if (subscription.currentPeriodEnd < now) {
      return { 
        isValid: false, 
        reason: 'Subscription has expired. Please renew to continue accessing content.',
      };
    }
    
    return { isValid: true };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const packageAccessControl = new PackageAccessControl();
