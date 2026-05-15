"use client";

import { useRouter, useSearchParams } from "next/navigation";

type BlogCategoryFilterProps = {
  basePath: string;
  currentSort: "latest" | "popular";
};

export function BlogCategoryFilter({ basePath, currentSort }: BlogCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onChangeSort = (value: "latest" | "popular") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
      Arrange
      <select
        value={currentSort}
        onChange={(event) => onChangeSort(event.target.value as "latest" | "popular")}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      >
        <option value="latest">Latest</option>
        <option value="popular">Most viewed</option>
      </select>
    </label>
  );
}
