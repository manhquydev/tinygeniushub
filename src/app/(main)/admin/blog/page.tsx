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
      <div className="flex items-center gap-3 border-b border-[var(--admin-card-border)] pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
          <PenSquare size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--admin-text-primary)]">Blog Management</h1>
          <p className="text-sm text-[var(--admin-text-muted)]">
            Content, newsletter and blog analytics.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-secondary)] shadow-sm hover:bg-[var(--admin-sidebar-accent)]"
          >
            <ExternalLink size={12} />
            View public blog
          </Link>
          <Link
            href="/admin/blog/posts/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            <PenSquare size={12} />
            Write a new post
          </Link>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Published"
          value={publishedCount}
          icon={FileText}
          accent="emerald"
        />
        <StatCard
          label="Draft"
          value={draftCount}
          icon={BookOpen}
          accent="amber"
        />
        <StatCard
          label="Subscriber"
          value={subscriberCount.toLocaleString("vi-VN")}
          icon={Users}
          accent="teal"
        />
        <StatCard
          label="Total views"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-card-bg)]/20">
            <PenSquare size={18} />
          </div>
          <div>
            <p className="font-bold">Write a new post</p>
            <p className="text-sm text-teal-100">Create a blog post now</p>
          </div>
          <span className="ml-auto text-lg">→</span>
        </Link>
        <Link
          href="/admin/blog/posts"
          className="flex items-center gap-3 rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-5 text-[var(--admin-text-secondary)] shadow-sm transition hover:bg-[var(--admin-sidebar-accent)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-sidebar-accent)]">
            <FileText size={18} className="text-[var(--admin-text-secondary)]" />
          </div>
          <div>
            <p className="font-bold text-[var(--admin-text-primary)]">Article management</p>
            <p className="text-sm text-[var(--admin-text-muted)]">
              {publishedCount} published, {draftCount} drafts
            </p>
          </div>
          <span className="ml-auto text-[var(--admin-text-muted)]">→</span>
        </Link>
      </div>

      {/* Top performing post */}
      {topPost ? (
        <div className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
            Most viewed articles
          </p>
          <p className="text-lg font-bold text-[var(--admin-text-primary)]">{topPost.titleVi}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--admin-text-muted)]">
            {topPost.author ? (
              <span className="flex items-center gap-1">
                <Users size={13} />
                {topPost.author.displayName}
              </span>
            ) : null}
            {topPost.category ? (
              <span className="rounded-md bg-[var(--admin-sidebar-accent)] px-2 py-0.5 text-xs font-medium text-[var(--admin-text-secondary)]">
                {topPost.category.nameVi}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Eye size={13} />
              {(topPost.viewCount ?? 0).toLocaleString("vi-VN")} views
            </span>
          </div>
          <div className="mt-4">
            <Link
              href={`/admin/blog/posts/${topPost.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              View article →
            </Link>
          </div>
        </div>
      ) : null}

      {/* Sub-section nav cards */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
          Quick management
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { href: "/admin/blog/categories", label: "Category" },
            { href: "/admin/blog/authors", label: "Author" },
            { href: "/admin/blog/newsletter", label: "Newsletter" },
            { href: "/admin/blog/analytics", label: "Blog Analysis" },
            { href: "/admin/blog/comments", label: "Comment" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-secondary)] shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
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
    <article className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 shadow-sm">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${cls.bg}`}>
        <Icon size={16} className={cls.icon} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-black ${cls.text}`}>{value}</p>
    </article>
  );
}
