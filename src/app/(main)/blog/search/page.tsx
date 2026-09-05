"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BlogPostCardDTO } from "@/modules/blog/blog-types";

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightQuery(text: string, query: string): string {
  const escapedText = escapeHtml(text);
  if (!query.trim()) {
    return escapedText;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapedText.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<mark class="rounded bg-amber-200 px-0.5">$1</mark>',
  );
}

type SearchResponse = {
  results?: BlogPostCardDTO[];
  total?: number;
  query?: string;
};

export default function BlogSearchPage() {
  const t = useTranslations("blog.chrome.search");
  const tCard = useTranslations("blog.chrome.card");
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get("q") ?? "").trim();
  const [query, setQuery] = useState(urlQuery);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [results, setResults] = useState<BlogPostCardDTO[]>([]);
  const [total, setTotal] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 300);

  const normalizedQuery = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();

    async function runSearch() {
      setLoading(true);
      setFailed(false);

      try {
        const response = await fetch(`/api/blog/search?q=${encodeURIComponent(normalizedQuery)}&limit=20`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("SEARCH_FAILED");
        }

        const payload = (await response.json()) as SearchResponse;
        setResults(payload.results ?? []);
        setTotal(payload.total ?? 0);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") {
          return;
        }

        setFailed(true);
      } finally {
        setLoading(false);
      }
    }

    void runSearch();

    return () => {
      controller.abort();
    };
  }, [normalizedQuery]);

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">{t("heading")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("subtitle")}</p>

        <label className="mt-4 block">
          <span className="sr-only">{t("inputAria")}</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none ring-teal-200 transition focus:ring-2"
          />
        </label>

        {normalizedQuery.length >= 2 ? (
          <p className="mt-3 text-sm font-semibold text-slate-700">{t("found", { total, query: normalizedQuery })}</p>
        ) : null}
      </section>

      {loading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </section>
      ) : null}

      {failed ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{t("failed")}</section>
      ) : null}

      {!loading && !failed && normalizedQuery.length >= 2 && results.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          {t("empty")}
        </section>
      ) : null}

      {!loading && results.length > 0 ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {results.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
              <Link href={`/blog/${post.slug}`} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
                <div className="relative overflow-hidden rounded-xl bg-slate-100">
                  {post.coverImageUrl ? <Image src={post.coverImageUrl} alt={post.titleVi} fill className="object-cover" sizes="120px" /> : null}
                </div>
                <div className="space-y-2">
                  <h3
                    className="line-clamp-2 text-base font-bold text-slate-900"
                    dangerouslySetInnerHTML={{ __html: highlightQuery(post.titleVi, normalizedQuery) }}
                  />
                  <p
                    className="line-clamp-2 text-sm text-slate-600"
                    dangerouslySetInnerHTML={{ __html: highlightQuery(post.excerptVi, normalizedQuery) }}
                  />
                  <p className="text-xs font-semibold text-slate-500">{tCard("minRead", { count: post.readingTimeMin })}</p>
                </div>
              </Link>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
