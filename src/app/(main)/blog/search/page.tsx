"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { BlogPostCardDTO } from "@/modules/blog/blog-types";

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function BlogSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BlogPostCardDTO[]>([]);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function runSearch() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/blog/search?q=${encodeURIComponent(debouncedQuery.trim())}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("SEARCH_FAILED");
        }

        const payload = (await response.json()) as { posts?: BlogPostCardDTO[] };
        setResults(payload.posts ?? []);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") {
          return;
        }

        setError("Tìm ki?m th?t b?i. Vui lòng th? l?i.");
      } finally {
        setLoading(false);
      }
    }

    void runSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Tìm ki?m bài vi?t</h1>
        <p className="mt-2 text-sm text-slate-600">Nh?p t? khóa d? tìm bài vi?t phù h?p v?i nhu c?u c?a gia dình b?n.</p>

        <label className="mt-4 block">
          <span className="sr-only">T? khóa tìm ki?m</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ví d?: ti?ng Anh, toán tu duy, k? nang s?ng..."
            className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none ring-teal-200 transition focus:ring-2"
          />
        </label>
      </section>

      {loading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</section>
      ) : null}

      {!loading && !error && debouncedQuery.trim().length >= 2 && results.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          Không tìm th?y bài vi?t phù h?p.
        </section>
      ) : null}

      {!loading && results.length > 0 ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {results.map((post) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.id}
              className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
            >
              <div className="relative overflow-hidden rounded-xl bg-slate-100">
                {post.coverImageUrl ? (
                  <Image
                    src={post.coverImageUrl}
                    alt={post.titleVi}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="line-clamp-2 text-base font-bold text-slate-900">{post.titleVi}</p>
                <p className="line-clamp-2 text-sm text-slate-600">{post.excerptVi}</p>
                <p className="text-xs font-semibold text-slate-500">{post.readingTimeMin} phút d?c</p>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}

