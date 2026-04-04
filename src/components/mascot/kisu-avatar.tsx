"use client";

/**
 * KisuAvatar Component
 * Animated Kisu mascot for encouragement and guidance
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKisuContext } from "@/components/curriculum/shared/api";
import { KidMascot } from "@/components/animation/kid-mascot";

interface KisuAvatarProps {
  childId: string;
  mood?: KisuMood;
  message?: string;
  position?: "bottom-left" | "bottom-right" | "floating";
  onClick?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
  className?: string;
}

export type KisuMood =
  | "happy"
  | "excited"
  | "thinking"
  | "sleepy"
  | "celebrating"
  | "proud"
  | "surprised"
  | "encouraging";

interface PositionClasses {
  [key: string]: string;
}

const POSITION_CLASSES: PositionClasses = {
  "bottom-left": "left-4 bottom-4",
  "bottom-right": "right-4 bottom-4",
  floating: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

// Map KisuMood to KidMascot state
const MOOD_TO_MASCOT_STATE: Record<KisuMood, string> = {
  happy: "happy",
  excited: "excited",
  thinking: "confused",
  sleepy: "sleeping",
  celebrating: "celebrating",
  proud: "proud",
  surprised: "surprised",
  encouraging: "happy",
};

export function KisuAvatar({
  childId,
  mood = "happy",
  message: propMessage,
  position = "bottom-right",
  onClick,
  autoHide = false,
  hideDelay = 5000,
  className,
}: KisuAvatarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState(propMessage);

  const { data: context } = useKisuContext(childId);

  // Generate contextual message if none provided
  useEffect(() => {
    if (!propMessage && context) {
      const newTip = generateKisuTip(context);
      if (newTip && newTip !== displayedMessage) {
        setDisplayedMessage(newTip);
      }
    }
  }, [propMessage, context, displayedMessage]);

  // Auto hide after delay
  useEffect(() => {
    if (autoHide && displayedMessage) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, displayedMessage]);

  const handleClick = () => {
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const positionClass = POSITION_CLASSES[position] || POSITION_CLASSES["bottom-right"];
  const mascotState = MOOD_TO_MASCOT_STATE[mood] || "happy";

  if (!isVisible) return null;

  return (
    <motion.div
      className={`fixed z-40 ${positionClass} ${className || ""}`}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
    >
      <div className="flex items-end gap-2">
        {/* Speech Bubble */}
        <AnimatePresence>
          {displayedMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              className="relative mb-8 max-w-xs rounded-2xl bg-white p-4 shadow-lg"
            >
              <p className="text-sm font-medium text-slate-700">{displayedMessage}</p>
              <div className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kisu Character */}
        <motion.button
          className="relative"
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={
            isAnimating
              ? {
                  y: [0, -20, 0],
                  rotate: [0, -10, 10, -10, 10, 0],
                }
              : {
                  y: [0, -5, 0],
                }
          }
          transition={{
            repeat: isAnimating ? 0 : Infinity,
            duration: isAnimating ? 0.5 : 2,
          }}
          aria-label="Kisu mascot - click for encouragement"
        >
          <KidMascot
            state={mascotState as any}
            size={100}
            actionProp="exploring"
            title="Kisu"
          />

          {/* Click hint */}
          <motion.div
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            👆
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}

// Smart Kisu that provides contextual tips
export function SmartKisu({
  childId,
  className,
}: {
  childId: string;
  className?: string;
}) {
  const { data: context } = useKisuContext(childId);

  const getMoodFromContext = (): KisuMood => {
    if (!context) return "happy";
    if (context.isCelebration) return "celebrating";
    if (context.streakAboutToBreak) return "thinking";
    if (context.timeOfDay === "evening") return "sleepy";
    if (context.hasNewBadge) return "excited";
    if (context.progressPercent > 70) return "proud";
    if (context.progressPercent > 0 && context.progressPercent < 30)
      return "encouraging";
    return "happy";
  };

  const mood = getMoodFromContext();
  const message = context ? generateKisuTip(context) || undefined : undefined;

  return (
    <KisuAvatar
      childId={childId}
      mood={mood}
      message={message}
      position="bottom-right"
      autoHide={!!message}
      hideDelay={8000}
      className={className}
    />
  );
}

// Generate contextual tips based on the child's current state
function generateKisuTip(context: {
  timeOfDay: "morning" | "afternoon" | "evening";
  lessonsCompletedToday: number;
  totalLessonsToday: number;
  progressPercent: number;
  streakAboutToBreak: boolean;
  hasNewBadge: boolean;
  nextBadgeIn: number;
  isCelebration: boolean;
  currentSubject?: string;
}): string | null {
  const tips: Record<string, string[]> = {
    morning: [
      "Chào buổi sáng! Sẵn sàng học bài mới chưa?",
      "Ngày mới, năng lượng mới! Cùng học thôi!",
      "Kisu chào con! Hôm nay mình học gì nào?",
    ],
    streakRisk: [
      "Hôm nay chưa học bài nào! Chuỗi ngày sắp mất rồi!",
      "Chỉ 10 phút thôi là giữ được chuỗi đó!",
      "Đừng để chuỗi học bị đứt nhé! Cố lên!",
    ],
    progressGood: [
      "Con đang làm rất tốt! Tiếp tục phát huy nhé!",
      "Hôm nay con đã học được nhiều điều hay!",
      "Tuyệt vời! Con là người học siêng năng!",
    ],
    almostDone: [
      "Chỉ còn một chút nữa thôi! Cố lên!",
      "Sắp hoàn thành rồi! Con giỏi quá!",
    ],
    newBadge: [
      "Huy hiệu mới đang chờ con! Cố lên!",
      "Sắp đủ điều kiện nhận huy hiệu rồi!",
    ],
    evening: [
      "Buổi tối rồi! Nghỉ ngơi thôi con nhé!",
      "Hôm nay con đã cố gắng rất nhiều!",
    ],
    encouragement: [
      "Không sao đâu, mai học tiếp nhé!",
      "Nghỉ ngơi cũng quan trọng mà!",
      "Mỗi ngày một chút, con sẽ giỏi thôi!",
    ],
  };

  let category = "encouragement";

  if (context.timeOfDay === "morning" && context.lessonsCompletedToday === 0) {
    category = "morning";
  } else if (context.streakAboutToBreak) {
    category = "streakRisk";
  } else if (context.progressPercent >= 80) {
    category = "almostDone";
  } else if (context.progressPercent > 50) {
    category = "progressGood";
  } else if (context.nextBadgeIn <= 2) {
    category = "newBadge";
  } else if (context.timeOfDay === "evening") {
    category = "evening";
  }

  const categoryTips = tips[category];
  return categoryTips[Math.floor(Math.random() * categoryTips.length)];
}
