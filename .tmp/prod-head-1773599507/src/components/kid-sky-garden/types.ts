export type SkyGardenNodeState = "completed" | "active" | "locked";
export type SkyGardenLaneState = "seeded" | "growing" | "tier_unlocking" | "plateau";

export interface SkyGardenChildProfile {
  id: string;
  nickname: string;
  dailyGoalMinutes: number;
}

export interface SkyGardenLesson {
  id: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trackCode: string; // Course slug or custom track
  unitTitle: string;
  journeyTitle: string;
  journeyAccent: string;
  videoSource?: string | null;
  bunnyVideoId?: string | null;
  videoStatus?: string;
  isCompleted: boolean;
  tierIndex?: number;
}

export interface SkyGardenNode extends SkyGardenLesson {
  tierIndex: number;
  side: "left" | "right";
  state: SkyGardenNodeState;
}

export interface SkyGardenProgressSnapshot {
  dailyGoalMinutes: number;
  totalMinutesToday: number;
  reached: boolean;
  streakDays: number;
  completedLessons?: number;
  totalLessons?: number;
}

export interface SkyGardenSeedCourse {
  id: string;
  title: string;
}

export interface SkyGardenGrowthState {
  phase: "idle" | "growing";
  fromTier: number;
  toTier: number;
  pulse: number;
}
