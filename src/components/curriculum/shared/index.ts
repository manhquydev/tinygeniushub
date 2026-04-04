/**
 * Curriculum Shared Components and Utilities
 * Shared API hooks and utilities for curriculum system
 */

// API Hooks and Types
export {
  // API functions
  fetchSkillTree,
  fetchDailyPlan,
  fetchStreak,
  fetchEarnedBadges,
  fetchKisuContext,
  completeLesson,
  viewBadge,
  // React Query hooks
  useSkillTree,
  useDailyPlan,
  useStreak,
  useBadges,
  useKisuContext,
  useCompleteLesson,
  useViewBadge,
  // Types
  type SkillTreeNode,
  type SkillTreeConnection,
} from "./api";
