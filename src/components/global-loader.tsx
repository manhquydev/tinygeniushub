"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Mascot } from "@/components/mascot";

export function GlobalLoader() {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className="fixed inset-0 z-[220] grid place-items-center bg-slate-950/72 px-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Đang tải nội dung"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-1/4 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-2/3 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl"
      />

      <m.div
        className="relative z-10 grid w-full max-w-[28rem] justify-items-center gap-2 rounded-[28px] border border-sky-300/30 bg-slate-950/80 p-5 text-center text-slate-100 shadow-[0_28px_60px_rgba(2,6,23,0.58)]"
        animate={prefersReducedMotion ? { y: 0 } : { y: [0, -10, 0] }}
        transition={prefersReducedMotion ? undefined : { duration: 2.2, ease: "easeInOut", repeat: Infinity }}
      >
        <Mascot variant="duo" state="thinking" actionProp="reading" size={230} motionLevel="soft" pauseWhenOffscreen />
        <p className="text-sm font-semibold text-cyan-100/90 sm:text-base">
          Hai mẹ con Cú đang chuẩn bị hành trình học tập...
        </p>
      </m.div>
    </div>
  );
}
