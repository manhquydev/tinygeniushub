"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { resolveAppLocale, type AppLocale } from "@/i18n/locales";
import { getCourseFilterLabel, type CourseFilterParams } from "@/lib/courses/course-filter-utils";

interface CourseActiveFiltersProps {
  filters: CourseFilterParams;
}

type FilterChip = { key: string; label: string };

function formatPriceBound(value: number | undefined, locale: AppLocale, suffix: string, fallback: string) {
  if (!value) return fallback;
  return `${value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}${suffix}`;
}

export function CourseActiveFilters({ filters }: CourseActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("courses.catalog");
  const locale = resolveAppLocale(useLocale());

  const chips: FilterChip[] = [];
  if (filters.q) {
    chips.push({ key: "q", label: t("chips.find", { query: filters.q }) });
  }
  if (filters.program) {
    chips.push({ key: "program", label: getCourseFilterLabel("program", filters.program, locale) });
  }
  if (filters.phase) {
    chips.push({ key: "phase", label: getCourseFilterLabel("phase", filters.phase, locale) });
  }
  if (filters.subject) {
    chips.push({ key: "subject", label: getCourseFilterLabel("subject", filters.subject, locale) });
  }
  if (filters.ageGroup) {
    chips.push({ key: "ageGroup", label: getCourseFilterLabel("ageGroup", filters.ageGroup, locale) });
  }
  if (filters.duration) {
    chips.push({ key: "duration", label: getCourseFilterLabel("duration", filters.duration, locale) });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const suffix = t("currencySuffix");
    chips.push({
      key: "price",
      label: t("chips.price", {
        min: formatPriceBound(filters.minPrice, locale, suffix, t("chips.priceMinZero")),
        max: formatPriceBound(filters.maxPrice, locale, suffix, t("chips.priceMaxUnlimited")),
      }),
    });
  }

  if (chips.length === 0) return null;

  function removeFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else if (key === "q") {
      params.delete("q");
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.replace(`/courses?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label={t("chips.ariaLabel")}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeFilter(chip.key)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          aria-label={t("chips.clearAria", { label: chip.label })}
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
