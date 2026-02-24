"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Mascot } from "@/components/mascot";
import type { MascotGazeDirection, MascotState } from "@/components/mascot/types";

type StoryPhase = 1 | 2 | 3;

const CINEMATIC_EASE = [0.25, 0.46, 0.45, 0.94] as const;

const STAR_FIELD = [
  { top: "7%", left: "9%", size: 2, opacity: 0.68, delay: 0.1, duration: 3.2 },
  { top: "10%", left: "23%", size: 3, opacity: 0.86, delay: 0.6, duration: 2.6 },
  { top: "14%", left: "68%", size: 2, opacity: 0.64, delay: 0.9, duration: 3.5 },
  { top: "18%", left: "84%", size: 3, opacity: 0.91, delay: 1.2, duration: 2.9 },
  { top: "22%", left: "37%", size: 2, opacity: 0.58, delay: 1.5, duration: 3.7 },
  { top: "29%", left: "13%", size: 2, opacity: 0.72, delay: 0.5, duration: 2.8 },
  { top: "33%", left: "57%", size: 3, opacity: 0.8, delay: 1.9, duration: 3.4 },
  { top: "36%", left: "76%", size: 2, opacity: 0.62, delay: 0.2, duration: 3.1 },
  { top: "42%", left: "31%", size: 3, opacity: 0.84, delay: 2.1, duration: 2.7 },
  { top: "47%", left: "89%", size: 2, opacity: 0.56, delay: 1.7, duration: 3.6 },
  { top: "52%", left: "8%", size: 2, opacity: 0.74, delay: 2.4, duration: 2.9 },
  { top: "58%", left: "48%", size: 3, opacity: 0.9, delay: 0.8, duration: 3.3 },
  { top: "63%", left: "69%", size: 2, opacity: 0.67, delay: 2.7, duration: 2.8 },
  { top: "68%", left: "25%", size: 2, opacity: 0.6, delay: 1.1, duration: 3.9 },
  { top: "72%", left: "82%", size: 3, opacity: 0.82, delay: 0.4, duration: 3.2 },
  { top: "78%", left: "16%", size: 2, opacity: 0.7, delay: 1.4, duration: 2.7 },
  { top: "83%", left: "41%", size: 3, opacity: 0.88, delay: 2.2, duration: 3.5 },
  { top: "87%", left: "60%", size: 2, opacity: 0.61, delay: 0.7, duration: 2.8 },
  { top: "91%", left: "74%", size: 2, opacity: 0.76, delay: 1.8, duration: 3.4 },
  { top: "94%", left: "33%", size: 2, opacity: 0.57, delay: 2.5, duration: 3.1 },
] as const;

const FIREFLIES = [
  { top: "26%", left: "18%", size: 4, delay: 0.2, duration: 5.1 },
  { top: "30%", left: "72%", size: 3, delay: 1.1, duration: 4.6 },
  { top: "50%", left: "11%", size: 3, delay: 0.6, duration: 5.4 },
  { top: "56%", left: "79%", size: 4, delay: 1.8, duration: 4.8 },
  { top: "66%", left: "27%", size: 3, delay: 2.2, duration: 5.6 },
  { top: "71%", left: "63%", size: 4, delay: 1.4, duration: 4.9 },
] as const;

function getHeadline(phase: StoryPhase) {
  if (phase === 3) {
    return "Cú Mẹ đã tìm thấy con rồi! 🦉💛";
  }
  return "Ôi không! Cú Con đang lạc đường...";
}

function getSubtext(phase: StoryPhase) {
  if (phase === 2) {
    return "Ồ! Cú Mẹ nghe thấy tiếng kêu của con rồi! Đang bay đến...";
  }
  if (phase === 3) {
    return "Hai mẹ con sẽ dẫn bạn trở về nhà. Đường dẫn này không tồn tại, nhưng trang chủ luôn ở đây!";
  }
  return "Bé Cú đã bay nhầm vào khu rừng tối. Đừng lo, Cú Mẹ đang đến rồi!";
}

function QuestionCloud({ animated }: { animated: boolean }) {
  return (
    <div className="absolute -top-14 left-1/2 flex -translate-x-1/2 gap-3">
      {["?", "?", "?"].map((q, i) => (
        <m.span
          key={`${q}-${i}`}
          className="text-xl font-black text-amber-200/80"
          animate={animated ? { y: [0, -8, 0], opacity: [0.4, 1, 0.4] } : undefined}
          transition={animated ? { duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" } : undefined}
        >
          {q}
        </m.span>
      ))}
    </div>
  );
}

function CallRipples({ animated }: { animated: boolean }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {[0, 0.35, 0.7].map((delay) => (
        <m.div
          key={`ripple-${delay}`}
          className="absolute h-16 w-16 rounded-full border-2 border-cyan-300/50"
          style={{ left: "-32px", top: "-32px" }}
          animate={animated ? { scale: [0, 2.8], opacity: [0.85, 0] } : undefined}
          transition={animated ? { duration: 1.4, repeat: Infinity, delay, ease: "easeOut" } : undefined}
        />
      ))}
    </div>
  );
}

export default function NotFound() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const [phase, setPhase] = useState<StoryPhase>(1);
  const [cycleCount, setCycleCount] = useState(0);
  const [smallState, setSmallState] = useState<MascotState>("sad");
  const [smallGaze, setSmallGaze] = useState<MascotGazeDirection>("right");
  const [showParent, setShowParent] = useState(false);
  const [showRipples, setShowRipples] = useState(false);
  const [showGuidePath, setShowGuidePath] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase(3);
      setSmallState("happy");
      setSmallGaze("right");
      setShowParent(true);
      setShowRipples(false);
      setShowGuidePath(true);
      return;
    }

    let cancelled = false;
    let timers: number[] = [];

    const clearTimers = () => {
      for (const timerId of timers) {
        window.clearTimeout(timerId);
      }
      timers = [];
    };

    const startCycle = (count: number) => {
      if (cancelled) return;

      clearTimers();
      setPhase(1);
      setCycleCount(count);
      setSmallState("sad");
      setSmallGaze("right");
      setShowParent(false);
      setShowRipples(false);
      setShowGuidePath(false);

      const t1 = window.setTimeout(() => {
        if (cancelled) return;
        setPhase(2);
        setShowParent(true);
        setShowRipples(true);
        setSmallGaze("right");
      }, 3500);

      const t2 = window.setTimeout(() => {
        if (cancelled) return;
        setPhase(3);
        setSmallState("happy");
        setShowRipples(false);
        setShowGuidePath(true);
      }, 6500);

      const t3 = window.setTimeout(() => {
        if (!cancelled) {
          startCycle(count + 1);
        }
      }, 14000);

      timers = [t1, t2, t3];
    };

    startCycle(0);

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [prefersReducedMotion]);

  const shouldLoop = !prefersReducedMotion;

  return (
    <LazyMotion features={domAnimation}>
      <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] text-slate-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(20,184,166,0.3)_0%,transparent_36%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.24)_0%,transparent_34%),radial-gradient(circle_at_50%_92%,rgba(99,102,241,0.32)_0%,transparent_44%)]"
        />

        <m.div
          aria-hidden
          className="pointer-events-none absolute right-[12%] top-[8%] h-20 w-20 rounded-full bg-white/90 blur-[2px]"
          style={{ boxShadow: "0 0 60px 20px rgba(253,224,71,0.25)" }}
          animate={shouldLoop ? { scale: [1, 1.06, 1], opacity: [0.88, 1, 0.88] } : undefined}
          transition={shouldLoop ? { duration: 6.2, ease: "easeInOut", repeat: Infinity } : undefined}
        />

        <div aria-hidden className="not-found-fog not-found-fog-a" />
        <div aria-hidden className="not-found-fog not-found-fog-b" />

        {STAR_FIELD.map((star, index) => (
          <span
            key={`${star.top}-${star.left}-${index}`}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              boxShadow: "0 0 16px rgba(248,250,252,0.8)",
              animation: shouldLoop
                ? `notFoundTwinkle ${star.duration}s ease-in-out ${star.delay}s infinite`
                : undefined,
            }}
          />
        ))}

        {FIREFLIES.map((light, index) => (
          <m.span
            key={`firefly-${index}`}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-amber-200/90"
            style={{
              top: light.top,
              left: light.left,
              width: light.size,
              height: light.size,
              boxShadow: "0 0 14px rgba(253,224,71,0.65)",
            }}
            animate={
              shouldLoop
                ? {
                  y: [0, -11, 0, -6, 0],
                  x: [0, 4, -3, 2, 0],
                  opacity: [0.35, 0.9, 0.4, 0.8, 0.35],
                }
                : undefined
            }
            transition={
              shouldLoop
                ? { duration: light.duration, delay: light.delay, ease: "easeInOut", repeat: Infinity }
                : undefined
            }
          />
        ))}

        <svg
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-[120px] w-full"
          viewBox="0 0 1440 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 160V108C88 88 150 94 218 106C304 120 398 132 502 116C616 98 712 76 818 90C920 104 1014 136 1140 122C1242 110 1330 90 1440 108V160H0Z" fill="#0a1628" fillOpacity="0.1" />
          <path d="M70 156C88 120 112 112 136 156" fill="#0a1628" fillOpacity="0.1" />
          <path d="M388 156C414 112 446 104 474 156" fill="#0a1628" fillOpacity="0.1" />
          <path d="M812 156C838 114 868 104 898 156" fill="#0a1628" fillOpacity="0.1" />
          <path d="M1186 156C1214 112 1248 102 1278 156" fill="#0a1628" fillOpacity="0.1" />
        </svg>

        <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
          <m.div
            key={`small-${cycleCount}`}
            className="absolute left-0 top-[48%] -translate-y-1/2"
            initial={prefersReducedMotion ? false : { x: -220, opacity: 1 }}
            animate={{ x: phase >= 2 ? 80 : 120 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 2.6, ease: CINEMATIC_EASE }}
          >
            <Mascot
              variant="small"
              state={smallState}
              gazeDirection={phase >= 2 ? "right" : smallGaze}
              size={180}
              motionLevel={prefersReducedMotion ? "minimal" : "full"}
              className="drop-shadow-[0_20px_48px_rgba(14,165,233,0.4)]"
            />
            {phase === 1 ? <QuestionCloud animated={shouldLoop} /> : null}
            {showRipples ? <CallRipples animated={shouldLoop} /> : null}
          </m.div>

          <AnimatePresence>
            {showParent ? (
              <m.div
                key={`big-owl-${cycleCount}`}
                className="absolute right-0 top-[44%] -translate-y-1/2"
                initial={prefersReducedMotion ? false : { x: 300, opacity: 0, scale: 0.5 }}
                animate={{ x: -260, opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { x: 300, opacity: 0 }}
                transition={
                  prefersReducedMotion ? { duration: 0 } : { duration: 2.2, ease: CINEMATIC_EASE }
                }
              >
                <Mascot
                  variant="big"
                  state="love"
                  gazeDirection="left"
                  size={240}
                  motionLevel={prefersReducedMotion ? "minimal" : "full"}
                  className="drop-shadow-[0_20px_48px_rgba(251,191,36,0.3)]"
                />
              </m.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showGuidePath ? (
              <m.svg
                key={`guide-${cycleCount}`}
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
              >
                <m.path
                  d="M 32 50 Q 50 68 50 82"
                  stroke="#fde047"
                  strokeOpacity="0.65"
                  strokeWidth="0.4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="2 1.5"
                  animate={shouldLoop ? { strokeDashoffset: [0, -7] } : undefined}
                  transition={shouldLoop ? { duration: 1.4, repeat: Infinity, ease: "linear" } : undefined}
                />
              </m.svg>
            ) : null}
          </AnimatePresence>
        </div>

        <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-5 px-6 py-12 text-center">
          <p className="rounded-full border border-cyan-200/30 bg-slate-950/45 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-cyan-100/90">
            Lỗi 404
          </p>

          <div className="flex items-center gap-2" style={{ filter: "drop-shadow(0 0 28px rgba(99,102,241,0.55))" }}>
            {["4", "0", "4"].map((digit, index) => (
              <m.span
                key={`${digit}-${index}`}
                className="inline-flex min-h-20 min-w-16 items-center justify-center rounded-2xl border border-slate-200/20 bg-slate-900/35 px-3 text-8xl font-black leading-none text-transparent [background-image:linear-gradient(to_bottom,#ffffff,#94a3b8)] bg-clip-text"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.12 }}
              >
                {digit}
              </m.span>
            ))}
          </div>

          <div className="h-52 sm:h-60" aria-hidden />

          <AnimatePresence mode="wait">
            <m.h1
              key={phase === 3 ? "found" : "lost"}
              className="max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35 }}
            >
              {getHeadline(phase)}
            </m.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <m.p
              key={phase}
              className="max-w-[50ch] text-pretty text-base leading-relaxed text-slate-200/90 sm:text-lg"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            >
              {getSubtext(phase)}
            </m.p>
          </AnimatePresence>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 px-7 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.34)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
            style={{
              background: "linear-gradient(90deg, #34d399, #22d3ee, #34d399)",
              backgroundSize: "200% 100%",
              animation: shouldLoop ? "notFoundShimmer 2.5s linear infinite" : undefined,
            }}
          >
            {phase >= 3 ? "🏠 Về trang chủ cùng Cú Mẹ" : "🏠 Về trang chủ"}
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium text-slate-300/80 underline-offset-4 transition hover:text-slate-100 hover:underline"
          >
            ← Quay lại trang trước
          </button>
        </section>
      </main>
    </LazyMotion>
  );
}
