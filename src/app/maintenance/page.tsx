import type { Metadata } from "next";
import { Mascot } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Bảo trì",
};

const STAR_FIELD = [
  { top: "9%", left: "11%", size: 2, opacity: 0.7, delay: 0.1, duration: 3.1 },
  { top: "14%", left: "28%", size: 3, opacity: 0.88, delay: 0.8, duration: 2.7 },
  { top: "20%", left: "72%", size: 2, opacity: 0.66, delay: 1.2, duration: 3.4 },
  { top: "27%", left: "86%", size: 3, opacity: 0.9, delay: 0.4, duration: 2.9 },
  { top: "38%", left: "16%", size: 2, opacity: 0.74, delay: 1.7, duration: 3.6 },
  { top: "46%", left: "54%", size: 3, opacity: 0.84, delay: 0.6, duration: 2.8 },
  { top: "59%", left: "78%", size: 2, opacity: 0.64, delay: 2, duration: 3.2 },
  { top: "66%", left: "14%", size: 2, opacity: 0.78, delay: 1.9, duration: 3.3 },
  { top: "74%", left: "46%", size: 3, opacity: 0.88, delay: 0.5, duration: 2.8 },
  { top: "88%", left: "24%", size: 2, opacity: 0.6, delay: 1.3, duration: 3.7 },
] as const;

export default function MaintenancePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(20,184,166,0.3)_0%,transparent_36%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.24)_0%,transparent_34%),radial-gradient(circle_at_50%_92%,rgba(99,102,241,0.32)_0%,transparent_44%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[12%] top-[8%] h-20 w-20 rounded-full bg-white/90 blur-[2px] animate-pulse"
        style={{ boxShadow: "0 0 60px 20px rgba(253,224,71,0.25)" }}
      />
      <div aria-hidden className="not-found-fog not-found-fog-a" />
      <div aria-hidden className="not-found-fog not-found-fog-b" />

      {STAR_FIELD.map((star, index) => (
        <span
          key={`maintenance-star-${index}`}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            boxShadow: "0 0 16px rgba(248,250,252,0.8)",
            animation: `notFoundTwinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <Mascot
          variant="duo"
          state="playful"
          parentState="playful"
          childState="playful"
          parentGazeDirection="right"
          childGazeDirection="left"
          layout="horizontal"
          size={310}
          motionLevel="full"
          className="drop-shadow-[0_20px_48px_rgba(14,165,233,0.3)]"
        />

        <h1 className="max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
          Đang nâng cấp hệ thống
        </h1>
        <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-slate-200/92 sm:text-lg">
          Cú Mẹ và Cú Con đang sửa nhà. Quay lại sau nhé!
        </p>

        <div className="flex items-center gap-2" aria-label="Đang tải">
          {[0, 0.22, 0.44].map((delay) => (
            <span
              key={`maintenance-dot-${delay}`}
              className="h-2.5 w-2.5 rounded-full bg-cyan-200"
              style={{ animation: `notFoundTwinkle 1.2s ease-in-out ${delay}s infinite` }}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://facebook.com/cungcontuhoc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/25 bg-slate-900/45 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-900/65"
          >
            <svg aria-hidden className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12.073h2.54V9.86c0-2.508 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12.073h2.773l-.443 2.89h-2.33v6.988C20.343 21.201 24 17.064 24 12.073z" />
            </svg>
            Facebook
          </a>
          <a
            href="https://zalo.me/cungcontuhoc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-sky-200/30 bg-sky-900/40 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-900/60"
          >
            <svg aria-hidden className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.226 17.617l-.008.024-.014.024a1.17 1.17 0 01-.232.296l-.022.018-.025.015-.033.016h-.002l-.023.007-.027.006a.998.998 0 01-.242.029h-.005a1 1 0 01-.465-.114l-2.286-1.243a10.15 10.15 0 01-3.973-3.975l-1.243-2.286a1 1 0 01.672-1.449h.002l.024-.003.027-.001.024.001h.003l.025.004.024.006.023.008.022.01.021.011.02.013.019.015.018.016.016.018.015.02.013.02.008.016.009.025.006.022.004.024.001.024v.005c0 .088-.018.174-.053.254l-.538 1.28.538-1.28z" />
            </svg>
            Zalo
          </a>
        </div>
      </section>
    </main>
  );
}
