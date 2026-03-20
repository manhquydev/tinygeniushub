"use client";

import { AdminBlogPostForm } from "@/components/admin-blog-post-form";

export default function AdminBlogNewPostPage() {
  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Tạo bài viết mới</h1>
      </section>

      <AdminBlogPostForm mode="create" submitUrl="/api/admin/blog/posts" />
    </div>
  );
}
