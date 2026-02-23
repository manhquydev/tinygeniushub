import Link from "next/link";
import { AdminBlogNewsletterExportButton } from "@/components/admin-blog-newsletter-export-button";
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
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="section-header">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Newsletter subscribers</h1>
            <p className="mt-2 text-sm text-slate-600">Quản lý danh sách đã xác thực nhận bản tin.</p>
          </div>
          <AdminBlogNewsletterExportButton />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Active subscribers</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{activeSubscribers}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Unsubscribed</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{unsubscribedCount}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Subscribed at</th>
                <th className="px-4 py-3">Verified</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{subscriber.email}</td>
                  <td className="px-4 py-3 text-slate-700">{subscriber.nameVi ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(subscriber.subscribedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Verified</span>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Không có subscriber.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link href={buildHref(Math.max(1, currentPage - 1))} className={`ghost-button ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}>
          Prev
        </Link>
        <p className="text-sm text-slate-600">
          Page {currentPage}/{totalPages}
        </p>
        <Link href={buildHref(Math.min(totalPages, currentPage + 1))} className={`ghost-button ${currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}>
          Next
        </Link>
      </section>
    </div>
  );
}
