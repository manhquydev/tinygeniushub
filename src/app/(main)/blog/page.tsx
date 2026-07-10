import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogCardFeatured } from "@/components/blog/blog-card-featured";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import * as blogRepository from "@/modules/blog/blog-repository";
import { getBlogCategoryDisplayName } from "@/modules/blog/blog-category-labels";
import { generateBlogListMetadata } from "@/modules/blog/blog-seo";
import { blogService } from "@/modules/blog/blog-service";

export const revalidate = 600;
export const metadata = generateBlogListMetadata();

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

export default async function BlogPage() {
  const [featuredPosts, latestPostsResult, categories, trendingPosts] = await Promise.all([
    blogService.getFeaturedPosts(),
    blogService.listPosts({ page: 1, limit: 8 }),
    blogRepository.findCategories(),
    blogRepository.findTrendingPosts(5),
  ]);

  const heroPost = featuredPosts[0] ?? latestPostsResult.posts[0] ?? null;
  const hasLatestPosts = latestPostsResult.posts.length > 0;

  return (
    <div className="page-stack">
      {heroPost ? <BlogCardFeatured post={heroPost} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full px-3 text-sm font-semibold"
              style={getCategoryBadgeStyle(category.color)}
            >
              {getBlogCategoryDisplayName(category)}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="section-header">
          <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Latest article</h1>
          <Link
            href="/blog/search"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Search articles
          </Link>
        </div>

        {hasLatestPosts ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {latestPostsResult.posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            <BlogSidebar categories={categories} trendingPosts={trendingPosts} />
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            There is no official post yet. Content will appear as soon as the team publishes a new article.
          </section>
        )}
      </section>
    </div>
  );
}
