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
      name: "Cùng Con T? H?c",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo-cungcontuhoc-horizontal.svg`,
      },
    },
    mainEntityOfPage: canonicalUrl,
  };

  return JSON.stringify(jsonLd);
}

export function generateBlogListMetadata(): Metadata {
  return {
    title: "Blog Cùng Con T? H?c",
    description: "Ki?n th?c, phuong pháp và tài nguyên giúp ph? huynh d?ng hành cùng bé h?c t?i nhà.",
    openGraph: {
      title: "Blog Cùng Con T? H?c",
      description: "Ki?n th?c, phuong pháp và tài nguyên giúp ph? huynh d?ng hành cùng bé h?c t?i nhà.",
      type: "website",
      url: "/blog",
    },
  };
}

