import { AdminBlogCommentsModeration } from "@/components/admin-blog-comments-moderation";
import { requireAdminParent } from "@/lib/auth/admin";
import { commentService } from "@/modules/blog/comment-service";

export default async function AdminBlogCommentsPage() {
  await requireAdminParent();
  const comments = await commentService.getPendingComments();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-[var(--admin-text-primary)]">Manage comments</h1>
        <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">Browse or mark pending comments as spam.</p>
      </section>

      {comments.length === 0 ? (
        <section className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 text-sm text-[var(--admin-text-secondary)] shadow-sm">
          There are no comments pending approval.
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
