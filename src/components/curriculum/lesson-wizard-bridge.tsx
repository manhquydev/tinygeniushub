'use client';

/**
 * LessonWizardBridge Component
 * Bridge between curriculum system and existing Lesson Wizard video player
 * 
 * This component connects the Abeka curriculum assignments to the existing
 * lesson wizard flow, handling video playback and progress tracking.
 */

import { useCallback, useState } from 'react';
import { LessonWizardFlow } from '@/components/lesson-wizard/lesson-wizard-flow';
import { useCurriculumProgress } from '@/hooks/use-curriculum-progress';
import { useGamification } from '@/hooks/use-gamification';
import type { AbekaAssignment, AbekaSubjectCode } from '@/components/curriculum/types';

interface VideoInfo {
  id: string;
  title: string;
  durationMinutes: number;
  thumbnailUrl: string;
  videoUrl: string;
}

interface LessonWizardBridgeProps {
  childId: string;
  assignment: AbekaAssignment;
  videoInfo?: VideoInfo;
  onClose: () => void;
  onComplete?: () => void;
}

// Badge type matching useGamification hook
interface Badge {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  iconUrl: string;
  colorHex: string;
}

// Celebration data type
interface CelebrationData {
  type: 'lesson_complete' | 'daily_complete' | 'badge_unlock' | 'streak_milestone';
  badges?: Badge[];
  streakUpdated?: boolean;
  currentStreak?: number;
  dailyPlanCompleted?: boolean;
}

export function LessonWizardBridge({
  childId,
  assignment,
  videoInfo,
  onClose,
  onComplete,
}: LessonWizardBridgeProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  
  const {
    updateProgress,
    completeAssignment,
    isUpdating,
  } = useCurriculumProgress(childId);
  
  const {
    checkBadges,
    updateStreak,
    showCelebration,
    celebrationData,
    dismissCelebration,
  } = useGamification(childId);

  // Handle video completion from Lesson Wizard
  const handleLessonComplete = useCallback(async (lessonId: string) => {
    setIsCompleting(true);
    
    try {
      // Mark assignment as complete in database
      await completeAssignment({
        assignmentId: assignment.id,
        videoId: videoInfo?.id,
        minutesLearned: videoInfo?.durationMinutes || assignment.lessonPackage?.durationMinutes || 15,
      });

      // Update streak
      const streakResult = await updateStreak();

      // Check for new badges
      const newBadges = await checkBadges();

      // Show celebration with confetti and badges
      const celebrationData: CelebrationData = {
        type: 'lesson_complete',
        badges: newBadges,
        streakUpdated: streakResult.streakIncreased,
        currentStreak: streakResult.currentStreak,
      };
      
      // Cast badges to match the expected type
      showCelebration(celebrationData);

      onComplete?.();
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      // Error is handled by the hook
    } finally {
      setIsCompleting(false);
    }
  }, [
    assignment.id,
    assignment.lessonPackage?.durationMinutes,
    videoInfo?.id,
    videoInfo?.durationMinutes,
    completeAssignment,
    checkBadges,
    updateStreak,
    showCelebration,
    onComplete,
  ]);

  // Handle video progress updates during playback
  const handleVideoProgress = useCallback(async (progress: {
    percent: number;
    seconds: number;
    position: number;
    duration: number;
  }) => {
    // Only save progress at 10% milestones to avoid too many API calls
    if (progress.percent % 10 === 0 && videoInfo?.id) {
      await updateProgress({
        videoId: videoInfo.id,
        watchPercent: progress.percent,
        watchSeconds: progress.seconds,
        lastPosition: progress.position,
      });
    }
  }, [updateProgress, videoInfo?.id]);

  // Build lesson objective from assignment data
  const lessonObjective = assignment.lessonPackage
    ? `Learn${getSubjectNameVi(assignment.subjectCode as AbekaSubjectCode)}- Post${assignment.lesson?.lessonNumber}`
    : 'Complete today\'s lesson';

  // Get video source from video info or assignment
  const videoSource = videoInfo?.videoUrl || null;
  const videoStreamType: 'hls' | 'file' | null = videoSource?.includes('.m3u8') ? 'hls' : 
    videoSource ? 'file' : null;

  return (
    <>
      <LessonWizardFlow
        childId={childId}
        lessonId={assignment.lessonId}
        title={assignment.lesson?.title || `Post${assignment.lesson?.lessonNumber}`}
        objective={lessonObjective}
        estimatedMinutes={videoInfo?.durationMinutes || assignment.lessonPackage?.durationMinutes || 15}
        videoSource={videoSource}
        videoStreamType={videoStreamType}
        onClose={onClose}
        onCompleted={handleLessonComplete}
      />

      {/* Gamification Celebration Overlay */}
      {celebrationData && (
        <GamificationCelebration
          data={celebrationData}
          onDismiss={dismissCelebration}
        />
      )}
    </>
  );
}

// Helper function to get Vietnamese subject name
function getSubjectNameVi(code: AbekaSubjectCode): string {
  const names: Record<AbekaSubjectCode, string> = {
    PHONICS: 'Phonics',
    ARITHMETIC: 'Arithmetic',
    BIBLE: 'Bible',
    WRITING: 'Writing',
    SCIENCE: 'Science',
    HISTORY: 'History',
    ACTIVITIES: 'Work',
    READING: 'Read comprehension',
  };
  return names[code] || code;
}

// Celebration overlay component
interface GamificationCelebrationProps {
  data: CelebrationData;
  onDismiss: () => void;
}

function GamificationCelebration({ data, onDismiss }: GamificationCelebrationProps) {
  // This would use the existing celebration UI from the curriculum components
  // For now, return null as the celebration is handled by the hook
  return null;
}
