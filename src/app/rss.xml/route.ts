import * as blogRepository from "@/modules/blog/blog-repository";

function escapeForCdata(value: string) {
  return value.replaceAll("]]>", "]]]]><![CDATA[>");
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tinygeniushubvn.tech";
  const channelTitle = "TinyGenius Hub - Blog";
  const channelDescription =
    "Practical guidance for parents supporting children ages 2-6.";

  try {
    const { posts } = await blogRepository.findPosts({
      limit: 20,
      page: 1,
    });

    const items = posts
      .flatMap((post) => {
        if (!post.publishedAt) {
          return [];
        }

        return `
    <item>
      <title><![CDATA[${escapeForCdata(post.titleVi)}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${escapeForCdata(post.excerptVi)}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    </item>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${siteUrl}/blog</link>
    <description>${channelDescription}</description>
    <language>en</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new Response("<?xml version=\"1.0\"?><rss version=\"2.0\"><channel><title>Error</title></channel></rss>", {
      status: 500,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }
}
