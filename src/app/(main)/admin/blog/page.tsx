import Link from "next/link";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export default async function AdminBlogDashboardPage() {
  await requireAdminParent();

  const [publishedCount, draftCount, subscriberCount, topPost, viewsAggregate] = await Promise.all([
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
    prisma.blogNewsletterSubscriber.count({
      where: {
        verified: true,
        unsubscribedAt: null,
      },
    }),
    prisma.blogPost.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      include: {
        author: true,
        category: true,
      },
    }),
    prisma.blogPost.aggregate({
      _sum: {
        viewCount: true,
      },
    }),
  ]);

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Blog Admin</h1>
        <p className="mt-2 text-sm text-slate-600">Quản trị nội dung và newsletter blog.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{publishedCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Drafts</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{draftCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Subscribers</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{subscriberCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tổng lượt xem</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{viewsAggregate._sum.viewCount ?? 0}</p>
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/blog/posts/new" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          Viet bai moi
        </Link>
        <Link href="/admin/blog/posts" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          Quan ly bai viet
        </Link>
      </section>

      {topPost ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Bai viet xem nhieu nhat</h2>
          <p className="mt-3 text-lg font-bold text-slate-800">{topPost.titleVi}</p>
          <p className="mt-2 text-sm text-slate-600">{topPost.viewCount} lượt xem</p>
        </section>
      ) : null}

      <Link href="/blog" className="inline-flex w-fit rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100">
        Đi tới blog công khai
      </Link>
    </div>
  );
}
