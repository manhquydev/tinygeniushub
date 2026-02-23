import { notFound } from "next/navigation";
import { AdminBlogPostForm } from "@/components/admin-blog-post-form";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

type AdminEditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditPostPage({ params }: AdminEditPostPageProps) {
  await requireAdminParent();

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      author: true,
      category: true,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Chỉnh sửa bài viết</h1>
      </section>

      <AdminBlogPostForm
        mode="edit"
        submitUrl={`/api/admin/blog/posts/${post.id}`}
        postId={post.id}
        viewSlug={post.slug}
        defaultValues={{
          slug: post.slug,
          titleVi: post.titleVi,
          excerptVi: post.excerptVi,
          type: post.type,
          ageGroup: post.ageGroup,
          categoryId: post.categoryId,
          authorId: post.authorId,
          coverImageUrl: post.coverImageUrl ?? "",
          tagsInput: post.tags.map((entry) => entry.tag.slug).join(", "),
          contentMarkdown: post.contentMarkdown,
          metaTitleVi: post.metaTitleVi ?? "",
          metaDescVi: post.metaDescVi ?? "",
          status: post.status,
          scheduledAt: post.scheduledAt?.toISOString() ?? "",
        }}
      />
    </div>
  );
}
