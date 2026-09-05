import Link from "next/link";
import { BlogTrendingPosts } from "@/components/blog/blog-trending-posts";
import type { AppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";
import { getBlogCategoryDisplayName } from "@/modules/blog/blog-category-labels";
import type { BlogCategory, BlogPostCardDTO } from "@/modules/blog/blog-types";

type BlogSidebarProps = {
  categories: BlogCategory[];
  trendingPosts: BlogPostCardDTO[];
  locale: AppLocale;
};

function normalizeCategoryColor(value: string | null | undefined) {
  const fallback = "#0f766e";
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

function toHex6(color: string) {
  if (color.length === 4) {
    const [hash, r, g, b] = color;
    return `${hash}${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return color.toLowerCase();
}

function getCategoryBadgeStyle(color: string | null | undefined) {
  const backgroundColor = normalizeCategoryColor(color);
  const hex = toHex6(backgroundColor).slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;

  return {
    backgroundColor,
    color: luminance >= 140 ? "#0f172a" : "#ffffff",
  };
}

export function BlogSidebar({ categories, trendingPosts, locale }: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
          {translate("blog.chrome.sidebar.topics", undefined, locale)}
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
              style={getCategoryBadgeStyle(category.color)}
            >
              {getBlogCategoryDisplayName(category, locale)}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
          {translate("blog.chrome.sidebar.trending", undefined, locale)}
        </h3>
        <BlogTrendingPosts posts={trendingPosts} />
      </section>
    </aside>
  );
}
