"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

export function GlobalLoader() {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className="fixed inset-0 z-[220] grid place-items-center bg-slate-950/72 px-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-1/4 h-60 w-60 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-2/3 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/20 blur-3xl"
      />

      <m.div
        className="relative z-10 grid w-full max-w-3xl gap-4 rounded-[30px] border border-sky-300/35 bg-slate-950/82 p-4 text-center text-slate-100 shadow-[0_28px_60px_rgba(2,6,23,0.58)] sm:p-6"
        animate={prefersReducedMotion ? { y: 0 } : { y: [0, -6, 0] }}
        transition={prefersReducedMotion ? undefined : { duration: 2.3, ease: "easeInOut", repeat: Infinity }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900/55">
          <Image
            src="/images/system/cloud-garden/system_loading_hero.png"
            alt="The Fox mascot is running on the rainbow track to prepare for the lesson"
            width={1368}
            height={768}
            priority
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-semibold text-cyan-100 sm:text-base">Preparing for a learning journey...</p>
          <p className="text-xs text-slate-300/90 sm:text-sm">
            The system is loading appropriate content for your baby, it only takes a few seconds.
          </p>
        </div>
      </m.div>
    </div>
  );
}

