"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { BlogPostStatus } from "@prisma/client";
import { AdminBlogBulkActionsBar } from "@/components/admin-blog-bulk-actions-bar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminBlogPostsTablePost = {
  id: string;
  slug: string;
  titleVi: string;
  status: BlogPostStatus;
  coverImageUrl: string | null;
  viewCount: number;
  createdAt: string;
  category: {
    nameVi: string;
  };
  author: {
    displayName: string;
  };
};

type AdminBlogPostsTableProps = {
  posts: AdminBlogPostsTablePost[];
};

function getStatusPillClass(status: BlogPostStatus) {
  switch (status) {
    case "DRAFT":
      return "border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]";
    case "REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SCHEDULED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ARCHIVED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]";
  }
}

function getStatusLabel(status: BlogPostStatus) {
  switch (status) {
    case "DRAFT":
      return "Nháp";
    case "REVIEW":
      return "Chờ duyệt";
    case "PUBLISHED":
      return "Đã xuất bản";
    case "SCHEDULED":
      return "Lên lịch";
    case "ARCHIVED":
      return "Lưu trữ";
    default:
      return status;
  }
}

export function AdminBlogPostsTable({ posts }: AdminBlogPostsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const allSelected = useMemo(() => {
    return posts.length > 0 && selectedIds.length === posts.length;
  }, [posts.length, selectedIds.length]);

  function toggleSelection(postId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(postId) ? current : [...current, postId];
      }
      return current.filter((id) => id !== postId);
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? posts.map((post) => post.id) : []);
  }

  async function runBulkAction(action: string, ids: string[]) {
    setActionError(null);

    const response = await fetch("/api/admin/blog/posts/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        postIds: ids,
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
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(value) => toggleSelectAll(!!value)} />
              </TableHead>
              <TableHead className="text-xs">Ảnh bìa</TableHead>
              <TableHead className="text-xs">Tiêu đề</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Danh mục</TableHead>
              <TableHead className="text-xs">Tác giả</TableHead>
              <TableHead className="text-xs">Lượt xem</TableHead>
              <TableHead className="text-xs">Ngày tạo</TableHead>
              <TableHead className="text-xs">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(post.id)}
                    onCheckedChange={(value) => toggleSelection(post.id, !!value)}
                  />
                </TableCell>
                <TableCell>
                  <div className="relative h-[40px] w-[60px] overflow-hidden rounded-md bg-[var(--admin-sidebar-accent)]">
                    {post.coverImageUrl ? (
                      <Image src={post.coverImageUrl} alt={post.titleVi} fill className="object-cover" sizes="60px" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/blog/posts/${post.id}/edit`} className="text-sm font-semibold text-[var(--admin-text-primary)] hover:text-teal-700">
                    {post.titleVi}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs border", getStatusPillClass(post.status))}>
                    {getStatusLabel(post.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[var(--admin-text-secondary)]">{post.category.nameVi}</TableCell>
                <TableCell className="text-xs text-[var(--admin-text-secondary)]">{post.author.displayName}</TableCell>
                <TableCell className="text-xs">{post.viewCount}</TableCell>
                <TableCell className="text-xs">
                  {new Intl.DateTimeFormat("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(new Date(post.createdAt))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/blog/posts/${post.id}/edit`} className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                      Sửa
                    </Link>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xem
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-[var(--admin-text-muted)] py-8">
                  Không có bài viết phù hợp.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AdminBlogBulkActionsBar
        selectedIds={selectedIds}
        actions={[
          { value: "publish", label: "Xuất bản" },
          {
            value: "archive",
            label: "Lưu trữ",
            variant: "outline",
            requiresConfirm: true,
            confirmMessage: "Lưu trữ các bài viết đã chọn?",
          },
          {
            value: "delete",
            label: "Xóa mềm",
            variant: "destructive",
            requiresConfirm: true,
            confirmMessage: "Xóa mềm (chuyển lưu trữ) các bài viết đã chọn?",
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
