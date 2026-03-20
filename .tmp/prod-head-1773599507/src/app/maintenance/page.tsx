import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảo trì hệ thống",
};

export default function MaintenancePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] px-4 py-8 text-slate-100 sm:px-6 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.24)_0%,transparent_35%),radial-gradient(circle_at_88%_10%,rgba(34,197,94,0.18)_0%,transparent_34%),radial-gradient(circle_at_50%_100%,rgba(30,64,175,0.28)_0%,transparent_44%)]"
      />
      <div aria-hidden className="not-found-fog not-found-fog-a" />
      <div aria-hidden className="not-found-fog not-found-fog-b" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-[2rem] border border-white/20 bg-slate-950/72 p-4 shadow-[0_28px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:gap-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logos/tinygeniushub_logo_horizon.png"
            alt="TinyGeniusHub"
            width={220}
            height={64}
            priority
            className="h-8 w-auto object-contain sm:h-9"
          />
          <p className="inline-flex items-center rounded-full border border-cyan-200/35 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/95">
            Bảo trì hệ thống
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/50">
          <Image
            src="/images/system/cloud-garden/system_loading_hero.png"
            alt="Linh vật Cáo đang chạy trên đường cầu vồng trong quá trình nâng cấp hệ thống"
            width={1368}
            height={768}
            priority
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="grid gap-3 text-left">
          <h1 className="max-w-[24ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            Hệ thống đang được nâng cấp
          </h1>
          <p className="max-w-[62ch] text-pretty text-sm leading-relaxed text-slate-200/90 sm:text-base">
            Chúng tôi đang cập nhật nền tảng để phụ huynh và bé có trải nghiệm ổn định hơn. Vui lòng quay lại sau ít phút.
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
            Kiểm tra lại trang chủ
          </Link>
          <a
            href="https://zalo.me/cungcontuhoc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200/30 bg-slate-900/45 px-6 text-sm font-bold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </section>
    </main>
  );
}

