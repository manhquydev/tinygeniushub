/**
 * API Functions for Curriculum
 * TanStack Query hooks for curriculum data
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { 
  AbekaLesson,
  AbekaDailyPlan, 
  ProgressStats,
  AbekaAssignment,
  AbekaGradeCode,
  ChildInfo,
} from "@/components/curriculum/types";

// Fetch skill tree data
export async function fetchSkillTree(
  gradeId: string, 
  childId: string
): Promise<{
  gradeId: string;
  childId: string;
  nodes: SkillTreeNode[];
  connections: SkillTreeConnection[];
  currentPosition: string;
  totalLessons: number;
  completedLessons: number;
}> {
  const response = await fetch(
    `/api/curriculum/skill-tree?gradeId=${gradeId}&childId=${childId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch skill tree");
  }
  return response.json();
}

// Skill Tree Node Type
export interface SkillTreeNode {
  id: string;
  subjectCode: string;
  lessonNumber: number;
  lessonId: string;
  status: "locked" | "available" | "in_progress" | "completed" | "mastered";
  positionX: number;
  positionY: number;
  progress?: number;
  prerequisites?: string[];
}

// Skill Tree Connection Type
export interface SkillTreeConnection {
  from: string;
  to: string;
  status: "completed" | "available" | "locked";
}

// Fetch daily plan
export async function fetchDailyPlan(
  childId: string, 
  date: Date
): Promise<AbekaDailyPlan & { 
  isCompleted: boolean; 
  celebratedAt?: string;
  actualMinutes: number;
}> {
  const dateStr = date.toISOString().split("T")[0];
  const response = await fetch(
    `/api/curriculum/daily-plan?childId=${childId}&date=${dateStr}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch daily plan");
  }
  return response.json();
}

// Fetch streak data
export async function fetchStreak(childId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string;
  lastActivityDate: string;
  streakAtRisk: boolean;
  freezeCount: number;
  weekHistory: {
    day: string;
    streakMaintained: boolean;
  }[];
}> {
  const response = await fetch(`/api/curriculum/streak?childId=${childId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch streak data");
  }
  return response.json();
}

// Fetch earned badges
export async function fetchEarnedBadges(childId: string): Promise<{
  id: string;
  badge: {
    id: string;
    code: string;
    nameVi: string;
    nameEn: string;
    descriptionVi: string;
    descriptionEn: string;
    colorHex: string;
    iconUrl: string;
    rarity: "bronze" | "silver" | "gold" | "platinum";
  };
  earnedAt: string | null;
  viewedAt: string | null;
  isNew: boolean;
}[]> {
  const response = await fetch(`/api/curriculum/badges?childId=${childId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch badges");
  }
  return response.json();
}

// Fetch Kisu context for smart tips
export async function fetchKisuContext(childId: string): Promise<{
  timeOfDay: "morning" | "afternoon" | "evening";
  lessonsCompletedToday: number;
  totalLessonsToday: number;
  progressPercent: number;
  streakAboutToBreak: boolean;
  hasNewBadge: boolean;
  nextBadgeIn: number;
  isCelebration: boolean;
  currentSubject?: string;
}> {
  const response = await fetch(`/api/curriculum/kisu-context?childId=${childId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch Kisu context");
  }
  return response.json();
}

// Mark lesson as complete
export async function completeLesson(
  assignmentId: string
): Promise<void> {
  const response = await fetch("/api/curriculum/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignmentId }),
  });
  if (!response.ok) {
    throw new Error("Failed to complete lesson");
  }
}

// Mark badge as viewed
export async function viewBadge(badgeId: string): Promise<void> {
  const response = await fetch(`/api/curriculum/badges/${badgeId}/view`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to mark badge as viewed");
  }
}

// ===== TanStack Query Hooks =====

export function useSkillTree(gradeId: string, childId: string) {
  return useQuery({
    queryKey: ["skill-tree", gradeId, childId],
    queryFn: () => fetchSkillTree(gradeId, childId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDailyPlan(childId: string, date: Date) {
  return useQuery({
    queryKey: ["daily-plan", childId, date.toISOString().split("T")[0]],
    queryFn: () => fetchDailyPlan(childId, date),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useStreak(childId: string) {
  return useQuery({
    queryKey: ["streak", childId],
    queryFn: () => fetchStreak(childId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBadges(childId: string) {
  return useQuery({
    queryKey: ["badges", childId],
    queryFn: () => fetchEarnedBadges(childId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useKisuContext(childId: string) {
  return useQuery({
    queryKey: ["kisu-context", childId],
    queryFn: () => fetchKisuContext(childId),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}

// Mutations
export function useCompleteLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: completeLesson,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["daily-plan"] });
      queryClient.invalidateQueries({ queryKey: ["skill-tree"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}

export function useViewBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: viewBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}
