"use client";

import { AdminBlogPostForm } from "@/components/admin-blog-post-form";

export default function AdminBlogNewPostPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-[var(--admin-text-primary)]">Tạo bài viết mới</h1>
      </section>

      <AdminBlogPostForm mode="create" submitUrl="/api/admin/blog/posts" />
    </div>
  );
}
