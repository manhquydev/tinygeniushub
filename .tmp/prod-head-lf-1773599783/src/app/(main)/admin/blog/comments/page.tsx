import { AdminBlogCommentsModeration } from "@/components/admin-blog-comments-moderation";
import { requireAdminParent } from "@/lib/auth/admin";
import { commentService } from "@/modules/blog/comment-service";

export default async function AdminBlogCommentsPage() {
  await requireAdminParent();
  const comments = await commentService.getPendingComments();

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Quan ly binh luan</h1>
        <p className="mt-2 text-sm text-slate-600">Duyệt hoặc đánh dấu spam cho bình luận đang chờ.</p>
      </section>

      {comments.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Không có bình luận chờ duyệt.
        </section>
      ) : (
        <AdminBlogCommentsModeration
          comments={comments.map((comment) => ({
            id: comment.id,
            authorName: comment.authorName,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            post: comment.post,
          }))}
        />
      )}
    </div>
  );
}
