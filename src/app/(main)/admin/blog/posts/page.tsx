import Image from "next/image";
import Link from "next/link";
import { type BlogPostStatus, Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

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
      return "border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]";
    case "REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SCHEDULED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ARCHIVED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]";
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
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--admin-text-primary)]">Quản lý bài viết</h1>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">Lọc theo trạng thái hoặc tiêu đề.</p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/admin/blog/posts/new">Viết bài mới</Link>
          </Button>
        </div>

        <form method="GET" className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-lg border border-[var(--admin-card-border)] px-3 text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">{getStatusLabel("DRAFT")}</option>
            <option value="REVIEW">{getStatusLabel("REVIEW")}</option>
            <option value="PUBLISHED">{getStatusLabel("PUBLISHED")}</option>
            <option value="SCHEDULED">{getStatusLabel("SCHEDULED")}</option>
            <option value="ARCHIVED">{getStatusLabel("ARCHIVED")}</option>
          </select>
          <input type="search" name="q" defaultValue={q} placeholder="Tìm tiêu đề" className="h-10 rounded-lg border border-[var(--admin-card-border)] px-3 text-sm" />
          <Button type="submit" variant="outline">Lọc</Button>
        </form>
      </div>

      <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Ảnh bìa</TableHead>
              <TableHead className="text-xs">Tiêu đề</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Danh mục</TableHead>
              <TableHead className="text-xs">Tác giả</TableHead>
              <TableHead className="text-xs">Lượt xem</TableHead>
              <TableHead className="text-xs">Ngày tạo</TableHead>
              <TableHead className="text-xs">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="relative h-[40px] w-[60px] overflow-hidden rounded-md bg-[var(--admin-sidebar-accent)]">
                    {post.coverImageUrl ? <Image src={post.coverImageUrl} alt={post.titleVi} fill className="object-cover" sizes="60px" /> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/blog/posts/${post.id}/edit`} className="text-sm font-semibold text-[var(--admin-text-primary)] hover:text-teal-700">
                    {post.titleVi}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs border", getStatusPillClass(post.status))}>
                    {getStatusLabel(post.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[var(--admin-text-secondary)]">{post.category.nameVi}</TableCell>
                <TableCell className="text-xs text-[var(--admin-text-secondary)]">{post.author.displayName}</TableCell>
                <TableCell className="text-xs">{post.viewCount}</TableCell>
                <TableCell className="text-xs">{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(post.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/blog/posts/${post.id}/edit`} className="text-xs font-semibold text-teal-700 hover:text-teal-800">Sửa</Link>
                    <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]" target="_blank" rel="noreferrer">Xem</Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-sm text-[var(--admin-text-muted)] py-8">Không có bài viết phù hợp.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-3">
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className={cn(currentPage === 1 && "pointer-events-none opacity-50")}>
            <Link href={buildHref(Math.max(1, currentPage - 1), status, q || undefined)}>Trước</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}>
            <Link href={buildHref(Math.min(totalPages, currentPage + 1), status, q || undefined)}>Sau</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageNumbers.map((page) => (
            <Link
              key={page}
              href={buildHref(page, status, q || undefined)}
              className={cn(
                "inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold",
                page === currentPage ? "border-teal-300 bg-teal-50 text-teal-700" : "border-[var(--admin-card-border)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-sidebar-accent)]",
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
