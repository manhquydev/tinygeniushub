import { getLocale } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";

const FAQ_KEYS = ["background", "sitWithChild", "lessonLength", "learnImmediately", "refund"] as const;

export async function CourseDetailFaq() {
  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`courses.detail.faq.${key}`, undefined, locale);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">{t("heading")}</h2>
      <div className="mt-4 grid gap-2">
        {FAQ_KEYS.map((key) => (
          <details key={key} className="group rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800 marker:hidden [&::-webkit-details-marker]:hidden">
              {t(`${key}.q`)}
            </summary>
            <p className="px-4 pb-3 text-sm leading-relaxed text-slate-600">{t(`${key}.a`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
