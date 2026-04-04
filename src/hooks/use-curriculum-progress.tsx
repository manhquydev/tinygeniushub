'use client';

/**
 * useCurriculumProgress Hook
 * 
 * Manages curriculum progress tracking including:
 * - Video watch progress updates
 * - Assignment completion
 * - Optimistic UI updates
 * - Error handling with rollback
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AbekaAssignment } from '@/components/curriculum/types';

interface ProgressUpdateData {
  videoId: string;
  watchPercent: number;
  watchSeconds: number;
  lastPosition?: number;
}

interface CompletionData {
  assignmentId: string;
  videoId?: string;
  minutesLearned: number;
}

interface ProgressResult {
  progress: {
    id: string;
    watchPercent: number;
    isCompleted: boolean;
  };
  isCompleted: boolean;
}

interface CompletionResult {
  success: boolean;
  streakUpdated: boolean;
  currentStreak: number;
  newBadges: Array<{
    id: string;
    nameVi: string;
    iconUrl: string;
  }>;
}

interface OptimisticContext {
  previousDailyPlan: unknown;
  previousAssignments: unknown;
}

export function useCurriculumProgress(childId: string) {
  const queryClient = useQueryClient();

  // Update video watch progress
  const progressMutation = useMutation<ProgressResult, Error, ProgressUpdateData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/abeka/progress/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          videoId: data.videoId,
          watchPercent: data.watchPercent,
          watchSeconds: data.watchSeconds,
          lastPosition: data.lastPosition,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update progress');
      }

      return response.json();
    },
    onSuccess: (result, variables) => {
      // Update local cache optimistically
      queryClient.setQueryData(
        ['video-progress', childId, variables.videoId],
        result.progress
      );

      // If completed, invalidate related queries
      if (result.isCompleted) {
        queryClient.invalidateQueries({ queryKey: ['daily-plan', childId] });
        queryClient.invalidateQueries({ queryKey: ['skill-tree', childId] });
      }
    },
    onError: (error) => {
      console.error('Progress update failed:', error);
      // Silent fail for progress updates - will retry next milestone
    },
  });

  // Complete assignment
  const completionMutation = useMutation<CompletionResult, Error, CompletionData, OptimisticContext>({
    mutationFn: async (data) => {
      const response = await fetch('/api/curriculum/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          assignmentId: data.assignmentId,
          videoId: data.videoId,
          minutesLearned: data.minutesLearned,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete assignment');
      }

      return response.json();
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['daily-plan', childId] });
      await queryClient.cancelQueries({ queryKey: ['assignments', childId] });

      // Snapshot previous values
      const previousDailyPlan = queryClient.getQueryData(['daily-plan', childId]);
      const previousAssignments = queryClient.getQueryData(['assignments', childId]);

      // Optimistically update assignment status
      queryClient.setQueryData(['daily-plan', childId], (old: { assignments: AbekaAssignment[] }) => {
        if (!old) return old;
        return {
          ...old,
          assignments: old.assignments.map((a: AbekaAssignment) =>
            a.id === data.assignmentId
              ? { ...a, status: 'COMPLETED' as const, completedAt: new Date() }
              : a
          ),
        };
      });

      return { previousDailyPlan, previousAssignments };
    },
    onSuccess: (result) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['daily-plan', childId] });
      queryClient.invalidateQueries({ queryKey: ['skill-tree', childId] });
      queryClient.invalidateQueries({ queryKey: ['streak', childId] });
      queryClient.invalidateQueries({ queryKey: ['badges', childId] });
      queryClient.invalidateQueries({ queryKey: ['progress', childId] });

      // Log success (toast notifications handled by caller)
      console.log('🎉 Hoàn thành bài học!', { newBadges: result.newBadges });
    },
    onError: (error, data, context) => {
      // Rollback optimistic update
      if (context?.previousDailyPlan) {
        queryClient.setQueryData(['daily-plan', childId], context.previousDailyPlan);
      }
      if (context?.previousAssignments) {
        queryClient.setQueryData(['assignments', childId], context.previousAssignments);
      }

      console.error('Failed to complete assignment:', error);
    },
  });

  // Helper function to update progress
  const updateProgress = async (data: ProgressUpdateData) => {
    return progressMutation.mutateAsync(data);
  };

  // Helper function to complete assignment
  const completeAssignment = async (data: CompletionData) => {
    return completionMutation.mutateAsync(data);
  };

  return {
    // State
    isUpdating: progressMutation.isPending || completionMutation.isPending,
    isProgressUpdating: progressMutation.isPending,
    isCompleting: completionMutation.isPending,
    
    // Errors
    progressError: progressMutation.error,
    completionError: completionMutation.error,
    
    // Actions
    updateProgress,
    completeAssignment,
    
    // Raw mutations for advanced use
    progressMutation,
    completionMutation,
  };
}
