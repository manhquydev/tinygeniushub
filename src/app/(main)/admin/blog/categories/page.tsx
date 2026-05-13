import { AdminBlogCategoryCreateForm } from "@/components/admin-blog-category-create-form";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export default async function AdminBlogCategoriesPage() {
  await requireAdminParent();

  const categories = await prisma.blogCategory.findMany({
    orderBy: {
      orderNo: "asc",
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
        <h1 className="text-3xl font-black tracking-[-0.02em] text-[var(--admin-text-primary)]">Manage blog portfolio</h1>
      </section>

      <AdminBlogCategoryCreateForm />

      <section className="overflow-hidden rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--admin-sidebar-accent)] text-xs uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3">Emoji</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Activate</th>
                <th className="px-4 py-3">Number of articles</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-[var(--admin-card-border)]">
                  <td className="px-4 py-3 text-lg">{category.emoji ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--admin-text-primary)]">{category.nameVi}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{category.slug}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-5 w-5 rounded-full border border-[var(--admin-card-border)]" style={{ backgroundColor: category.color ?? "#94a3b8" }} />
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{category.orderNo}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{category.active ? "Turn on" : "Turn off"}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{category._count.posts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
