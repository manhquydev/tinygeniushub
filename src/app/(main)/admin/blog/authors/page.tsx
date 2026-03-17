import { AdminBlogAuthorCreateForm } from "@/components/admin-blog-author-create-form";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export default async function AdminBlogAuthorsPage() {
  await requireAdminParent();

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
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Quản lý tác giả blog</h1>
      </section>

      <AdminBlogAuthorCreateForm />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Kích hoạt</th>
                <th className="px-4 py-3">Số bài viết</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{author.displayName}</td>
                  <td className="px-4 py-3 text-slate-700">{author.role}</td>
                  <td className="px-4 py-3 text-slate-700">{author.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{author.active ? "Bật" : "Tắt"}</td>
                  <td className="px-4 py-3 text-slate-700">{author._count.posts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
