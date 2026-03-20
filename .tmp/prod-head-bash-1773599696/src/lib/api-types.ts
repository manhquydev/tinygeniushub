export interface ChildProfileDTO {
  id: string;
  nickname: string;
  ageBand: string;
  avatarId: string | null;
  dailyGoalMinutes: number;
  dailyMinutesLimit: number;
  progressSnapshot: Record<string, unknown> | null;
  createdAt: string;
}

export interface LessonCardDTO {
  id: string;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  isCompleted: boolean;
  trackCode: "ENGLISH" | "MATH" | "HABIT";
  unitTitle: string;
}

export interface TodayMissionDTO {
  child: ChildProfileDTO;
  lessons: LessonCardDTO[];
  streakCount: number;
  dailyMinutesUsed: number;
  dailyGoalMinutes: number;
  goalReached: boolean;
}

export interface WeeklyReportDTO {
  id: string;
  weekStart: string;
  weekEnd: string;
  minutesLearned: number;
  lessonsCompleted: number;
  streakDays: number;
  skillsSummary: Record<string, unknown> | null;
  recommendations: string[] | null;
  generatedAt: string;
}

export interface NotificationDTO {
  id: string;
  type: "ACHIEVEMENT" | "REPORT" | "TIP" | "STREAK";
  title: string;
  message: string;
  href: string;
  read: boolean;
  createdAt: string;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
}
