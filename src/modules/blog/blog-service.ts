import { BlogPostStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { renderMarkdown } from "@/modules/blog/blog-markdown";
import * as blogRepository from "@/modules/blog/blog-repository";
import { refreshRelatedPosts } from "@/modules/blog/related-posts-service";
import type { BlogListParams, BlogListResult, CreateBlogPostInput, UpdateBlogPostInput } from "@/modules/blog/blog-types";

async function getPostBySlug(slug: string) {
  const post = await blogRepository.findPostBySlug(slug);
  if (!post) {
    return null;
  }

  if (post.contentHtml.trim().length > 0) {
    return post;
  }

  const renderedHtml = await renderMarkdown(post.contentMarkdown);
  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      contentHtml: renderedHtml,
    },
  });

  return {
    ...post,
    contentHtml: renderedHtml,
  };
}

async function listPosts(params: BlogListParams): Promise<BlogListResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 12));

  const { posts, total } = await blogRepository.findPosts({
    ...params,
    page,
    limit,
  });

  return {
    posts,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    page,
  };
}

async function getFeaturedPosts() {
  return blogRepository.findFeaturedPosts(3);
}

async function searchPosts(query: string) {
  const normalized = query.trim();
  if (normalized.length < 2 || normalized.length > 100) {
    throw new DomainError("Search query must be between 2 and 100 characters", 400, "INVALID_SEARCH_QUERY");
  }

  return blogRepository.searchPosts(normalized, 20);
}

async function createPost(input: CreateBlogPostInput, _adminEmail?: string) {
  const existing = await prisma.blogPost.count({
    where: {
      slug: input.slug,
    },
  });

  if (existing > 0) {
    throw new DomainError("Slug already exists", 409, "BLOG_POST_SLUG_EXISTS");
  }

  return blogRepository.createPost(input);
}

async function updatePost(input: UpdateBlogPostInput, _adminEmail?: string) {
  if (input.slug) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug: input.slug,
        id: {
          not: input.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new DomainError("Slug already exists", 409, "BLOG_POST_SLUG_EXISTS");
    }
  }

  return blogRepository.updatePost(input);
}

async function publishPost(id: string, _adminEmail?: string) {
  const published = await prisma.blogPost.update({
    where: { id },
    data: {
      status: BlogPostStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    select: {
      id: true,
      publishedAt: true,
      status: true,
    },
  });

  await refreshRelatedPosts(id);
  return published;
}

export const blogService = {
  getPostBySlug,
  listPosts,
  getFeaturedPosts,
  searchPosts,
  createPost,
  updatePost,
  publishPost,
};

export {
  createPost,
  getFeaturedPosts,
  getPostBySlug,
  listPosts,
  publishPost,
  searchPosts,
  updatePost,
};

