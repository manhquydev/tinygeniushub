import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { BlogAuthorCard } from "@/components/blog/blog-author-card";
import { BlogBookmarkButton } from "@/components/blog/blog-bookmark-button";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogCommentsSection } from "@/components/blog/blog-comments-section";
import { BlogLikeButton } from "@/components/blog/blog-like-button";
import { BlogReadingProgress } from "@/components/blog/blog-reading-progress";
import { BlogShare } from "@/components/blog/blog-share";
import { BlogToc } from "@/components/blog/blog-toc";
import { resolveAppLocale, type AppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";
import { getReaderFromServerCookie } from "@/lib/auth/reader";
import { env } from "@/lib/env";
import { extractToc } from "@/modules/blog/blog-markdown";
import {
  BLOG_LIKE_SESSION_COOKIE_NAME,
  getBlogLikeIdentityHash,
  hasPostLike,
} from "@/modules/blog/blog-repository";
import { getBlogCategoryDisplayName } from "@/modules/blog/blog-category-labels";
import { generateBlogPostJsonLd, generateBlogPostMetadata } from "@/modules/blog/blog-seo";
import { blogService } from "@/modules/blog/blog-service";
import { getBookmarkStatus } from "@/modules/reader/reader-service";

export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await blogService.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return generateBlogPostMetadata(post, env.BETTER_AUTH_URL);
}

function formatDate(value: Date | null, locale: AppLocale) {
  if (!value) {
    return translate("blog.chrome.card.unpublished", undefined, locale);
  }

  return value.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US");
}

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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, reader, rawLocale] = await Promise.all([
    blogService.getPostBySlug(slug),
    getReaderFromServerCookie(),
    getLocale(),
  ]);

  if (!post) {
    notFound();
  }

  const locale = resolveAppLocale(rawLocale);
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(`blog.chrome.article.${key}`, values, locale);
  const bookmarkStatus = reader
    ? await getBookmarkStatus(reader.id, post.id)
    : { bookmarked: false };
  const cookieStore = await cookies();
  const likeSessionToken = cookieStore.get(BLOG_LIKE_SESSION_COOKIE_NAME)?.value ?? null;
  const likeIdentityHash = getBlogLikeIdentityHash({
    readerId: reader?.id,
    sessionToken: likeSessionToken,
  });
  const liked = likeIdentityHash ? await hasPostLike(post.id, likeIdentityHash) : false;

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
        <Link href="/">{t("home")}</Link> <span className="mx-1">/</span> <Link href="/blog">{t("blog")}</Link>
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
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
              style={getCategoryBadgeStyle(post.category.color)}
            >
              {getBlogCategoryDisplayName(post.category, locale)}
            </span>

            <h1 className="text-3xl font-black leading-tight tracking-[-0.02em] text-slate-900 sm:text-4xl">{post.titleVi}</h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{post.author.displayName}</span>
              <span>·</span>
              <span>{formatDate(post.publishedAt, locale)}</span>
              <span>·</span>
              <span>{translate("blog.chrome.card.minRead", { count: post.readingTimeMin }, locale)}</span>
            </div>

            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            <BlogAuthorCard author={post.author} />

            <div className="flex flex-wrap items-center gap-3">
              <BlogShare url={articleUrl} title={post.titleVi} />
              <BlogLikeButton
                slug={post.slug}
                initialLikeCount={post.likeCount}
                initialLiked={liked}
              />
              <BlogBookmarkButton
                postId={post.id}
                initialBookmarked={bookmarkStatus.bookmarked}
              />
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <BlogToc headings={headings} />
        </aside>
      </div>

      {post.relatedPosts.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900">{t("related")}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {post.relatedPosts.map((relatedPost: typeof post.relatedPosts[number]) => (
              <BlogCard key={relatedPost.id} post={relatedPost} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="comments">
        <BlogCommentsSection slug={slug} />
      </section>

      <div>
        <Link
          href="/blog"
          className="inline-flex items-center text-sm font-semibold text-teal-700 transition hover:text-teal-800"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}



