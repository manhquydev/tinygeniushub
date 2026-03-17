"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RangeValue = "7d" | "30d" | "90d";

type AnalyticsPayload = {
  totalViews: number;
  totalLikes: number;
  totalSubscribers: number;
  totalPublishedPosts: number;
  topPosts: Array<{
    titleVi: string;
    slug: string;
    viewCount: number;
    likeCount: number;
    readingTimeMin: number;
  }>;
  viewsByDay: Array<{
    readAt: string;
    _count: {
      id: number;
    };
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    views: number;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminBlogAnalyticsPage() {
  const [range, setRange] = useState<RangeValue>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/blog/analytics?range=${range}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("ANALYTICS_LOAD_FAILED");
        }

        const payload = (await response.json()) as AnalyticsPayload;
        setData(payload);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError("Không thể tải dữ liệu phân tích blog.");
      } finally {
        setLoading(false);
      }
    }

    void loadAnalytics();

    return () => {
      controller.abort();
    };
  }, [range]);

  const maxDailyViews = useMemo(() => {
    if (!data || data.viewsByDay.length === 0) {
      return 0;
    }
    return Math.max(...data.viewsByDay.map((day) => day._count.id));
  }, [data]);

  const maxCategoryViews = useMemo(() => {
    if (!data || data.categoryBreakdown.length === 0) {
      return 0;
    }
    return Math.max(...data.categoryBreakdown.map((category) => category.views));
  }, [data]);

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="section-header">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Phân tích blog</h1>
            <p className="mt-2 text-sm text-slate-600">Theo dõi tăng trưởng lượt xem, tương tác và người đăng ký.</p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  range === value ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </section>
      ) : null}

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}

      {!loading && data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tổng lượt xem</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{data.totalViews.toLocaleString("vi-VN")}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tổng lượt thích</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{data.totalLikes.toLocaleString("vi-VN")}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Người đăng ký đang hoạt động</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{data.totalSubscribers.toLocaleString("vi-VN")}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bài đã xuất bản</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{data.totalPublishedPosts.toLocaleString("vi-VN")}</p>
            </article>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Bài viết</th>
                    <th className="px-4 py-3">Lượt xem</th>
                    <th className="px-4 py-3">Lượt thích</th>
                    <th className="px-4 py-3">Thời gian đọc</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPosts.map((post, index) => (
                    <tr key={post.slug} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-700">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:text-teal-700">
                          {post.titleVi}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{post.viewCount.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3 text-slate-700">{post.likeCount.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3 text-slate-700">{post.readingTimeMin} phút</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Lượt xem theo ngày</h2>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, marginTop: 16 }}>
                {data.viewsByDay.map((day) => {
                  const height = maxDailyViews > 0 ? (day._count.id / maxDailyViews) * 100 : 0;
                  return (
                    <div
                      key={day.readAt}
                      title={`${formatDate(day.readAt)}: ${day._count.id} lượt xem`}
                      style={{
                        flex: 1,
                        height: `${height}%`,
                        minHeight: 2,
                        background: "#3b82f6",
                        borderRadius: 2,
                      }}
                    />
                  );
                })}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Phân bổ theo danh mục</h2>
              <div className="mt-4 grid gap-3">
                {data.categoryBreakdown.map((category) => {
                  const width = maxCategoryViews > 0 ? (category.views / maxCategoryViews) * 100 : 0;
                  return (
                    <div key={category.categoryId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{category.categoryName}</span>
                        <span className="text-slate-500">{category.views.toLocaleString("vi-VN")} lượt xem</span>
                      </div>
                      <div className="h-2 rounded bg-slate-100">
                        <div
                          style={{ width: `${width}%`, background: "#0ea5e9", height: "100%", borderRadius: 999 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
