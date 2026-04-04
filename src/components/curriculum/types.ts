/**
 * Abeka Curriculum Type Definitions
 * TypeScript types for the curriculum system
 */

// Subject Codes
export type AbekaSubjectCode = 
  | 'PHONICS' 
  | 'ARITHMETIC' 
  | 'BIBLE' 
  | 'WRITING' 
  | 'SCIENCE' 
  | 'HISTORY' 
  | 'ACTIVITIES'
  | 'READING';

// Grade Codes
export type AbekaGradeCode = 
  | 'K4' | 'K5'
  | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6'
  | 'G7' | 'G8' | 'G9' | 'G10' | 'G11' | 'G12';

// Video Type
export interface AbekaVideo {
  id: string;
  title: string;
  teacherName: string;
  durationMinutes: number;
  thumbnailUrl: string;
  videoUrl: string;
  orderIndex: number;
}

// Lesson Package (Subject within a Lesson)
export interface AbekaLessonPackage {
  id: string;
  subjectCode: AbekaSubjectCode;
  subjectName: string;
  durationMinutes: number;
  videos: AbekaVideo[];
  lessonId: string;
}

// Lesson Type
export interface AbekaLesson {
  id: string;
  lessonNumber: number;
  title: string | null;
  bibleVerse: string | null;
  memoryWork: string | null;
  gradeId: string;
  gradeCode: AbekaGradeCode;
  packages: AbekaLessonPackage[];
  totalDurationMinutes: number;
  videoCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Grade Type
export interface AbekaGrade {
  id: string;
  code: AbekaGradeCode;
  name: string;
  nameVi: string;
  orderIndex: number;
  totalLessons: number;
  color: string;
}

// Subject Type
export interface AbekaSubject {
  id: string;
  code: AbekaSubjectCode;
  name: string;
  nameVi: string;
  color: string;
  icon: string;
}

// Assignment Status
export type AssignmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

// Assignment Type
export interface AbekaAssignment {
  id: string;
  childId: string;
  lessonId: string;
  lessonPackageId: string;
  subjectCode: AbekaSubjectCode;
  status: AssignmentStatus;
  date: Date;
  lesson?: AbekaLesson;
  lessonPackage?: AbekaLessonPackage;
  completedAt?: Date;
  timeSpentMinutes?: number;
}

// Daily Plan
export interface AbekaDailyPlan {
  id: string;
  date: Date;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  assignments: AbekaAssignment[];
  totalMinutes: number;
  isRestDay: boolean;
  notes?: string;
}

// Weekly Plan
export interface AbekaWeeklyPlan {
  id: string;
  journeyId: string;
  childId: string;
  weekNumber: number;
  weekStartDate: Date;
  weekEndDate: Date;
  dailyPlans: AbekaDailyPlan[];
  totalLessons: number;
  totalMinutes: number;
  isComplete: boolean;
}

// Progress Stats
export interface ProgressStats {
  currentStreak: number;
  longestStreak: number;
  streakStartDate: Date;
  lastActivityDate: Date;
  streakTrend: number;
  completedLessons: number;
  totalLessons: number;
  lessonsTrend: number;
  totalMinutes: number;
  overallProgress: number;
  estimatedCompletion: string;
}

// Subject Progress
export interface SubjectProgress {
  subjectCode: AbekaSubjectCode;
  subjectName: string;
  lessonsCompleted: number;
  totalLessons: number;
  progressPercentage: number;
  timeSpentMinutes: number;
  masteryScore: number;
}

// Weekly Progress Data
export interface WeeklyProgressData {
  week: string;
  lessonsCompleted: number;
  minutesSpent: number;
}

// Activity Item
export interface ActivityItem {
  id: string;
  type: 'lesson_started' | 'lesson_completed' | 'video_watched' | 'assignment_created';
  description: string;
  subjectCode?: AbekaSubjectCode;
  lessonNumber?: number;
  timestamp: Date;
  status: 'completed' | 'in_progress';
}

// Dashboard Data
export interface ProgressDashboardData {
  stats: ProgressStats;
  subjectProgress: SubjectProgress[];
  weeklyProgress: WeeklyProgressData[];
  recentActivity: ActivityItem[];
}

// Filter Options
export interface LessonFilters {
  grades: AbekaGradeCode[];
  subjects: AbekaSubjectCode[];
  searchQuery: string;
  status: 'all' | 'completed' | 'not_started' | 'in_progress';
}

// Child Info
export interface ChildInfo {
  id: string;
  name: string;
  avatar: string;
  grade: AbekaGradeCode;
  overallProgress: number;
  streakDays: number;
  lastActive: Date;
}

// Browser View Mode
export type BrowserViewMode = 'grid' | 'list';

// Sort Option
export type SortOption = 'relevance' | 'newest' | 'popular' | 'progress';

// Quick Assign Data
export interface QuickAssignData {
  childId: string;
  journeyId: string;
  lessonId: string;
  date: Date;
  subjects: AbekaSubjectCode[];
}
