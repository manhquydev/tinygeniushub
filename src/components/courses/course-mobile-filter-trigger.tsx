"use client";

import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CourseFilterSidebar } from "./course-filter-sidebar";
import type { CourseFilterParams } from "@/lib/courses/course-filter-utils";

interface Props {
  currentFilters: CourseFilterParams;
  activeFilterCount: number;
  availableProgramKeys: string[];
  availablePhaseKeys: string[];
  availableSubjectKeys: string[];
  availableAgeGroupKeys: string[];
}

function buildFilterKey(filters: CourseFilterParams) {
  return [
    filters.q ?? "",
    filters.program ?? "",
    filters.phase ?? "",
    filters.subject ?? "",
    filters.ageGroup ?? "",
    filters.duration ?? "",
    filters.minPrice ?? "",
    filters.maxPrice ?? "",
  ].join("|");
}

export function CourseMobileFilterTrigger({
  currentFilters,
  activeFilterCount,
  availableProgramKeys,
  availablePhaseKeys,
  availableSubjectKeys,
  availableAgeGroupKeys,
}: Props) {
  const t = useTranslations("courses.catalog.filter");

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            <Filter className="h-3.5 w-3.5" />
            {t("mobileTrigger")}
            {activeFilterCount > 0 ? (
              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("mobileTitle")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <CourseFilterSidebar
              key={`mobile-${buildFilterKey(currentFilters)}`}
              currentFilters={currentFilters}
              availableProgramKeys={availableProgramKeys}
              availablePhaseKeys={availablePhaseKeys}
              availableSubjectKeys={availableSubjectKeys}
              availableAgeGroupKeys={availableAgeGroupKeys}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
