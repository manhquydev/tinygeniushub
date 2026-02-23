import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogCommentsSection } from "@/components/blog/blog-comments-section";
import { BlogNewsletterWidget } from "@/components/blog/blog-newsletter-widget";
import { BlogReadingProgress } from "@/components/blog/blog-reading-progress";
import { BlogShare } from "@/components/blog/blog-share";
import { BlogToc } from "@/components/blog/blog-toc";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { extractToc } from "@/modules/blog/blog-markdown";
import { generateBlogPostJsonLd, generateBlogPostMetadata } from "@/modules/blog/blog-seo";
import { blogService } from "@/modules/blog/blog-service";

export const revalidate = 3600;

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 50,
    select: {
      slug: true,
    },
  });

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await blogService.getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return generateBlogPostMetadata(post, env.BETTER_AUTH_URL);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Chưa xuất bản";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await blogService.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const siteUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const articleUrl = `${siteUrl}/blog/${post.slug}`;
  const headings = extractToc(post.contentMarkdown);

  return (
    <div className="page-stack">
      <BlogReadingProgress />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateBlogPostJsonLd(post, siteUrl) }}
      />

      <nav className="text-sm text-slate-500">
        <Link href="/">Trang chủ</Link> <span className="mx-1">/</span> <Link href="/blog">Blog</Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <article className="space-y-6">
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            {post.coverImageUrl ? (
              <Image
                src={post.coverImageUrl}
                alt={post.titleVi}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
                priority
              />
            ) : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: post.category.color ?? "#0f766e" }}
            >
              {post.category.emoji ?? "??"} {post.category.nameVi}
            </span>

            <h1 className="text-3xl font-black leading-tight tracking-[-0.02em] text-slate-900 sm:text-4xl">{post.titleVi}</h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{post.author.displayName}</span>
              <span>·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>·</span>
              <span>{post.readingTimeMin} phút đọc</span>
            </div>

            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

            <BlogShare url={articleUrl} title={post.titleVi} />
          </div>
        </article>

        <aside className="space-y-4">
          <BlogToc headings={headings} />
          <BlogNewsletterWidget />
        </aside>
      </div>

      {post.relatedPosts.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {post.relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="comments">
        <BlogCommentsSection slug={slug} />
      </section>
    </div>
  );
}

