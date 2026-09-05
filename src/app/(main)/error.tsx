"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("specialPages.error");
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error("[MainError]", error.digest, error);
  }, [error]);

  return (
    <section className="relative isolate mx-auto flex min-h-[72vh] w-full max-w-5xl flex-col gap-5 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-50 p-4 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.13)] sm:gap-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.2)_0%,transparent_35%),radial-gradient(circle_at_88%_10%,rgba(251,146,60,0.15)_0%,transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.18)_0%,transparent_44%)]"
      />

      <p className="relative z-10 inline-flex w-fit items-center rounded-full border border-amber-300/65 bg-amber-100/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
        {t("badge")}
      </p>

      <div className="relative z-10 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/75">
        <Image
          src="/images/system/cloud-garden/system_500_error.png"
          alt={t("imageAlt")}
          width={1368}
          height={768}
          priority
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="relative z-10 grid gap-3 text-left">
        <h1 className="max-w-[24ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-[62ch] text-pretty text-sm leading-relaxed text-slate-700 sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-500 px-6 text-sm font-bold text-white shadow-[0_14px_28px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          {t("ctaRetry")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          {t("ctaBack")}
        </button>
      </div>

      {isDevelopment && error.digest ? (
        <p className="relative z-10 text-xs italic text-slate-500">digest: {error.digest}</p>
      ) : null}
    </section>
  );
}
