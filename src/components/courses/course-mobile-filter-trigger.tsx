"use client";

import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CourseFilterSidebar } from "./course-filter-sidebar";
import type { CourseFilterParams } from "@/lib/courses/course-filter-utils";

interface Props {
  currentFilters: CourseFilterParams;
  activeFilterCount: number;
}

export function CourseMobileFilterTrigger({ currentFilters, activeFilterCount }: Props) {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400">
            <Filter className="h-3.5 w-3.5" />
            Bộ lọc
            {activeFilterCount > 0 ? (
              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bộ lọc khóa học</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <CourseFilterSidebar currentFilters={currentFilters} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
