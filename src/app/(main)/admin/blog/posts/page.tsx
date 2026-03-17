import Image from "next/image";
import Link from "next/link";
import { type BlogPostStatus, Prisma } from "@prisma/client";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

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

function getStatusPillClass(status: BlogPostStatus) {
  switch (status) {
    case "DRAFT":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SCHEDULED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ARCHIVED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status: BlogPostStatus) {
  switch (status) {
    case "DRAFT":
      return "Nháp";
    case "REVIEW":
      return "Chờ duyệt";
    case "PUBLISHED":
      return "Đã xuất bản";
    case "SCHEDULED":
      return "Lên lịch";
    case "ARCHIVED":
      return "Lưu trữ";
    default:
      return status;
  }
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
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="section-header">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Quản lý bài viết</h1>
            <p className="mt-2 text-sm text-slate-600">Lọc theo trạng thái hoặc tiêu đề.</p>
          </div>
          <Link href="/admin/blog/posts/new" className="solid-button">
            Viết bài mới
          </Link>
        </div>

        <form method="GET" className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <select name="status" defaultValue={status ?? ""} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">{getStatusLabel("DRAFT")}</option>
            <option value="REVIEW">{getStatusLabel("REVIEW")}</option>
            <option value="PUBLISHED">{getStatusLabel("PUBLISHED")}</option>
            <option value="SCHEDULED">{getStatusLabel("SCHEDULED")}</option>
            <option value="ARCHIVED">{getStatusLabel("ARCHIVED")}</option>
          </select>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tìm tiêu đề"
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"
          />
          <button type="submit" className="ghost-button">
            Lọc
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Ảnh bìa</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3">Lượt xem</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="relative h-[40px] w-[60px] overflow-hidden rounded-md bg-slate-100">
                      {post.coverImageUrl ? <Image src={post.coverImageUrl} alt={post.titleVi} fill className="object-cover" sizes="60px" /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/posts/${post.id}/edit`} className="font-semibold text-slate-900 hover:text-teal-700">
                      {post.titleVi}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusPillClass(post.status)}`}>
                      {getStatusLabel(post.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{post.category.nameVi}</td>
                  <td className="px-4 py-3 text-slate-700">{post.author.displayName}</td>
                  <td className="px-4 py-3 text-slate-700">{post.viewCount}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(post.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/blog/posts/${post.id}/edit`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                        Sửa
                      </Link>
                      <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-slate-700 hover:text-slate-900" target="_blank" rel="noreferrer">
                        Xem
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                    Không có bài viết phù hợp.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <Link href={buildHref(Math.max(1, currentPage - 1), status, q || undefined)} className={`ghost-button ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}>
            Trước
          </Link>
          <Link href={buildHref(Math.min(totalPages, currentPage + 1), status, q || undefined)} className={`ghost-button ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}>
            Sau
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageNumbers.map((page) => (
            <Link
              key={page}
              href={buildHref(page, status, q || undefined)}
              className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold ${
                page === currentPage ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
