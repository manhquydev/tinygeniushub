import Link from "next/link";
import { BlogNewsletterWidget } from "@/components/blog/blog-newsletter-widget";
import { BlogTrendingPosts } from "@/components/blog/blog-trending-posts";
import type { BlogCategory, BlogPostCardDTO } from "@/modules/blog/blog-types";

type BlogSidebarProps = {
  categories: BlogCategory[];
  trendingPosts: BlogPostCardDTO[];
};

export function BlogSidebar({ categories, trendingPosts }: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
          Chủ đề
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: category.color ?? "#0f766e" }}
            >
              {category.emoji ?? "??"} {category.nameVi}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
          Đang được đọc nhiều
        </h3>
        <BlogTrendingPosts posts={trendingPosts} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <BlogNewsletterWidget />
      </section>
    </aside>
  );
}
