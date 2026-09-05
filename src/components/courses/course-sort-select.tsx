"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveAppLocale } from "@/i18n/locales";
import { SORT_VALUES, getCourseFilterLabel } from "@/lib/courses/course-filter-utils";

interface CourseSortSelectProps {
  currentSort?: string;
}

export function CourseSortSelect({ currentSort }: CourseSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("courses.catalog.sort");
  const locale = resolveAppLocale(useLocale());

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.replace(`/courses?${params.toString()}`, { scroll: false });
  }

  return (
    <select
      value={currentSort ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      aria-label={t("ariaLabel")}
    >
      <option value="">{t("default")}</option>
      {SORT_VALUES.map((value) => (
        <option key={value} value={value}>
          {getCourseFilterLabel("sort", value, locale)}
        </option>
      ))}
    </select>
  );
}
