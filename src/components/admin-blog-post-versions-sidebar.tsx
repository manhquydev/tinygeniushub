"use client";

import { useCallback, useEffect, useState } from "react";
import type { BlogPostStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export type AdminBlogPostVersionSnapshot = {
  titleVi: string;
  contentMarkdown: string;
  excerptVi: string;
  metaTitleVi: string | null;
  metaDescVi: string | null;
  coverImageUrl: string | null;
  status: BlogPostStatus;
};

type AdminBlogPostVersion = AdminBlogPostVersionSnapshot & {
  id: string;
  savedBy: string | null;
  createdAt: string;
};

type AdminBlogPostVersionsSidebarProps = {
  postId: string;
  onRestore: (snapshot: AdminBlogPostVersionSnapshot) => void;
};

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

export function AdminBlogPostVersionsSidebar({ postId, onRestore }: AdminBlogPostVersionsSidebarProps) {
  const [versions, setVersions] = useState<AdminBlogPostVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}/versions?limit=20`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("FETCH_VERSIONS_FAILED");
      }

      const payload = (await response.json()) as { versions: AdminBlogPostVersion[] };
      setVersions(payload.versions);
    } catch {
      setMessage("Không thể tải lịch sử phiên bản.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void fetchVersions();
  }, [fetchVersions]);

  async function saveVersion() {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}/versions`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("SAVE_VERSION_FAILED");
      }

      setMessage("Đã lưu phiên bản hiện tại.");
      await fetchVersions();
    } catch {
      setMessage("Không thể lưu phiên bản. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[var(--admin-text-primary)]">Lịch sử phiên bản</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => void saveVersion()} disabled={busy || loading}>
          {busy ? "Đang lưu..." : "Lưu phiên bản"}
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? <p className="text-sm text-[var(--admin-text-secondary)]">Đang tải...</p> : null}

        {!loading && versions.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-secondary)]">Chưa có phiên bản nào.</p>
        ) : null}

        {versions.map((version) => (
          <div key={version.id} className="rounded-xl border border-[var(--admin-card-border)] p-3">
            <p className="text-xs font-semibold text-[var(--admin-text-primary)]">
              {new Intl.DateTimeFormat("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(version.createdAt))}
            </p>
            <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">Trạng thái: {getStatusLabel(version.status)}</p>
            <p className="text-xs text-[var(--admin-text-secondary)]">Người lưu: {version.savedBy ?? "Hệ thống"}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() =>
                onRestore({
                  titleVi: version.titleVi,
                  contentMarkdown: version.contentMarkdown,
                  excerptVi: version.excerptVi,
                  metaTitleVi: version.metaTitleVi,
                  metaDescVi: version.metaDescVi,
                  coverImageUrl: version.coverImageUrl,
                  status: version.status,
                })
              }
            >
              Khôi phục vào form
            </Button>
          </div>
        ))}
      </div>

      {message ? (
        <p className="mt-3 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-2 text-xs text-[var(--admin-text-secondary)]">
          {message}
        </p>
      ) : null}
    </aside>
  );
}
