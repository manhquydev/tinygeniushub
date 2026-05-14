import Link from "next/link";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { AuthSplitShell } from "@/components/auth-split-shell";
import { MascotEcosystemShowcase } from "@/components/mascot-ecosystem-showcase";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

interface AuthIndexPageProps {
  searchParams?:
    | Promise<{ next?: string | string[]; intent?: string | string[] }>
    | { next?: string | string[]; intent?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function AuthIndexPage({ searchParams }: AuthIndexPageProps) {
  const hourOfDay = new Date().getHours();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = sanitizeNextPath(readSingleParam(resolvedSearchParams?.next));
  const intent = readSingleParam(resolvedSearchParams?.intent);
  const isCheckoutIntent = intent === "checkout";
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  const signInHref = `/auth/login${nextQuery}`;
  const signUpHref = `/auth/signup${nextQuery}`;
  const forgotPasswordHref = nextPath
    ? `/auth/forgot-password?next=${encodeURIComponent(nextPath)}`
    : "/auth/forgot-password";

  return (
    <AuthSplitShell
      badge={isCheckoutIntent ? translate("auth.index.badgeCheckout", undefined, locale) : translate("auth.index.badge", undefined, locale)}
      title={isCheckoutIntent ? translate("auth.index.titleCheckout", undefined, locale) : translate("auth.index.title", undefined, locale)}
      description={isCheckoutIntent ? translate("auth.index.descriptionCheckout", undefined, locale) : translate("auth.index.description", undefined, locale)}
    >
      <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_52px_rgba(15,23,42,0.1)] sm:p-8">
        <div className="grid gap-2">
          <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">
            {isCheckoutIntent ? translate("auth.index.headingCheckout", undefined, locale) : translate("auth.index.heading", undefined, locale)}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {isCheckoutIntent ? translate("auth.index.bodyTextCheckout", undefined, locale) : translate("auth.index.bodyText", undefined, locale)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={signInHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-sm font-bold text-white shadow-[0_16px_30px_rgba(5,150,105,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(5,150,105,0.35)]"
          >
            {translate("auth.index.loginButton", undefined, locale)}
          </Link>
          <Link
            href={signUpHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50/60 px-5 text-sm font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100/70"
          >
            {translate("auth.index.signupButton", undefined, locale)}
          </Link>
        </div>
        <p className="text-center text-sm text-slate-600">
          {translate("auth.index.forgotPasswordLabel", undefined, locale)}{" "}
          <Link href={forgotPasswordHref} className="font-semibold text-emerald-700 hover:text-emerald-800">
            {translate("auth.index.forgotPasswordLink", undefined, locale)}
          </Link>
        </p>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
          <MascotEcosystemShowcase
            compact
            title={translate("mascot.ecosystemShowcase.title", undefined, locale)}
            description={translate("mascot.ecosystemShowcase.description", undefined, locale)}
            context={{
              surface: "auth-entry",
              hourOfDay,
            }}
          />
        </div>
      </div>
    </AuthSplitShell>
  );
}
