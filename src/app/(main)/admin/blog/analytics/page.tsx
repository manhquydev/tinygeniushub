"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type RangeValue = "7d" | "30d" | "90d";

type AnalyticsPayload = {
  totalViews: number;
  totalLikes: number;
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
  const t = useTranslations("admin.blog.analytics");
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
        setError(t("errorLoadFailed"));
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
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-[var(--admin-text-primary)]">{t("title")}</h1>
            <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  range === value ? "bg-blue-500 text-white" : "bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]"
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
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)]" />
          ))}
        </section>
      ) : null}

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}

      {!loading && data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]">{t("statTotalViews")}</p>
              <p className="mt-2 text-3xl font-black text-[var(--admin-text-primary)]">{data.totalViews.toLocaleString()}</p>
            </article>
            <article className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]">{t("statTotalLikes")}</p>
              <p className="mt-2 text-3xl font-black text-[var(--admin-text-primary)]">{data.totalLikes.toLocaleString()}</p>
            </article>
            <article className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]">{t("statPublished")}</p>
              <p className="mt-2 text-3xl font-black text-[var(--admin-text-primary)]">{data.totalPublishedPosts.toLocaleString()}</p>
            </article>
          </section>

          <section className="overflow-hidden rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--admin-sidebar-accent)] text-xs uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">{t("colPost")}</th>
                    <th className="px-4 py-3">{t("colView")}</th>
                    <th className="px-4 py-3">{t("colLikes")}</th>
                    <th className="px-4 py-3">{t("colReadingTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPosts.map((post, index) => (
                    <tr key={post.slug} className="border-t border-[var(--admin-card-border)]">
                      <td className="px-4 py-3 font-semibold text-[var(--admin-text-secondary)]">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-[var(--admin-text-primary)] hover:text-teal-700">
                          {post.titleVi}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{post.viewCount.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{post.likeCount.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{t("readingTimeMin", { min: post.readingTimeMin })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
              <h2 className="text-xl font-black text-[var(--admin-text-primary)]">{t("viewsByDay")}</h2>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, marginTop: 16 }}>
                {data.viewsByDay.map((day) => {
                  const height = maxDailyViews > 0 ? (day._count.id / maxDailyViews) * 100 : 0;
                  return (
                    <div
                      key={day.readAt}
                      title={`${formatDate(day.readAt)}: ${day._count.id}`}
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

            <article className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
              <h2 className="text-xl font-black text-[var(--admin-text-primary)]">{t("viewsPerCategory")}</h2>
              <div className="mt-4 grid gap-3">
                {data.categoryBreakdown.map((category) => {
                  const width = maxCategoryViews > 0 ? (category.views / maxCategoryViews) * 100 : 0;
                  return (
                    <div key={category.categoryId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[var(--admin-text-secondary)]">{category.categoryName}</span>
                        <span className="text-[var(--admin-text-muted)]">{category.views.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded bg-[var(--admin-sidebar-accent)]">
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
