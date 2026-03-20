"use client";

import { useState } from "react";
import { BeanstalkJourney } from "./BeanstalkJourney";
import type {
  BeanstalkChildProfile,
  BeanstalkJourneySummary,
  BeanstalkJourneyTier,
} from "./BeanstalkJourney";

/**
 * BeanstalkJourneyDemo - Demo version for homepage
 * 
 * Wrapper component providing mock data for BeanstalkJourney.
 * No authentication or database queries required.
 * 
 * Features:
 * - Mock child profiles (Bé Hương, Bé Minh)
 * - Mock journey data with realistic progress
 * - Triggers sign-up modal on navigation attempts
 * - Same visual UX as real /kid/garden route
 */

interface BeanstalkJourneyDemoProps {
  /**
   * Callback when user tries to navigate to course/lesson
   * Homepage should show sign-up modal instead of actual navigation
   */
  onNavigationAttempt?: (targetUrl: string) => void;
  
  /**
   * Optional: Override active child ID (for testing)
   */
  initialChildId?: string;
  
  /**
   * Optional: Override active journey ID (for testing)
   */
  initialJourneyId?: string;
}

// Mock data - realistic Vietnamese child learning journey
const MOCK_CHILDREN: BeanstalkChildProfile[] = [
  { id: "demo-child-1", nickname: "Bé Hương" },
  { id: "demo-child-2", nickname: "Bé Minh" },
];

const MOCK_JOURNEYS: BeanstalkJourneySummary[] = [
  {
    id: "demo-journey-toan-1",
    courseSlug: "toan-tu-duy-1",
    courseTitle: "Toán Tư Duy 1",
    status: "ACTIVE",
    seedName: "Hạt Toán",
    currentTierNo: 3,
    currentTierProgress: 45, // 45% through tier 3
    totalTiers: 5,
    completedTiers: 2,
    totalLessons: 50,
    completedLessons: 23,
  },
  {
    id: "demo-journey-tieng-anh-1",
    courseSlug: "tieng-anh-mam-non",
    courseTitle: "Tiếng Anh Mầm Non",
    status: "ACTIVE",
    seedName: "Hạt ABC",
    currentTierNo: 2,
    currentTierProgress: 70,
    totalTiers: 4,
    completedTiers: 1,
    totalLessons: 40,
    completedLessons: 18,
  },
  {
    id: "demo-journey-ky-nang",
    courseSlug: "ky-nang-song",
    courseTitle: "Kỹ Năng Sống",
    status: "SEEDED",
    seedName: "Hạt Khéo Tay",
    currentTierNo: 1,
    currentTierProgress: 0,
    totalTiers: 3,
    completedTiers: 0,
    totalLessons: 30,
    completedLessons: 0,
  },
];

const MOCK_TIERS_TOAN: BeanstalkJourneyTier[] = [
  {
    tierNo: 1,
    title: "Gà Con Vàng",
    lessonTotal: 10,
    lessonCompleted: 10,
    isUnlocked: true,
    isCompleted: true,
  },
  {
    tierNo: 2,
    title: "Thỏ Nhỏ Nhanh Nhẹn",
    lessonTotal: 10,
    lessonCompleted: 10,
    isUnlocked: true,
    isCompleted: true,
  },
  {
    tierNo: 3,
    title: "Sóc Bay Thông Minh",
    lessonTotal: 10,
    lessonCompleted: 4, // Currently on this tier (45% progress ≈ 4.5 lessons)
    isUnlocked: true,
    isCompleted: false,
  },
  {
    tierNo: 4,
    title: "Rồng Xanh Dũng Mãnh",
    lessonTotal: 10,
    lessonCompleted: 0,
    isUnlocked: false, // Locked
    isCompleted: false,
  },
  {
    tierNo: 5,
    title: "Phượng Hoàng Tự Tin",
    lessonTotal: 10,
    lessonCompleted: 0,
    isUnlocked: false, // Locked
    isCompleted: false,
  },
];

const MOCK_TIERS_TIENG_ANH: BeanstalkJourneyTier[] = [
  {
    tierNo: 1,
    title: "Hello Friends",
    lessonTotal: 10,
    lessonCompleted: 10,
    isUnlocked: true,
    isCompleted: true,
  },
  {
    tierNo: 2,
    title: "Colors & Shapes",
    lessonTotal: 10,
    lessonCompleted: 7, // 70% progress
    isUnlocked: true,
    isCompleted: false,
  },
  {
    tierNo: 3,
    title: "Animals & Nature",
    lessonTotal: 10,
    lessonCompleted: 0,
    isUnlocked: false,
    isCompleted: false,
  },
  {
    tierNo: 4,
    title: "Daily Routines",
    lessonTotal: 10,
    lessonCompleted: 0,
    isUnlocked: false,
    isCompleted: false,
  },
];

const MOCK_TIERS_KY_NANG: BeanstalkJourneyTier[] = [
  {
    tierNo: 1,
    title: "Tự Phục Vụ Bản Thân",
    lessonTotal: 10,
    lessonCompleted: 0,
    isUnlocked: true, // Tier 1 luôn unlocked
    isCompleted: false,
  },
  {
    tierNo: 2,
    title: "Giao Tiếp Tự Tin",
    lessonTotal: 10,
    lessonCompleted: 0,
    isUnlocked: false,
    isCompleted: false,
  },
  {
    tierNo: 3,
    title: "Làm Việc Nhóm",
    lessonTotal: 10,
    lessonCompleted: 0,
    isUnlocked: false,
    isCompleted: false,
  },
];

export function BeanstalkJourneyDemo({
  onNavigationAttempt,
  initialChildId = "demo-child-1",
  initialJourneyId = "demo-journey-toan-1",
}: BeanstalkJourneyDemoProps) {
  // State for demo mode (không dùng real router)
  const [activeChildId] = useState(initialChildId);
  const [activeJourneyId] = useState(initialJourneyId);

  // Get active journey
  const activeJourney = MOCK_JOURNEYS.find((j) => j.id === activeJourneyId) || MOCK_JOURNEYS[0];

  // Get tiers for active journey
  const getTiersForJourney = (journeyId: string): BeanstalkJourneyTier[] => {
    if (journeyId === "demo-journey-toan-1") return MOCK_TIERS_TOAN;
    if (journeyId === "demo-journey-tieng-anh-1") return MOCK_TIERS_TIENG_ANH;
    if (journeyId === "demo-journey-ky-nang") return MOCK_TIERS_KY_NANG;
    return MOCK_TIERS_TOAN;
  };

  const tiers = getTiersForJourney(activeJourneyId);

  // Handle navigation attempts - trigger sign-up modal
  const handleNavigation = (url: string) => {
    if (onNavigationAttempt) {
      onNavigationAttempt(url);
    } else {
      console.log("[BeanstalkJourneyDemo] Navigation attempt:", url);
      // Fallback: alert user to sign up
      alert("Đăng ký để trải nghiệm đầy đủ tính năng!");
    }
  };

  return (
    <BeanstalkJourney
      childrenProfiles={MOCK_CHILDREN}
      activeChildId={activeChildId}
      journeys={MOCK_JOURNEYS}
      activeJourneyId={activeJourneyId}
      activeJourneyCourseSlug={activeJourney.courseSlug}
      activeJourneyCourseTitle={activeJourney.courseTitle}
      tiers={tiers}
    />
  );
}
