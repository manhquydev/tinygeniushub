import Link from "next/link";
import { type BlogPostStatus, Prisma } from "@prisma/client";
import { getLocale } from "next-intl/server";
import { AdminBlogPostsTable } from "@/components/admin-blog-posts-table";
import { Button } from "@/components/ui/button";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

type SearchParams = {
  page?: string | string[];
  status?: string | string[];
  q?: string | string[];
};

type AdminBlogPostsPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const ALLOWED_STATUSES: BlogPostStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"];

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getStatusLabel(
  status: BlogPostStatus,
  labels: Record<string, string>,
): string {
  return labels[status] ?? status;
}

function buildHref(page: number, status?: BlogPostStatus, q?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (status) {
    params.set("status", status);
  }
  if (q) {
    params.set("q", q);
  }
  return `/admin/blog/posts?${params.toString()}`;
}

export default async function AdminBlogPostsPage({ searchParams }: AdminBlogPostsPageProps) {
  await requireAdminParent();
  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`admin.blog.posts.${key}`, undefined, locale);
  const statusLabels: Record<string, string> = {
    DRAFT: t("statusDraft"),
    REVIEW: t("statusReview"),
    PUBLISHED: t("statusPublished"),
    SCHEDULED: t("statusScheduled"),
    ARCHIVED: t("statusArchived"),
  };

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(getFirstValue(resolvedSearchParams?.page) ?? "1") || 1);
  const rawStatus = getFirstValue(resolvedSearchParams?.status);
  const q = getFirstValue(resolvedSearchParams?.q)?.trim() ?? "";
  const status = rawStatus && ALLOWED_STATUSES.includes(rawStatus as BlogPostStatus) ? (rawStatus as BlogPostStatus) : undefined;

  const where: Prisma.BlogPostWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          titleVi: {
            contains: q,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      include: {
        author: true,
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (currentPage - 1) * 20,
      take: 20,
    }),
    prisma.blogPost.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--admin-text-primary)]">{t("title")}</h1>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{t("description")}</p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/admin/blog/posts/new">{t("writeNewPost")}</Link>
          </Button>
        </div>

        <form method="GET" className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-lg border border-[var(--admin-card-border)] px-3 text-sm">
            <option value="">{t("allStatuses")}</option>
            <option value="DRAFT">{getStatusLabel("DRAFT", statusLabels)}</option>
            <option value="REVIEW">{getStatusLabel("REVIEW", statusLabels)}</option>
            <option value="PUBLISHED">{getStatusLabel("PUBLISHED", statusLabels)}</option>
            <option value="SCHEDULED">{getStatusLabel("SCHEDULED", statusLabels)}</option>
            <option value="ARCHIVED">{getStatusLabel("ARCHIVED", statusLabels)}</option>
          </select>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="h-10 rounded-lg border border-[var(--admin-card-border)] px-3 text-sm"
          />
          <Button type="submit" variant="outline">
            {t("filterButton")}
          </Button>
        </form>
      </div>

      <AdminBlogPostsTable
        posts={posts.map((post) => ({
          id: post.id,
          slug: post.slug,
          titleVi: post.titleVi,
          status: post.status,
          coverImageUrl: post.coverImageUrl,
          viewCount: post.viewCount,
          createdAt: post.createdAt.toISOString(),
          category: {
            nameVi: post.category.nameVi,
          },
          author: {
            displayName: post.author.displayName,
          },
        }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-3">
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className={cn(currentPage === 1 && "pointer-events-none opacity-50")}>
            <Link href={buildHref(Math.max(1, currentPage - 1), status, q || undefined)}>{t("previousPage")}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
          >
            <Link href={buildHref(Math.min(totalPages, currentPage + 1), status, q || undefined)}>{t("nextPage")}</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageNumbers.map((page) => (
            <Link
              key={page}
              href={buildHref(page, status, q || undefined)}
              className={cn(
                "inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold",
                page === currentPage
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-[var(--admin-card-border)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-sidebar-accent)]",
              )}
            >
              {page}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
