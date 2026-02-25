import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");

  const items: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/pricing`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/referral`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/refund-policy`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/courses`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const [posts, categories] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      prisma.blogCategory.findMany({
        where: {
          active: true,
        },
        select: {
          slug: true,
          createdAt: true,
        },
      }),
    ]);

    for (const post of posts) {
      items.push({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const category of categories) {
      items.push({
        url: `${siteUrl}/blog/category/${category.slug}`,
        lastModified: category.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    return items;
  }

  return items;
}
