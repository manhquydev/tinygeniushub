/**
 * Abeka Access Control Module
 * 
 * Provides package-based access control for Abeka curriculum videos.
 * 
 * Features:
 * - Package-to-grade level mapping
 * - Video access validation
 * - Subscription status checking
 * - Usage limit enforcement
 * 
 * @example
 * ```typescript
 * import { packageAccessControl, packageValidator } from '@/lib/abeka/access';
 * 
 * // Check if user can access a video
 * const result = await packageAccessControl.canAccessVideo(
 *   userId, 
 *   childId, 
 *   '2', // G1
 *   'PHONICS'
 * );
 * 
 * if (!result.hasAccess) {
 *   return { error: result.reason };
 * }
 * ```
 */

export { 
  PackageAccessControl, 
  packageAccessControl,
  gradeLevelToName,
  gradeNameToLevel,
  getPackageMapping,
  getAccessibleGradeLevels,
  isGradeAccessible,
  PACKAGE_GRADE_MAPPINGS,
} from './access-control';

export type { 
  PackageGradeMapping,
  AccessCheckResult,
  AccessibleVideosOptions,
  AccessibleVideosResult,
} from './access-control';

export { 
  PackageValidator, 
  packageValidator,
  PLAN_CONFIGS,
} from './package-validator';

export type { 
  PackageValidationResult,
  ChildLimitCheck,
  PackageUsageStats,
  PlanConfig,
} from './package-validator';
