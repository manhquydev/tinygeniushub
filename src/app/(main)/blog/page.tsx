import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogCardFeatured } from "@/components/blog/blog-card-featured";
import { BlogNewsletterWidget } from "@/components/blog/blog-newsletter-widget";
import * as blogRepository from "@/modules/blog/blog-repository";
import { generateBlogListMetadata } from "@/modules/blog/blog-seo";
import { blogService } from "@/modules/blog/blog-service";

export const revalidate = 600;
export const metadata = generateBlogListMetadata();

type BlogPageProps = {
  searchParams?: Promise<{ subscribed?: string | string[]; unsubscribed?: string | string[] }>;
};

function firstParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [featuredPosts, latestPostsResult, categories] = await Promise.all([
    blogService.getFeaturedPosts(),
    blogService.listPosts({ page: 1, limit: 8 }),
    blogRepository.findCategories(),
  ]);

  const heroPost = featuredPosts[0] ?? latestPostsResult.posts[0] ?? null;

  const subscribed = firstParamValue(resolvedSearchParams?.subscribed) === "true";
  const unsubscribed = firstParamValue(resolvedSearchParams?.unsubscribed) === "true";

  return (
    <div className="page-stack">
      {subscribed ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          Bạn đã đăng ký newsletter thành công.
        </section>
      ) : null}

      {unsubscribed ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-700">
          Bạn đã hủy đăng ký newsletter.
        </section>
      ) : null}

      {heroPost ? <BlogCardFeatured post={heroPost} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-white"
              style={{ backgroundColor: category.color ?? "#0f766e" }}
            >
              {category.emoji ?? "??"} {category.nameVi}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="section-header">
          <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">Bài viết mới nhất</h1>
          <Link href="/blog/search" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
            Tìm kiếm bài viết
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {latestPostsResult.posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <BlogNewsletterWidget />
    </div>
  );
}

