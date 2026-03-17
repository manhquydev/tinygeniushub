import Link from "next/link";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { BookOpen, Users, Eye, FileText, PenSquare, ExternalLink } from "lucide-react";

export default async function AdminBlogDashboardPage() {
  await requireAdminParent();

  const [publishedCount, draftCount, subscriberCount, topPost, viewsAggregate] =
    await Promise.all([
      prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      prisma.blogPost.count({ where: { status: "DRAFT" } }),
      prisma.blogNewsletterSubscriber.count({
        where: { verified: true, unsubscribedAt: null },
      }),
      prisma.blogPost.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        include: { author: true, category: true },
      }),
      prisma.blogPost.aggregate({ _sum: { viewCount: true } }),
    ]);

  const totalViews = viewsAggregate._sum.viewCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
          <PenSquare size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Blog</h1>
          <p className="text-sm text-slate-500">
            Nội dung, newsletter và phân tích blog.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ExternalLink size={12} />
            Xem blog công khai
          </Link>
          <Link
            href="/admin/blog/posts/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            <PenSquare size={12} />
            Viết bài mới
          </Link>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Đã xuất bản"
          value={publishedCount}
          icon={FileText}
          accent="emerald"
        />
        <StatCard
          label="Bản nháp"
          value={draftCount}
          icon={BookOpen}
          accent="amber"
        />
        <StatCard
          label="Người đăng ký"
          value={subscriberCount.toLocaleString("vi-VN")}
          icon={Users}
          accent="teal"
        />
        <StatCard
          label="Tổng lượt xem"
          value={totalViews.toLocaleString("vi-VN")}
          icon={Eye}
          accent="violet"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/blog/posts/new"
          className="flex items-center gap-3 rounded-2xl bg-teal-600 p-5 text-white shadow-sm transition hover:bg-teal-700"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <PenSquare size={18} />
          </div>
          <div>
            <p className="font-bold">Viết bài mới</p>
            <p className="text-sm text-teal-100">Tạo bài viết blog ngay</p>
          </div>
          <span className="ml-auto text-lg">→</span>
        </Link>
        <Link
          href="/admin/blog/posts"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <FileText size={18} className="text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Quản lý bài viết</p>
            <p className="text-sm text-slate-500">
              {publishedCount} đã xuất bản, {draftCount} nháp
            </p>
          </div>
          <span className="ml-auto text-slate-400">→</span>
        </Link>
      </div>

      {/* Top performing post */}
      {topPost ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Bài viết xem nhiều nhất
          </p>
          <p className="text-lg font-bold text-slate-900">{topPost.titleVi}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {topPost.author ? (
              <span className="flex items-center gap-1">
                <Users size={13} />
                {topPost.author.displayName}
              </span>
            ) : null}
            {topPost.category ? (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {topPost.category.nameVi}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Eye size={13} />
              {(topPost.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem
            </span>
          </div>
          <div className="mt-4">
            <Link
              href={`/admin/blog/posts/${topPost.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              Xem bài viết →
            </Link>
          </div>
        </div>
      ) : null}

      {/* Sub-section nav cards */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Quản lý nhanh
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { href: "/admin/blog/categories", label: "Danh mục" },
            { href: "/admin/blog/authors", label: "Tác giả" },
            { href: "/admin/blog/newsletter", label: "Bản tin" },
            { href: "/admin/blog/analytics", label: "Phân tích Blog" },
            { href: "/admin/blog/comments", label: "Bình luận" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              {item.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: "emerald" | "amber" | "teal" | "violet";
}) {
  const accentClasses: Record<typeof accent, { bg: string; icon: string; text: string }> = {
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-700" },
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   text: "text-amber-700"   },
    teal:    { bg: "bg-teal-50",    icon: "text-teal-600",    text: "text-teal-700"    },
    violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  text: "text-violet-700"  },
  };
  const cls = accentClasses[accent];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${cls.bg}`}>
        <Icon size={16} className={cls.icon} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-black ${cls.text}`}>{value}</p>
    </article>
  );
}
