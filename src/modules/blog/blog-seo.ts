import type { Metadata } from "next";
import type { BlogPostFullDTO } from "@/modules/blog/blog-types";

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/$/, "");
}

export function generateBlogPostMetadata(post: BlogPostFullDTO, siteUrl: string): Metadata {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const title = post.metaTitleVi ?? post.titleVi;
  const description = post.metaDescVi ?? post.excerptVi;
  const imageUrl = post.ogImageUrl ?? post.coverImageUrl ?? `${baseUrl}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      images: [{ url: imageUrl }],
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",

      title,
      description,
      images: [imageUrl],
    },
  };
}

export function generateBlogPostJsonLd(post: BlogPostFullDTO, siteUrl: string): string {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const imageUrl = post.ogImageUrl ?? post.coverImageUrl ?? `${baseUrl}/og-default.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.titleVi,
    description: post.excerptVi,
    image: [imageUrl],
    datePublished: post.publishedAt?.toISOString() ?? undefined,
    dateModified: post.publishedAt?.toISOString() ?? undefined,
    author: {
      "@type": "Person",
      name: post.author.displayName,
    },
    publisher: {
      "@type": "Organization",
      name: "TinyGeniusHub",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logos/tinygeniushub_logo_horizon.png`,
      },
    },
    mainEntityOfPage: canonicalUrl,
  };

  return JSON.stringify(jsonLd);
}

export function generateBlogListMetadata(): Metadata {
  return {
    title: "Blog TinyGeniusHub",
    description: "Knowledge, methods and resources help parents accompany their children to learn at home.",
    alternates: {
      canonical: "/blog",
    },
    openGraph: {
      title: "Blog TinyGeniusHub",
      description: "Knowledge, methods and resources help parents accompany their children to learn at home.",
      type: "website",
      url: "/blog",
    },
  };
}

