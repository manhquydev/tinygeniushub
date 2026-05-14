import { BlogPostStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toRssDate(value: Date | null | undefined) {
  return (value ?? new Date()).toUTCString();
}

function buildRssXml(input: {
  siteUrl: string;
  posts: Array<{
    slug: string;
    titleVi: string;
    excerptVi: string;
    contentHtml: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    categoryNameVi: string;
    authorDisplayName: string;
  }>;
}) {
  const itemsXml = input.posts
    .map((post) => {
      const postUrl = `${input.siteUrl}/blog/${post.slug}`;
      const summary = post.excerptVi.trim();
      const content = (post.contentHtml?.trim() || summary).slice(0, 12_000);

      return `<item>
  <title>${escapeXml(post.titleVi)}</title>
  <link>${escapeXml(postUrl)}</link>
  <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
  <description>${escapeXml(summary)}</description>
  <content:encoded><![CDATA[${content}]]></content:encoded>
  <pubDate>${toRssDate(post.publishedAt)}</pubDate>
  <category>${escapeXml(post.categoryNameVi)}</category>
  <author>${escapeXml(post.authorDisplayName)}</author>
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>TinyGenius Hub Blog</title>
  <link>${escapeXml(`${input.siteUrl}/blog`)}</link>
  <description>Latest article from TinyGenius Hub.</description>
  <language>en</language>
  <lastBuildDate>${toRssDate(new Date())}</lastBuildDate>
${itemsXml}
</channel>
</rss>`;
}

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { status: BlogPostStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 20,
    select: {
      slug: true,
      titleVi: true,
      excerptVi: true,
      contentHtml: true,
      publishedAt: true,
      updatedAt: true,
      category: {
        select: {
          nameVi: true,
        },
      },
      author: {
        select: {
          displayName: true,
        },
      },
    },
  });

  const siteUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const xml = buildRssXml({
    siteUrl,
    posts: posts.map((post) => ({
      slug: post.slug,
      titleVi: post.titleVi,
      excerptVi: post.excerptVi,
      contentHtml: post.contentHtml,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      categoryNameVi: post.category.nameVi,
      authorDisplayName: post.author.displayName,
    })),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
