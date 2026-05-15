import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("specialPages.sessionExpired.metadata.title", undefined, locale),
  };
}

const CLOUD_GARDEN_SYSTEM_IMAGE = "/images/system/cloud-garden/system_offline_error.png";

interface SessionExpiredPageProps {
  searchParams?:
    | Promise<{ next?: string | string[] }>
    | { next?: string | string[] };
}

function resolveNextPath(searchParams: { next?: string | string[] } | undefined) {
  const raw = searchParams?.next;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

export default async function SessionExpiredPage({ searchParams }: SessionExpiredPageProps) {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = sanitizeNextPath(resolveNextPath(resolvedSearchParams));
  const loginHref = nextPath ? `/auth/login?next=${encodeURIComponent(nextPath)}` : "/auth/login";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] px-4 py-8 text-slate-100 sm:px-6 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(34,211,238,0.2)_0%,transparent_36%),radial-gradient(circle_at_88%_10%,rgba(99,102,241,0.22)_0%,transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.18)_0%,transparent_44%)]"
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
          <p className="inline-flex items-center rounded-full border border-sky-200/35 bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-100/95">
            {translate("specialPages.sessionExpired.badge", undefined, locale)}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/50">
          <Image
            src={CLOUD_GARDEN_SYSTEM_IMAGE}
            alt={translate("specialPages.sessionExpired.imageAlt", undefined, locale)}
            width={1368}
            height={768}
            priority
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="grid gap-3 text-left">
          <h1 className="max-w-[24ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            {translate("specialPages.sessionExpired.title", undefined, locale)}
          </h1>
          <p className="max-w-[62ch] text-pretty text-sm leading-relaxed text-slate-200/90 sm:text-base">
            {translate("specialPages.sessionExpired.subtitle", undefined, locale)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href={loginHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 px-6 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.34)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
            style={{
              background: "linear-gradient(90deg, #34d399, #22d3ee, #34d399)",
              backgroundSize: "200% 100%",
              animation: "notFoundShimmer 2.5s linear infinite",
            }}
          >
            {translate("specialPages.sessionExpired.ctaLogin", undefined, locale)}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200/30 bg-slate-900/45 px-6 text-sm font-bold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
          >
            {translate("specialPages.sessionExpired.ctaHome", undefined, locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
