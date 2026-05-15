"use client";

/**
 * StreakDisplay Component
 * Shows streak counter with animations and week heatmap
 */

import { motion } from "framer-motion";
import { Flame, Snowflake, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStreak } from "../shared/api";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  childId: string;
  variant?: "compact" | "full";
  className?: string;
}

export function StreakDisplay({
  childId,
  variant = "compact",
  className,
}: StreakDisplayProps) {
  const { data: streak, isLoading } = useStreak(childId);

  if (isLoading) {
    return <StreakSkeleton variant={variant} />;
  }

  if (!streak) {
    return null;
  }

  if (variant === "compact") {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-white",
          className
        )}
        animate={
          streak.currentStreak > 0
            ? {
                scale: [1, 1.05, 1],
              }
            : {}
        }
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <motion.div
          animate={
            streak.currentStreak > 0
              ? {
                  rotate: [0, -10, 10, -10, 10, 0],
                }
              : {}
          }
          transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 3 }}
        >
          <Flame className="h-5 w-5" />
        </motion.div>
        <span className="font-bold">{streak.currentStreak}</span>
        <span className="text-sm opacity-90">day</span>
      </motion.div>
    );
  }

  // Full variant
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">A series of consecutive school days</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-5xl font-bold"
                key={streak.currentStreak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {streak.currentStreak}
              </motion.span>
              <span className="text-xl">day</span>
            </div>
            <p className="mt-2 text-sm opacity-90">
              Record: {streak.longestStreak} day
            </p>
          </div>

          {/* Animated Flame */}
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
            }}
          >
            <Flame className="h-24 w-24" />
            <motion.div
              className="absolute inset-0 rounded-full bg-orange-400 blur-xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Week Heatmap */}
      <CardContent className="p-4">
        <div className="flex justify-between gap-2">
          {streak.weekHistory.map((day: { day: string; streakMaintained: boolean }, i: number) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg transition-colors",
                  day.streakMaintained ? "bg-orange-500" : "bg-slate-200"
                )}
              />
              <span className="text-xs text-slate-500">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i]}
              </span>
            </div>
          ))}
        </div>

        {/* Freeze Tokens */}
        <div className="mt-4 flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-sky-500" />
          <span className="text-sm text-slate-600">
            Freeze tokens: {streak.freezeCount}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="rounded-full p-1 hover:bg-slate-100">
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Used to keep the chain when not studying for a day</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Streak at Risk Warning */}
        {streak.streakAtRisk && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl bg-red-50 p-3 text-red-700"
          >
            <p className="text-sm font-medium">
              ⚠️ The chain is about to be lost! Learn now to keep the chain.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton loading state
function StreakSkeleton({ variant }: { variant: "compact" | "full" }) {
  if (variant === "compact") {
    return (
      <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200"></div>
    );
  }
  return (
    <div className="h-48 animate-pulse rounded-xl bg-slate-200"></div>
  );
}
