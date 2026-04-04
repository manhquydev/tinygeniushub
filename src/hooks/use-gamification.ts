'use client';

/**
 * useGamification Hook
 * 
 * Manages gamification features:
 * - Streak tracking and updates
 * - Badge checking and notifications
 * - Celebration triggers (confetti, animations)
 * - Daily plan completion rewards
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

interface Badge {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  iconUrl: string;
  colorHex: string;
}

interface EarnedBadge {
  id: string;
  badge: Badge;
  earnedAt: string;
  viewedAt: string | null;
  isNew: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string;
  lastActivityDate: string;
  streakAtRisk: boolean;
  freezeCount: number;
  weekHistory: Array<{
    day: string;
    streakMaintained: boolean;
  }>;
}

interface StreakUpdateResult {
  updated: boolean;
  streakIncreased: boolean;
  currentStreak: number;
  usedFreeze: boolean;
}

interface BadgeCheckResult {
  newBadges: Badge[];
}

interface CelebrationData {
  type: 'lesson_complete' | 'daily_complete' | 'badge_unlock' | 'streak_milestone';
  badges?: Badge[];
  streakUpdated?: boolean;
  currentStreak?: number;
  dailyPlanCompleted?: boolean;
}

// Fetch streak data
async function fetchStreak(childId: string): Promise<StreakData> {
  const response = await fetch(`/api/curriculum/streak?childId=${childId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch streak data');
  }
  return response.json();
}

// Fetch earned badges
async function fetchEarnedBadges(childId: string): Promise<EarnedBadge[]> {
  const response = await fetch(`/api/curriculum/badges?childId=${childId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch badges');
  }
  return response.json();
}

// Update streak
async function updateStreakApi(childId: string): Promise<StreakUpdateResult> {
  const response = await fetch('/api/curriculum/streak/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId }),
  });
  if (!response.ok) {
    throw new Error('Failed to update streak');
  }
  return response.json();
}

// Check for new badges
async function checkBadgesApi(childId: string): Promise<BadgeCheckResult> {
  const response = await fetch('/api/curriculum/badges/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId }),
  });
  if (!response.ok) {
    throw new Error('Failed to check badges');
  }
  return response.json();
}

// Mark badge as viewed
async function viewBadgeApi(badgeId: string): Promise<void> {
  const response = await fetch(`/api/curriculum/badges/${badgeId}/view`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to mark badge as viewed');
  }
}

export function useGamification(childId: string) {
  const queryClient = useQueryClient();
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  // Streak query
  const { data: streak, isLoading: isStreakLoading } = useQuery({
    queryKey: ['streak', childId],
    queryFn: () => fetchStreak(childId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Badges query
  const { data: earnedBadges, isLoading: isBadgesLoading } = useQuery({
    queryKey: ['badges', childId],
    queryFn: () => fetchEarnedBadges(childId),
    staleTime: 5 * 60 * 1000,
  });

  // Streak update mutation
  const streakMutation = useMutation<StreakUpdateResult, Error>({
    mutationFn: () => updateStreakApi(childId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['streak', childId] });
      
      if (result.streakIncreased) {
        // Trigger confetti for streak milestones
        if (result.currentStreak % 7 === 0) {
          triggerStreakConfetti(result.currentStreak);
        }
      }
    },
  });

  // Badge check mutation
  const badgeMutation = useMutation<BadgeCheckResult, Error>({
    mutationFn: () => checkBadgesApi(childId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['badges', childId] });
    },
  });

  // View badge mutation
  const viewBadgeMutation = useMutation<void, Error, string>({
    mutationFn: viewBadgeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges', childId] });
    },
  });

  // Update streak
  const updateStreak = useCallback(async (): Promise<StreakUpdateResult> => {
    return streakMutation.mutateAsync();
  }, [streakMutation]);

  // Check for new badges
  const checkBadges = useCallback(async (): Promise<Badge[]> => {
    const result = await badgeMutation.mutateAsync();
    return result.newBadges;
  }, [badgeMutation]);

  // Mark badge as viewed
  const viewBadge = useCallback(async (badgeId: string) => {
    await viewBadgeMutation.mutateAsync(badgeId);
  }, [viewBadgeMutation]);

  // Show celebration
  const showCelebration = useCallback((data: CelebrationData) => {
    setCelebrationData(data);

    // Trigger confetti based on celebration type
    if (data.type === 'daily_complete') {
      triggerDailyCompletionConfetti();
    } else if (data.type === 'badge_unlock' && data.badges && data.badges.length > 0) {
      triggerBadgeConfetti();
    } else if (data.type === 'streak_milestone') {
      triggerStreakConfetti(data.currentStreak || 0);
    } else if (data.type === 'lesson_complete') {
      // Small confetti burst for lesson completion
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#4ECDC4'],
      });
    }
  }, []);

  // Dismiss celebration
  const dismissCelebration = useCallback(() => {
    setCelebrationData(null);
  }, []);

  // Confetti triggers
  const triggerDailyCompletionConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FF9F43', '#F368E0', '#54A0FF', '#4ECDC4', '#FFD700'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const triggerBadgeConfetti = () => {
    const colors = ['#FFD700', '#FFA500', '#FF8C00'];

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      scalar: 1.2,
    });
  };

  const triggerStreakConfetti = (streak: number) => {
    const colors = streak >= 30 
      ? ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
      : streak >= 7 
        ? ['#FF9F43', '#F368E0', '#54A0FF']
        : ['#22c55e', '#4ECDC4'];

    const duration = streak >= 30 ? 5000 : streak >= 7 ? 3000 : 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 8,
        spread: 80,
        origin: { x: 0.5, y: 0.6 },
        colors,
        scalar: streak >= 30 ? 1.5 : 1.2,
        drift: 0,
        gravity: 1.2,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // Get new (unviewed) badges
  const newBadges = earnedBadges?.filter((eb) => eb.isNew) || [];

  return {
    // Streak data
    streak,
    isStreakLoading,
    
    // Badges data
    earnedBadges,
    newBadges,
    isBadgesLoading,
    
    // Celebration state
    celebrationData,
    
    // Actions
    updateStreak,
    checkBadges,
    viewBadge,
    showCelebration,
    dismissCelebration,
    
    // Loading states
    isUpdatingStreak: streakMutation.isPending,
    isCheckingBadges: badgeMutation.isPending,
    isViewingBadge: viewBadgeMutation.isPending,
  };
}
