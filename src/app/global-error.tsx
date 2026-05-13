"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] px-4 py-8 text-slate-100 sm:px-6 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.24)_0%,transparent_35%),radial-gradient(circle_at_88%_10%,rgba(234,88,12,0.18)_0%,transparent_34%),radial-gradient(circle_at_50%_100%,rgba(30,64,175,0.28)_0%,transparent_44%)]"
          />
          <div aria-hidden className="not-found-fog not-found-fog-a" />
          <div aria-hidden className="not-found-fog not-found-fog-b" />

          <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-[2rem] border border-white/20 bg-slate-950/72 p-4 shadow-[0_28px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:gap-6 sm:p-8">
            <p className="inline-flex w-fit items-center rounded-full border border-amber-200/35 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-100/95">
              System error 500
            </p>

            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/50">
              <Image
                src="/images/system/cloud-garden/system_500_error.png"
                alt="Fox mascot is fixing system errors in the machine shop"
                width={1368}
                height={768}
                priority
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="grid gap-3 text-left">
              <h1 className="max-w-[24ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
                The system is experiencing a temporary problem
              </h1>
              <p className="max-w-[62ch] text-pretty text-sm leading-relaxed text-slate-200/90 sm:text-base">
                We have noted the error and are working on it. You can reload the page or return to the home page to continue.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleReload}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 px-6 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.34)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
                style={{
                  background: "linear-gradient(90deg, #34d399, #22d3ee, #34d399)",
                  backgroundSize: "200% 100%",
                  animation: "notFoundShimmer 2.5s linear infinite",
                }}
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200/30 bg-slate-900/45 px-6 text-sm font-bold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
              >
                Return to home page
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}

