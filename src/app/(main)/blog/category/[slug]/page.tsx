import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogCategoryFilter } from "@/components/blog/blog-category-filter";
import { prisma } from "@/lib/db";
import { blogService } from "@/modules/blog/blog-service";

export const revalidate = 1800;

type BlogCategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<{ page?: string | string[]; sort?: string | string[] }>
    | { page?: string | string[]; sort?: string | string[] };
};

function resolvePage(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 1;
}

function resolveSort(raw: string | string[] | undefined): "latest" | "popular" {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "popular" ? "popular" : "latest";
}

function buildCategoryPageHref(slug: string, page: number, sort: "latest" | "popular") {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("sort", sort);
  return `/blog/category/${slug}?${params.toString()}`;
}

export default async function BlogCategoryPage({ params, searchParams }: BlogCategoryPageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = resolvePage(resolvedSearchParams?.page);
  const sort = resolveSort(resolvedSearchParams?.sort);

  const category = await prisma.blogCategory.findFirst({
    where: {
      slug,
      active: true,
    },
    select: {
      id: true,
      slug: true,
      nameVi: true,
      description: true,
      emoji: true,
      color: true,
    },
  });

  if (!category) {
    notFound();
  }

  const result = await blogService.listPosts({
    page,
    limit: 12,
    category: category.slug,
    sort,
  });

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-4xl">{category.emoji ?? "??"}</p>
          <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">{category.nameVi}</h1>
          {category.description ? <p className="max-w-[70ch] text-slate-600">{category.description}</p> : null}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">
          {result.total} bài viết
        </p>
        <BlogCategoryFilter basePath={`/blog/category/${category.slug}`} currentSort={sort} />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {result.posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </section>

      <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Pagination">
        {page > 1 ? (
          <Link
            href={buildCategoryPageHref(category.slug, page - 1, sort)}
            className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Trang trước
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-400">
            ← Trang trước
          </span>
        )}

        <span className="text-sm font-semibold text-slate-600">
          Trang {result.page}/{result.totalPages}
        </span>

        {result.page < result.totalPages ? (
          <Link
            href={buildCategoryPageHref(category.slug, page + 1, sort)}
            className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Trang sau →
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-400">
            Trang sau →
          </span>
        )}
      </nav>
    </div>
  );
}
