import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
  firstChildId: string | null;
};

export function DashboardShortcutsSection({ firstChildId }: Props) {
  const t = useTranslations("parent.dashboard.shortcuts");
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">{t("heading")}</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/parent/children"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(13,148,136,0.3)] transition hover:-translate-y-0.5"
        >
          {t("manageChildren")}
        </Link>
        <Link
          href={firstChildId ? `/kid/courses?childId=${encodeURIComponent(firstChildId)}` : "/kid/courses"}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
        >
          {t("enterKidApp")}
        </Link>
        <Link
          href="/parent/courses"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
        >
          {t("premiumCourses")}
        </Link>
        <Link
          href="/parent/reports"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
        >
          {t("weeklyReports")}
        </Link>
        <Link
          href="/gift-code"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
        >
          {t("enterGiftCode")}
        </Link>
      </div>
    </section>
  );
}
