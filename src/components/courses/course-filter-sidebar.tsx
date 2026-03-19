"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AGE_GROUP_LABELS,
  DURATION_LABELS,
  SUBJECT_LABELS,
  type CourseFilterParams,
} from "@/lib/courses/course-filter-utils";

interface CourseFilterSidebarProps {
  currentFilters: CourseFilterParams;
}

const SUBJECT_KEYS = Object.keys(SUBJECT_LABELS);
const AGE_GROUP_KEYS = Object.keys(AGE_GROUP_LABELS).filter((k) => k !== "ALL_AGES");
const DURATION_KEYS = Object.keys(DURATION_LABELS) as Array<keyof typeof DURATION_LABELS>;

export function CourseFilterSidebar({ currentFilters }: CourseFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice?.toString() ?? "");
  const priceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.replace(`/courses?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
      if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
      params.delete("page");
      router.replace(`/courses?${params.toString()}`, { scroll: false });
    }, 300);
    return () => { if (priceTimerRef.current) clearTimeout(priceTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["subject", "ageGroup", "minPrice", "maxPrice", "duration", "page"].forEach((k) => params.delete(k));
    router.replace(`/courses?${params.toString()}`, { scroll: false });
    setMinPrice("");
    setMaxPrice("");
  };

  const hasFilters = currentFilters.subject || currentFilters.ageGroup || currentFilters.minPrice || currentFilters.maxPrice || currentFilters.duration;

  return (
    <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-slate-900">Bộ lọc</p>
        {hasFilters ? (
          <button onClick={clearAll} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">
            Xóa tất cả
          </button>
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Môn học</p>
        {SUBJECT_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={currentFilters.subject === key}
              onChange={() => updateParam("subject", currentFilters.subject === key ? null : key)}
              className="rounded border-slate-300 text-emerald-600"
            />
            {SUBJECT_LABELS[key]}
          </label>
        ))}
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Độ tuổi</p>
        {AGE_GROUP_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="ageGroup"
              checked={currentFilters.ageGroup === key}
              onChange={() => updateParam("ageGroup", key)}
              className="border-slate-300 text-emerald-600"
            />
            {AGE_GROUP_LABELS[key]}
          </label>
        ))}
        {currentFilters.ageGroup ? (
          <button onClick={() => updateParam("ageGroup", null)} className="text-left text-xs text-slate-400 hover:text-slate-600">
            Bỏ chọn
          </button>
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Giá (VND)</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Tối thiểu"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="number"
            placeholder="Tối đa"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Thời lượng</p>
        <div className="flex flex-wrap gap-2">
          {DURATION_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => updateParam("duration", currentFilters.duration === key ? null : key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                currentFilters.duration === key
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              {DURATION_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
