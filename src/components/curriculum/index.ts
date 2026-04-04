/**
 * Curriculum Components - Parent Interface
 * 
 * This module exports all components for the Abeka Curriculum Parent Interface.
 */

// Parent Components
export { LessonBrowser } from "./parent/lesson-browser";
export { LessonDetailModal } from "./parent/lesson-detail-modal";
export { QuickAssignModal } from "./parent/quick-assign-modal";
export { WeeklyPlanner } from "./parent/weekly-planner";
export {
  ChildProgressCard,
  ChildProgressCards,
  SubjectProgressBar,
  SubjectProgressList,
  StatsCards,
} from "./parent/child-progress-cards";

// Shared Components
export { SubjectIcon, SubjectBadge, getSubjectName, getSubjectNameVi, getSubjectColor } from "./shared/subject-icon";
export { GradeBadge, getGradeName, getGradeColor, GradeList } from "./shared/grade-badge";
export { ProgressBar, CircularProgress } from "./shared/progress-bar";
export { LessonCard, LessonCardSkeleton, VideoThumbnail, VideoRow } from "./shared/lesson-card";
export { StreakDisplay } from "./shared/streak-display";
export { SearchBar, FilterChips, FilterPanel } from "./shared/search-filter";

// Student Components
export { DailyPlanView } from "./student/daily-plan-view";
export { SkillTreeMap } from "./student/skill-tree-map";
export { SkillNode } from "./student/skill-node";
export { SkillConnection } from "./student/skill-connection";

// Lesson Wizard Bridge
export { LessonWizardBridge } from "./lesson-wizard-bridge";

// Design Tokens
export { abekaColors, typography, spacing, radius, shadows, durations, easing, breakpoints, zIndex } from "./design-tokens";

// Types
export type * from "./types";
