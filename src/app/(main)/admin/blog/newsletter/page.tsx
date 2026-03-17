import Link from "next/link";
import { AdminBlogNewsletterExportButton } from "@/components/admin-blog-newsletter-export-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

type SearchParams = {
  page?: string | string[];
};

type AdminNewsletterPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildHref(page: number) {
  return `/admin/blog/newsletter?page=${page}`;
}

export default async function AdminBlogNewsletterPage({ searchParams }: AdminNewsletterPageProps) {
  await requireAdminParent();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(getFirstValue(resolvedSearchParams?.page) ?? "1") || 1);

  const [activeSubscribers, unsubscribedCount, subscribers, totalSubscribers] = await Promise.all([
    prisma.blogNewsletterSubscriber.count({
      where: {
        verified: true,
        unsubscribedAt: null,
      },
    }),
    prisma.blogNewsletterSubscriber.count({
      where: {
        unsubscribedAt: {
          not: null,
        },
      },
    }),
    prisma.blogNewsletterSubscriber.findMany({
      where: {
        verified: true,
      },
      orderBy: {
        subscribedAt: "desc",
      },
      skip: (currentPage - 1) * 50,
      take: 50,
      select: {
        id: true,
        email: true,
        nameVi: true,
        subscribedAt: true,
      },
    }),
    prisma.blogNewsletterSubscriber.count({
      where: {
        verified: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalSubscribers / 50));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Người đăng ký bản tin</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý danh sách đã xác thực nhận bản tin.</p>
          </div>
          <AdminBlogNewsletterExportButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đang nhận bản tin</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{activeSubscribers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đã hủy đăng ký</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{unsubscribedCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Tên</TableHead>
              <TableHead className="text-xs">Thời điểm đăng ký</TableHead>
              <TableHead className="text-xs">Xác thực</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell className="text-xs font-semibold text-slate-900">{subscriber.email}</TableCell>
                <TableCell className="text-xs text-slate-600">{subscriber.nameVi ?? "-"}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(subscriber.subscribedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">Đã xác thực</Badge>
                </TableCell>
              </TableRow>
            ))}
            {subscribers.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-slate-500 py-8">Không có người đăng ký.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <Button asChild variant="outline" size="sm" className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}>
          <Link href={buildHref(Math.max(1, currentPage - 1))}>Trước</Link>
        </Button>
        <p className="text-sm text-slate-600">Trang {currentPage}/{totalPages}</p>
        <Button asChild variant="outline" size="sm" className={cn(currentPage >= totalPages && "pointer-events-none opacity-50")}>
          <Link href={buildHref(Math.min(totalPages, currentPage + 1))}>Sau</Link>
        </Button>
      </div>
    </div>
  );
}
