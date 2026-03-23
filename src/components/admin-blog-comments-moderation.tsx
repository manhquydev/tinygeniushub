"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminBlogBulkActionsBar } from "@/components/admin-blog-bulk-actions-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type PendingComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  post: {
    slug: string;
    titleVi: string;
  };
};

export function AdminBlogCommentsModeration({ comments }: { comments: PendingComment[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const allSelected = useMemo(() => {
    return comments.length > 0 && selectedIds.length === comments.length;
  }, [comments.length, selectedIds.length]);

  function toggleSelection(commentId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(commentId) ? current : [...current, commentId];
      }

      return current.filter((id) => id !== commentId);
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? comments.map((comment) => comment.id) : []);
  }

  async function moderate(id: string, status: "APPROVED" | "SPAM" | "DELETED") {
    setLoadingId(id);
    setActionError(null);

    try {
      const response = await fetch("/api/admin/blog/comments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error("MODERATE_FAILED");
      }

      router.refresh();
    } catch {
      setActionError("Không thể cập nhật bình luận. Vui lòng thử lại.");
    } finally {
      setLoadingId(null);
    }
  }

  async function runBulkAction(action: string, ids: string[]) {
    setActionError(null);

    const response = await fetch("/api/admin/blog/comments/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        commentIds: ids,
      }),
    });

    if (!response.ok) {
      setActionError("Không thể thực hiện thao tác hàng loạt. Vui lòng thử lại.");
      return;
    }

    setSelectedIds([]);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 shadow-sm">
        <label className="flex items-center gap-3 text-sm font-semibold text-[var(--admin-text-primary)]">
          <Checkbox checked={allSelected} onCheckedChange={(value) => toggleSelectAll(!!value)} />
          Chọn tất cả bình luận đang hiển thị
        </label>
        <span className="text-xs text-[var(--admin-text-secondary)]">{comments.length} bình luận chờ xử lý</span>
      </div>

      {comments.map((comment) => (
        <article key={comment.id} className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Link
                href={`/blog/${comment.post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                {comment.post.titleVi}
              </Link>
              <p className="text-sm text-[var(--admin-text-secondary)]">
                <strong>{comment.authorName}</strong> ·{" "}
                {new Intl.DateTimeFormat("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(comment.createdAt))}
              </p>
              <p className="text-sm text-[var(--admin-text-secondary)]">
                {comment.content.slice(0, 100)}
                {comment.content.length > 100 ? "..." : ""}
              </p>
            </div>
            <Checkbox
              checked={selectedIds.includes(comment.id)}
              onCheckedChange={(value) => toggleSelection(comment.id, !!value)}
              aria-label={`Chọn bình luận của ${comment.authorName}`}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => void moderate(comment.id, "APPROVED")}
              disabled={loadingId === comment.id}
            >
              Duyệt
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void moderate(comment.id, "DELETED")}
              disabled={loadingId === comment.id}
            >
              Từ chối
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => void moderate(comment.id, "SPAM")}
              disabled={loadingId === comment.id}
            >
              Spam
            </Button>
          </div>
        </article>
      ))}

      <AdminBlogBulkActionsBar
        selectedIds={selectedIds}
        actions={[
          { value: "approve", label: "Duyệt" },
          {
            value: "reject",
            label: "Từ chối",
            variant: "outline",
            requiresConfirm: true,
            confirmMessage: "Từ chối các bình luận đã chọn?",
          },
          {
            value: "spam",
            label: "Đánh dấu spam",
            variant: "destructive",
            requiresConfirm: true,
            confirmMessage: "Đánh dấu spam cho các bình luận đã chọn?",
          },
        ]}
        onAction={runBulkAction}
      />

      {actionError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{actionError}</p>
      ) : null}
    </div>
  );
}
