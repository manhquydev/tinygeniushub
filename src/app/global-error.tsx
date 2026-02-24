"use client";

import { useEffect } from "react";
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Mascot } from "@/components/mascot";

const STAR_FIELD = [
  { top: "8%", left: "10%", size: 2, opacity: 0.7, delay: 0.1, duration: 3.1 },
  { top: "14%", left: "30%", size: 3, opacity: 0.86, delay: 0.8, duration: 2.7 },
  { top: "18%", left: "74%", size: 2, opacity: 0.65, delay: 1.2, duration: 3.5 },
  { top: "24%", left: "88%", size: 3, opacity: 0.9, delay: 0.4, duration: 2.9 },
  { top: "37%", left: "18%", size: 2, opacity: 0.72, delay: 1.6, duration: 3.6 },
  { top: "42%", left: "56%", size: 3, opacity: 0.83, delay: 0.7, duration: 2.8 },
  { top: "55%", left: "80%", size: 2, opacity: 0.64, delay: 2.1, duration: 3.2 },
  { top: "63%", left: "12%", size: 2, opacity: 0.76, delay: 1.9, duration: 3.3 },
  { top: "70%", left: "48%", size: 3, opacity: 0.88, delay: 0.5, duration: 2.8 },
  { top: "86%", left: "24%", size: 2, opacity: 0.6, delay: 1.4, duration: 3.7 },
] as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const shouldLoop = !prefersReducedMotion;

  useEffect(() => {
    console.error("[GlobalError]", error.digest, error);
  }, [error]);

  const handleReload = () => {
    reset();
    window.location.reload();
  };

  return (
    <html lang="vi">
      <body>
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
                key={`global-error-star-${index}`}
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

            <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
              <Mascot
                variant="big"
                state="sad"
                gazeDirection="center"
                size={230}
                motionLevel={prefersReducedMotion ? "minimal" : "full"}
                className="drop-shadow-[0_20px_48px_rgba(14,165,233,0.28)]"
              />

              <h1 className="max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
                Ôi! Có sự cố kỹ thuật rồi...
              </h1>
              <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-slate-200/92 sm:text-lg">
                Nhóm kỹ thuật đã được thông báo. Vui lòng thử lại sau ít phút.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReload}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 px-6 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.34)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
                  style={{
                    background: "linear-gradient(90deg, #34d399, #22d3ee, #34d399)",
                    backgroundSize: "200% 100%",
                    animation: shouldLoop ? "notFoundShimmer 2.5s linear infinite" : undefined,
                  }}
                >
                  Tải lại trang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200/30 bg-slate-900/45 px-6 text-sm font-bold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
                >
                  Về trang chủ
                </button>
              </div>
            </section>
          </main>
        </LazyMotion>
      </body>
    </html>
  );
}
