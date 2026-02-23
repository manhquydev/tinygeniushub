import Link from "next/link";
import { Mascot } from "@/components/mascot";

const STAR_FIELD = [
  { top: "8%", left: "10%", size: 2, opacity: 0.74 },
  { top: "16%", left: "72%", size: 3, opacity: 0.88 },
  { top: "22%", left: "38%", size: 2, opacity: 0.64 },
  { top: "30%", left: "87%", size: 2, opacity: 0.72 },
  { top: "36%", left: "14%", size: 3, opacity: 0.82 },
  { top: "45%", left: "58%", size: 2, opacity: 0.62 },
  { top: "54%", left: "28%", size: 2, opacity: 0.7 },
  { top: "62%", left: "78%", size: 3, opacity: 0.85 },
  { top: "70%", left: "8%", size: 2, opacity: 0.68 },
  { top: "74%", left: "46%", size: 3, opacity: 0.9 },
  { top: "81%", left: "66%", size: 2, opacity: 0.58 },
  { top: "86%", left: "18%", size: 2, opacity: 0.73 },
  { top: "90%", left: "84%", size: 3, opacity: 0.8 },
] as const;

export default function NotFound() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.28)_0%,transparent_35%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.18)_0%,transparent_32%),radial-gradient(circle_at_50%_84%,rgba(59,130,246,0.22)_0%,transparent_40%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 top-[12%] h-72 w-72 rounded-full bg-cyan-500/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-[16%] h-80 w-80 rounded-full bg-blue-500/20 blur-[130px]"
      />

      {STAR_FIELD.map((star, index) => (
        <span
          key={`${star.top}-${star.left}-${index}`}
          aria-hidden
          className="pointer-events-none absolute animate-pulse rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            boxShadow: "0 0 14px rgba(248,250,252,0.78)",
          }}
        />
      ))}

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 py-14 text-center sm:gap-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-200/90 sm:text-sm">Error 404</p>

        <div className="relative my-2 grid place-items-center">
          <div aria-hidden className="absolute h-[340px] w-[340px] rounded-full bg-cyan-300/30 blur-[100px]" />
          <div aria-hidden className="absolute h-[286px] w-[286px] rounded-full border border-cyan-100/35" />
          <Mascot
            variant="small"
            state="sad"
            actionProp="space"
            size={280}
            className="relative h-[250px] w-[250px] drop-shadow-[0_24px_52px_rgba(34,211,238,0.34)] sm:h-[280px] sm:w-[280px]"
            motionLevel="full"
            pauseWhenOffscreen
          />
        </div>

        <h1 className="max-w-[19ch] text-balance text-4xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
          Ôi không, bé vừa lạc vào hố đen vũ trụ.
        </h1>
        <p className="max-w-[58ch] text-pretty text-base leading-relaxed text-slate-200/92 sm:text-lg">
          Tín hiệu định vị không còn khả dụng cho đường dẫn này. Hãy quay về trung tâm điều khiển để tiếp tục hành trình học tập an toàn.
        </p>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-7 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.36)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_40px_rgba(45,212,191,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:translate-y-0"
        >
          Về trang chủ
        </Link>
      </section>
    </main>
  );
}
