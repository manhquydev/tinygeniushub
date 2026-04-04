/**
 * Shared Types - Backward Compatibility Layer
 * Re-exports types from the main types.ts and adds compatibility aliases
 */

// Re-export all from parent types file
export * from "../types";

// Compatibility aliases for old type names
export type SubjectCode = import("../types").AbekaSubjectCode;
export type GradeLevel = import("../types").AbekaGradeCode;

// Legacy node types for student components - aligned with api.ts SkillTreeNode
export type NodeStatus = "locked" | "available" | "in_progress" | "completed" | "mastered";

export interface Subject {
  code: SubjectCode;
  name: string;
  nameVi: string;
  color: string;
  icon: string;
}

// Updated SkillNode to match api.ts SkillTreeNode
export interface SkillNode {
  id: string;
  subjectCode: string;
  lessonNumber: number;
  lessonId: string;
  status: NodeStatus;
  positionX: number;
  positionY: number;
  progress?: number;
  prerequisites?: string[];
  // Legacy compatibility fields
  subject?: string;
  title?: string;
  description?: string;
  grade?: string;
  position?: { x: number; y: number };
}

// Re-export from api.ts for compatibility
export type { SkillTreeNode, SkillTreeConnection } from "./api";

export interface NodeConnection {
  from: string;
  to: string;
}

export interface SkillTreeData {
  nodes: SkillNode[];
  connections: NodeConnection[];
  currentPosition: string;
  unlockedNodes: string[];
  completedNodes: string[];
}

// Legacy lesson types
export interface LessonVideo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  url: string;
}

export interface Worksheet {
  id: string;
  title: string;
  type: "printable" | "interactive";
  url: string;
}

// Updated DailyAssignment to match component expectations and AbekaAssignment
export interface DailyAssignment {
  id: string;
  // Support both old and new type structures
  subjectCode?: string;
  subject?: string;
  title?: string;
  description?: string;
  // Use uppercase status to match AbekaAssignment/AssignmentStatus
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "not_started" | "in_progress" | "completed";
  duration?: number;
  estimatedMinutes?: number;
  videos?: LessonVideo[];
  worksheets?: Worksheet[];
  progress?: number;
  progressPercent?: number;
  lessonNumber?: number;
  // Link to AbekaAssignment fields
  lessonId?: string;
  lessonPackageId?: string;
  childId?: string;
  date?: Date;
  lesson?: import("../types").AbekaLesson;
  lessonPackage?: import("../types").AbekaLessonPackage;
}

export interface DailyPlan {
  date: string;
  assignments: DailyAssignment[];
  totalDuration: number;
  completedCount: number;
  // Compatibility with AbekaDailyPlan
  id?: string;
  dayOfWeek?: number;
  totalMinutes?: number;
  isRestDay?: boolean;
  isCompleted?: boolean;
  celebratedAt?: string;
  actualMinutes?: number;
}

// Legacy gamification types
export interface StreakData {
  current: number;
  longest: number;
  nextReward: number;
  isAtRisk: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
}

export interface EarnedBadge extends Badge {
  earnedAt: string;
  isNew: boolean;
}

export interface GamificationState {
  streak: StreakData;
  totalXP: number;
  level: number;
  badges: EarnedBadge[];
}

// Extended KisuContext to match kisu-avatar.tsx usage
export interface KisuContext {
  // mood and message are not used by generateKisuTip but kept for type compatibility
  mood?: "happy" | "encouraging" | "celebratory" | "concerned";
  message?: string;
  action?: string;
  // Extended properties used by kisu-avatar.tsx - all optional for compatibility
  timeOfDay?: "morning" | "afternoon" | "evening";
  lessonsCompletedToday?: number;
  totalLessonsToday?: number;
  progressPercent?: number;
  streakAboutToBreak?: boolean;
  hasNewBadge?: boolean;
  nextBadgeIn?: number;
  isCelebration?: boolean;
  currentSubject?: string;
}

// Legacy constants for backward compatibility
export const SUBJECT_COLORS: Record<string, string> = {
  PHONICS: "#8b5cf6",
  ARITHMETIC: "#10b981",
  BIBLE: "#f59e0b",
  WRITING: "#ef4444",
  SCIENCE: "#06b6d4",
  HISTORY: "#d946ef",
  ACTIVITIES: "#84cc16",
  READING: "#3b82f6",
  // Legacy aliases
  ENG: "#8b5cf6",
  MTH: "#10b981",
  BIB: "#f59e0b",
  GRM: "#ef4444",
  SCI: "#06b6d4",
  HIS: "#d946ef",
  ART: "#84cc16",
  PHY: "#8b5cf6",
};

export const SUBJECT_NAMES_VI: Record<string, string> = {
  PHONICS: "Phonics",
  ARITHMETIC: "Toán",
  BIBLE: "Kinh Thánh",
  WRITING: "Viết",
  SCIENCE: "Khoa Học",
  HISTORY: "Lịch Sử",
  ACTIVITIES: "Hoạt Động",
  READING: "Đọc",
  // Legacy aliases
  ENG: "Tiếng Anh",
  MTH: "Toán",
  BIB: "Kinh Thánh",
  GRM: "Ngữ Pháp",
  SCI: "Khoa Học",
  HIS: "Lịch Sử",
  ART: "Mỹ Thuật",
  PHY: "Phonics",
};

export const SUBJECT_ICONS: Record<string, string> = {
  PHONICS: "book-open",
  ARITHMETIC: "calculator",
  BIBLE: "book-marked",
  WRITING: "pen-tool",
  SCIENCE: "flask",
  HISTORY: "landmark",
  ACTIVITIES: "palette",
  READING: "graduation-cap",
  // Legacy aliases
  ENG: "book-open",
  MTH: "calculator",
  BIB: "book-marked",
  GRM: "pen-tool",
  SCI: "flask",
  HIS: "landmark",
  ART: "palette",
  PHY: "book-open",
};

export const GRADE_COLORS: Record<string, string> = {
  K4: "#FF9F43",
  K5: "#FF9F43",
  G1: "#F368E0",
  G2: "#F368E0",
  G3: "#54A0FF",
  G4: "#54A0FF",
  G5: "#5F27CD",
  G6: "#5F27CD",
  G7: "#00D2D3",
  G8: "#00D2D3",
  G9: "#FF6B6B",
  G10: "#FF6B6B",
  G11: "#48DBFB",
  G12: "#48DBFB",
};
