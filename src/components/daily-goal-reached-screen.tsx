"use client";

import { LockOpen, MoonStar } from "lucide-react";
import { Mascot } from "@/components/mascot";

interface DailyGoalReachedScreenProps {
  childName: string;
  dailyGoalMinutes: number;
  totalMinutesToday: number;
  onRequestExtraLearning: () => void;
}

export function DailyGoalReachedScreen({
  childName,
  dailyGoalMinutes,
  totalMinutesToday,
  onRequestExtraLearning,
}: DailyGoalReachedScreenProps) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/70 bg-gradient-to-br from-yellow-100 via-orange-100 to-sky-100 p-6 shadow-[0_22px_52px_rgba(14,116,144,0.2)] sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-white/80 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
          <MoonStar size={22} className="text-amber-600" />
        </div>

        <div className="mt-4">
          <Mascot variant="big" state="celebrating" actionProp="magic" size={170} motionLevel="soft" pauseWhenOffscreen />
        </div>

        <h2 className="mt-3 text-balance text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">
          Hôm nay {childName} đã học đủ {dailyGoalMinutes} phút rồi! 🎉
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-700 sm:text-base">
          Đã học {totalMinutesToday} phút. Nghỉ ngơi để não bộ ghi nhớ tốt hơn nhé!
        </p>

        <button
          type="button"
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5"
          onClick={onRequestExtraLearning}
        >
          <LockOpen size={16} />
          Bố/Mẹ cho học thêm
        </button>
      </div>
    </div>
  );
}
