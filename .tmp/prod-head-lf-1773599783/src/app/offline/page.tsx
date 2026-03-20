import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mất kết nối",
};

const CLOUD_GARDEN_SYSTEM_IMAGE = "/images/system/cloud-garden/system_offline_error.png";

export default function OfflinePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] px-4 py-8 text-slate-100 sm:px-6 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(34,211,238,0.2)_0%,transparent_36%),radial-gradient(circle_at_88%_10%,rgba(99,102,241,0.22)_0%,transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.18)_0%,transparent_44%)]"
      />
      <div aria-hidden className="not-found-fog not-found-fog-a" />
      <div aria-hidden className="not-found-fog not-found-fog-b" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-[2rem] border border-white/20 bg-slate-950/72 p-4 shadow-[0_28px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:gap-6 sm:p-8">
        <p className="inline-flex w-fit items-center rounded-full border border-sky-200/35 bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-100/95">
          Mất kết nối mạng
        </p>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/50">
          <Image
            src={CLOUD_GARDEN_SYSTEM_IMAGE}
            alt="Khung cảnh Cloud Garden khi hệ thống tạm thời mất kết nối mạng"
            width={1368}
            height={768}
            priority
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="grid gap-3 text-left">
          <h1 className="max-w-[24ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            Không thể kết nối Internet
          </h1>
          <p className="max-w-[62ch] text-pretty text-sm leading-relaxed text-slate-200/90 sm:text-base">
            Vui lòng kiểm tra Wi-Fi hoặc dữ liệu di động, sau đó thử tải lại. Khi mạng ổn định, hệ thống sẽ tự tiếp tục
            phiên học của bé.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 px-6 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.34)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
            style={{
              background: "linear-gradient(90deg, #34d399, #22d3ee, #34d399)",
              backgroundSize: "200% 100%",
              animation: "notFoundShimmer 2.5s linear infinite",
            }}
          >
            Thử lại ngay
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200/30 bg-slate-900/45 px-6 text-sm font-bold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
          >
            Liên hệ hỗ trợ
          </Link>
        </div>
      </section>
    </main>
  );
}
