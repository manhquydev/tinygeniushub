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
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Quản lý danh mục blog</h1>
      </section>

      <AdminBlogCategoryCreateForm />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Emoji</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Màu</th>
                <th className="px-4 py-3">Thứ tự</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Post count</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-lg">{category.emoji ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{category.nameVi}</td>
                  <td className="px-4 py-3 text-slate-700">{category.slug}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: category.color ?? "#94a3b8" }} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{category.orderNo}</td>
                  <td className="px-4 py-3 text-slate-700">{category.active ? "Bật" : "Tắt"}</td>
                  <td className="px-4 py-3 text-slate-700">{category._count.posts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
