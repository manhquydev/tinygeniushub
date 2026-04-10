"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  AGE_GROUP_LABELS,
  DURATION_LABELS,
  PHASE_LABELS,
  PROGRAM_LABELS,
  SUBJECT_LABELS,
  type CourseFilterParams,
} from "@/lib/courses/course-filter-utils";

interface CourseActiveFiltersProps {
  filters: CourseFilterParams;
}

type FilterChip = { key: string; label: string };

function buildChips(filters: CourseFilterParams): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.q) {
    chips.push({ key: "q", label: `Tìm: ${filters.q}` });
  }

  if (filters.program && PROGRAM_LABELS[filters.program]) {
    chips.push({ key: "program", label: PROGRAM_LABELS[filters.program] });
  }

  if (filters.phase && PHASE_LABELS[filters.phase]) {
    chips.push({ key: "phase", label: PHASE_LABELS[filters.phase] });
  }

  if (filters.subject && SUBJECT_LABELS[filters.subject]) {
    chips.push({ key: "subject", label: SUBJECT_LABELS[filters.subject] });
  }

  if (filters.ageGroup && AGE_GROUP_LABELS[filters.ageGroup]) {
    chips.push({ key: "ageGroup", label: AGE_GROUP_LABELS[filters.ageGroup] });
  }

  if (filters.duration && DURATION_LABELS[filters.duration]) {
    chips.push({ key: "duration", label: DURATION_LABELS[filters.duration] });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice ? `${filters.minPrice.toLocaleString("vi-VN")}đ` : "0";
    const max = filters.maxPrice ? `${filters.maxPrice.toLocaleString("vi-VN")}đ` : "∞";
    chips.push({ key: "price", label: `Giá: ${min} – ${max}` });
  }

  return chips;
}

export function CourseActiveFilters({ filters }: CourseActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const chips = buildChips(filters);
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
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Bộ lọc đang áp dụng">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeFilter(chip.key)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          aria-label={`Xóa bộ lọc ${chip.label}`}
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
