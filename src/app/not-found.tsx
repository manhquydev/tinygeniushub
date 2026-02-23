"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Mascot } from "@/components/mascot";

type StoryPhase = 1 | 2 | 3;

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

const FOOTPRINT_TRAIL = [
  { left: "20%", top: "70%", opacity: 0.9 },
  { left: "15%", top: "76%", opacity: 0.72 },
  { left: "11%", top: "82%", opacity: 0.54 },
  { left: "7%", top: "88%", opacity: 0.36 },
  { left: "3%", top: "94%", opacity: 0.2 },
] as const;

const QUESTION_MARKS = [
  { top: "22%", left: "24%", delay: 0.1 },
  { top: "18%", left: "66%", delay: 0.5 },
  { top: "40%", left: "16%", delay: 0.9 },
  { top: "38%", left: "76%", delay: 1.3 },
] as const;

const FIREFLIES = [
  { top: "26%", left: "18%", size: 4, delay: 0.2, duration: 5.1 },
  { top: "30%", left: "72%", size: 3, delay: 1.1, duration: 4.6 },
  { top: "50%", left: "11%", size: 3, delay: 0.6, duration: 5.4 },
  { top: "56%", left: "79%", size: 4, delay: 1.8, duration: 4.8 },
  { top: "66%", left: "27%", size: 3, delay: 2.2, duration: 5.6 },
  { top: "71%", left: "63%", size: 4, delay: 1.4, duration: 4.9 },
] as const;

function getSubtext(phase: StoryPhase) {
  if (phase === 2) {
    return "Ồ! Cú Mẹ nghe thấy tiếng kêu của con rồi! Đang bay đến...";
  }
  if (phase === 3) {
    return "Hai mẹ con Cú sẽ chỉ đường dẫn bạn trở về nhà. Đường dẫn bạn tìm không tồn tại, nhưng trang chủ thì luôn ở đây!";
  }
  return "Bé cú đã bay nhầm vào một khu rừng tối. Đừng lo, Cú Mẹ đang trên đường đến rồi!";
}

export default function NotFound() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<StoryPhase>(1);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const phaseResetTimer = window.setTimeout(() => setPhase(1), 0);
    const phaseTwoTimer = window.setTimeout(() => setPhase(2), 3000);
    const phaseThreeTimer = window.setTimeout(() => setPhase(3), 6000);

    return () => {
      window.clearTimeout(phaseResetTimer);
      window.clearTimeout(phaseTwoTimer);
      window.clearTimeout(phaseThreeTimer);
    };
  }, [prefersReducedMotion]);

  const activePhase: StoryPhase = prefersReducedMotion ? 3 : phase;
  const shouldLoop = !prefersReducedMotion;
  const headline = activePhase === 3 ? "Cú Mẹ đã tìm thấy con! 🦉💛" : "Ôi không! Cú Con đang lạc đường...";
  const sceneInitial = prefersReducedMotion ? false : { opacity: 0, y: 26, scale: 0.95 };
  const sceneExit = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.94 };
  const sceneTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const };

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
          animate={
            shouldLoop
              ? {
                  scale: [1, 1.06, 1],
                  opacity: [0.88, 1, 0.88],
                }
              : undefined
          }
          transition={
            shouldLoop
              ? {
                  duration: 6.2,
                  ease: "easeInOut",
                  repeat: Infinity,
                }
              : undefined
          }
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
                ? {
                    duration: light.duration,
                    delay: light.delay,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }
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

        <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
          <m.p
            className="rounded-full border border-cyan-200/30 bg-slate-950/45 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-cyan-100/90"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
          >
            Lỗi 404
          </m.p>

          <div
            className="flex items-center gap-2"
            style={{ filter: "drop-shadow(0 0 24px rgba(99,102,241,0.5))" }}
          >
            {[
              { digit: "4", delay: 0 },
              { digit: "0", delay: 0.12 },
              { digit: "4", delay: 0.24 },
            ].map((item) => (
              <m.span
                key={`${item.digit}-${item.delay}`}
                className="inline-flex min-h-20 min-w-16 items-center justify-center rounded-2xl border border-slate-200/20 bg-slate-900/35 px-3 text-8xl font-black leading-none text-transparent [background-image:linear-gradient(to_bottom,#ffffff,#94a3b8)] bg-clip-text"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.55, ease: "easeOut", delay: item.delay }
                }
              >
                {item.digit}
              </m.span>
            ))}
          </div>

          <div className="relative mx-auto h-[264px] w-full max-w-[320px]">
            {activePhase === 1 && (
              <div className="pointer-events-none absolute inset-0">
                {FOOTPRINT_TRAIL.map((step, index) => (
                  <span
                    key={`foot-${index}`}
                    aria-hidden
                    className="absolute text-lg"
                    style={{
                      left: step.left,
                      top: step.top,
                      opacity: step.opacity,
                      animation: shouldLoop ? `notFoundFootprint 1.5s ease-in-out ${index * 0.2}s infinite` : undefined,
                    }}
                  >
                    🐾
                  </span>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {activePhase === 1 && (
                <m.div
                  key="phase-1"
                  className="relative flex h-full items-center justify-center"
                  initial={sceneInitial}
                  animate={{ opacity: 1, y: 0 }}
                  exit={sceneExit}
                  transition={sceneTransition}
                >
                  {QUESTION_MARKS.map((mark, index) => (
                    <m.span
                      key={`q-${index}`}
                      aria-hidden
                      className="absolute text-2xl font-bold text-amber-200/70"
                      style={{ top: mark.top, left: mark.left }}
                      animate={
                        shouldLoop
                          ? {
                              y: [0, -8, 0],
                              opacity: [0.5, 0.9, 0.5],
                            }
                          : undefined
                      }
                      transition={
                        shouldLoop
                          ? {
                              duration: 2.4,
                              ease: "easeInOut",
                              delay: mark.delay,
                              repeat: Infinity,
                            }
                          : undefined
                      }
                    >
                      ?
                    </m.span>
                  ))}

                  <div aria-hidden className="absolute h-52 w-52 rounded-full bg-cyan-300/20 blur-[68px]" />
                  <m.div
                    animate={
                      shouldLoop
                        ? {
                            x: [0, -3, 2, 0],
                            y: [0, -2, 0, 1, 0],
                            rotate: [0, -1.2, 0.8, 0],
                          }
                        : undefined
                    }
                    transition={
                      shouldLoop
                        ? {
                            duration: 3,
                            ease: "easeInOut",
                            repeat: Infinity,
                          }
                        : undefined
                    }
                  >
                    <Mascot
                      variant="small"
                      state="sad"
                      gazeDirection="center"
                      size={280}
                      motionLevel={shouldLoop ? "full" : "minimal"}
                      className="relative h-[238px] w-[238px] drop-shadow-[0_20px_48px_rgba(14,165,233,0.32)]"
                    />
                  </m.div>
                </m.div>
              )}

              {activePhase === 2 && (
                <m.div
                  key="phase-2"
                  className="relative h-full"
                  initial={sceneInitial}
                  animate={{ opacity: 1, y: 0 }}
                  exit={sceneExit}
                  transition={sceneTransition}
                >
                  <m.div className="absolute bottom-2 left-1 h-[190px] w-[190px]">
                    <Mascot
                      variant="small"
                      state="sad"
                      gazeDirection="right"
                      size={220}
                      motionLevel={shouldLoop ? "full" : "minimal"}
                      className="h-full w-full"
                    />
                  </m.div>

                  <m.div
                    className="absolute right-0 top-2 h-[220px] w-[220px]"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 120, damping: 18, duration: 0.95 }
                    }
                  >
                    <div className={shouldLoop ? "not-found-parent-fly-in" : undefined}>
                      <m.div
                        animate={
                          shouldLoop
                            ? {
                                y: [0, -6, 0],
                                rotate: [0, -1.2, 0],
                              }
                            : undefined
                        }
                        transition={
                          shouldLoop
                            ? {
                                duration: 2.1,
                                ease: "easeInOut",
                                repeat: Infinity,
                              }
                            : undefined
                        }
                      >
                        <Mascot
                          variant="big"
                          state="love"
                          gazeDirection="left"
                          size={240}
                          motionLevel={shouldLoop ? "full" : "minimal"}
                          className="h-full w-full"
                        />
                      </m.div>
                    </div>
                  </m.div>
                </m.div>
              )}

              {activePhase === 3 && (
                <m.div
                  key="phase-3"
                  className="relative flex h-full items-center justify-center"
                  initial={sceneInitial}
                  animate={{ opacity: 1, y: 0 }}
                  exit={sceneExit}
                  transition={sceneTransition}
                >
                  <div aria-hidden className="absolute h-60 w-72 rounded-full bg-amber-200/15 blur-[72px]" />
                  <Mascot
                    variant="duo"
                    state="idle"
                    parentState="love"
                    childState="happy"
                    parentGazeDirection="right"
                    childGazeDirection="left"
                    layout="horizontal"
                    size={320}
                    motionLevel={shouldLoop ? "full" : "minimal"}
                    className="relative h-[252px] w-[320px] drop-shadow-[0_22px_52px_rgba(59,130,246,0.32)]"
                  />
                </m.div>
              )}
            </AnimatePresence>

            {activePhase >= 3 && (
              <svg
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[62%] h-[210px] w-[320px] -translate-x-1/2"
                viewBox="0 0 320 210"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <m.path
                  d="M160 18C198 50 224 100 164 178"
                  stroke="#fde047"
                  strokeOpacity="0.6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  animate={shouldLoop ? { strokeDashoffset: [0, -42] } : undefined}
                  transition={
                    shouldLoop
                      ? {
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "linear",
                        }
                      : undefined
                  }
                />
                <path d="M154 172L164 184L174 172" stroke="#fde047" strokeOpacity="0.78" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <m.h1
              key={`headline-${activePhase === 3 ? "found" : "lost"}`}
              className="max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: "easeOut" }}
            >
              {headline}
            </m.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <m.p
              key={`subtext-${activePhase}`}
              className="max-w-[52ch] text-pretty text-base leading-relaxed text-slate-200/92 sm:text-lg"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.34, ease: "easeOut" }}
            >
              {getSubtext(activePhase)}
            </m.p>
          </AnimatePresence>

          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.42, delay: activePhase === 3 ? 0.18 : 0 }}
          >
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 px-7 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.34)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(45,212,191,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
              style={{
                background: "linear-gradient(90deg, #34d399, #22d3ee, #34d399)",
                backgroundSize: "200% 100%",
                animation: shouldLoop ? "notFoundShimmer 2.5s linear infinite" : undefined,
              }}
            >
              {activePhase >= 3 ? "🏠 Về trang chủ cùng Cú Mẹ" : "🏠 Về trang chủ"}
            </Link>
          </m.div>

          <m.button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium text-slate-300/88 underline-offset-4 transition hover:text-slate-100 hover:underline"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.36, delay: 0.08 }}
          >
            ← Quay lại trang trước
          </m.button>
        </section>

        <style jsx>{`
          .not-found-fog {
            position: absolute;
            border-radius: 999px;
            filter: blur(42px);
            pointer-events: none;
            opacity: 0.3;
            animation: notFoundFogDrift linear infinite;
          }

          .not-found-fog-a {
            width: min(56vw, 560px);
            height: min(20vh, 180px);
            top: 12%;
            left: -16%;
            background: radial-gradient(circle, rgba(20, 184, 166, 0.28) 0%, transparent 70%);
            animation-duration: 38s;
          }

          .not-found-fog-b {
            width: min(52vw, 520px);
            height: min(22vh, 190px);
            top: 48%;
            right: -16%;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.24) 0%, transparent 70%);
            animation-duration: 44s;
            animation-delay: 1.2s;
          }

          @keyframes notFoundTwinkle {
            0%,
            100% {
              opacity: 0.35;
              transform: scale(0.78);
            }
            50% {
              opacity: 0.95;
              transform: scale(1.22);
            }
          }

          @keyframes notFoundFootprint {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
          }

          @keyframes notFoundFogDrift {
            0% {
              transform: translate3d(-6%, 0, 0);
            }
            50% {
              transform: translate3d(7%, -2%, 0);
            }
            100% {
              transform: translate3d(-6%, 0, 0);
            }
          }

          @keyframes notFoundFlyIn {
            0% {
              transform: translateX(120px) translateY(-14px) scale(0.95);
            }
            68% {
              transform: translateX(-8px) translateY(2px) scale(1.01);
            }
            100% {
              transform: translateX(0) translateY(0) scale(1);
            }
          }

          .not-found-parent-fly-in {
            animation: notFoundFlyIn 0.95s cubic-bezier(0.22, 1, 0.36, 1);
          }

          @keyframes notFoundShimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
        `}</style>
      </main>
    </LazyMotion>
  );
}
