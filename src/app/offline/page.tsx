import type { Metadata } from "next";
import { Mascot } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Mất kết nối | Cùng Con Tự Học",
};

const STAR_FIELD = [
  { top: "8%", left: "12%", size: 2, opacity: 0.7, delay: 0.1, duration: 3.2 },
  { top: "15%", left: "35%", size: 3, opacity: 0.88, delay: 0.7, duration: 2.7 },
  { top: "22%", left: "71%", size: 2, opacity: 0.65, delay: 1.3, duration: 3.5 },
  { top: "31%", left: "87%", size: 3, opacity: 0.9, delay: 0.4, duration: 2.9 },
  { top: "44%", left: "19%", size: 2, opacity: 0.73, delay: 1.8, duration: 3.7 },
  { top: "52%", left: "53%", size: 3, opacity: 0.83, delay: 0.6, duration: 2.8 },
  { top: "61%", left: "78%", size: 2, opacity: 0.64, delay: 2.2, duration: 3.3 },
  { top: "74%", left: "26%", size: 2, opacity: 0.76, delay: 1.6, duration: 3.1 },
  { top: "85%", left: "47%", size: 3, opacity: 0.88, delay: 0.9, duration: 2.6 },
  { top: "91%", left: "65%", size: 2, opacity: 0.6, delay: 1.4, duration: 3.8 },
] as const;

export default function OfflinePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(20,184,166,0.28)_0%,transparent_36%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.2)_0%,transparent_34%),radial-gradient(circle_at_50%_92%,rgba(99,102,241,0.28)_0%,transparent_44%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[12%] top-[8%] h-20 w-20 rounded-full bg-white/90 blur-[2px]"
        style={{ boxShadow: "0 0 60px 20px rgba(253,224,71,0.22)" }}
      />
      <div aria-hidden className="not-found-fog not-found-fog-a" />
      <div aria-hidden className="not-found-fog not-found-fog-b" />

      {STAR_FIELD.map((star, index) => (
        <span
          key={`offline-star-${index}`}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            boxShadow: "0 0 14px rgba(248,250,252,0.8)",
            animation: `notFoundTwinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <Mascot
          variant="small"
          state="thinking"
          gazeDirection="center"
          size={200}
          motionLevel="full"
          className="drop-shadow-[0_20px_48px_rgba(14,165,233,0.28)]"
        />
        <h1 className="max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
          Không có kết nối mạng...
        </h1>
        <p className="max-w-[44ch] text-pretty text-base leading-relaxed text-slate-200/90 sm:text-lg">
          Cú Con không thể kết nối lúc này. Kiểm tra Wi-Fi hoặc 4G rồi thử lại nhé!
        </p>
        <a
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-sm font-black text-white shadow-[0_16px_32px_rgba(20,184,166,0.3)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
        >
          Thử lại
        </a>
      </section>
    </main>
  );
}
