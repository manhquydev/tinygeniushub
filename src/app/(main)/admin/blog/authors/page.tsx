import { getLocale } from "next-intl/server";
import { AdminBlogAuthorCreateForm } from "@/components/admin-blog-author-create-form";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export default async function AdminBlogAuthorsPage() {
  await requireAdminParent();
  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`admin.blog.authors.${key}`, undefined, locale);

  const authors = await prisma.blogAuthor.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-[var(--admin-text-primary)]">{t("title")}</h1>
      </section>

      <AdminBlogAuthorCreateForm />

      <section className="overflow-hidden rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--admin-sidebar-accent)] text-xs uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3">{t("colName")}</th>
                <th className="px-4 py-3">{t("colRole")}</th>
                <th className="px-4 py-3">{t("colEmail")}</th>
                <th className="px-4 py-3">{t("colActivate")}</th>
                <th className="px-4 py-3">{t("colPostCount")}</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.id} className="border-t border-[var(--admin-card-border)]">
                  <td className="px-4 py-3 font-semibold text-[var(--admin-text-primary)]">{author.displayName}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{author.role}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{author.email ?? "-"}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{author.active ? t("active") : t("inactive")}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{author._count.posts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
