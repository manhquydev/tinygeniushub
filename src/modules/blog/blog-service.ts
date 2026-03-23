import { BlogPostStatus, type Prisma } from "@prisma/client";
import { invalidateBlogCache } from "@/lib/blog-cache";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { renderMarkdown } from "@/modules/blog/blog-markdown";
import * as blogRepository from "@/modules/blog/blog-repository";
import {
  createVersion,
  deleteOldVersions,
  findVersionsByPostId,
  type BlogPostVersionSnapshot,
} from "@/modules/blog/blog-version-repository";
import { notifyNewPost } from "@/modules/reader/reader-service";
import { refreshRelatedPosts } from "@/modules/blog/related-posts-service";
import type {
  BlogListParams,
  BlogListResult,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "@/modules/blog/blog-types";

function toVersionSnapshot(input: {
  titleVi: string;
  contentMarkdown: string;
  excerptVi: string;
  metaTitleVi: string | null;
  metaDescVi: string | null;
  coverImageUrl: string | null;
  status: BlogPostStatus;
}): BlogPostVersionSnapshot {
  return {
    titleVi: input.titleVi,
    contentMarkdown: input.contentMarkdown,
    excerptVi: input.excerptVi,
    metaTitleVi: input.metaTitleVi,
    metaDescVi: input.metaDescVi,
    coverImageUrl: input.coverImageUrl,
    status: input.status,
  };
}

async function findPostVersionSourceById(id: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;

  return db.blogPost.findUnique({
    where: { id },
    select: {
      id: true,
      titleVi: true,
      contentMarkdown: true,
      excerptVi: true,
      metaTitleVi: true,
      metaDescVi: true,
      coverImageUrl: true,
      status: true,
    },
  });
}

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
    throw new DomainError(
      "Search query must be between 2 and 100 characters",
      400,
      "INVALID_SEARCH_QUERY",
    );
  }

  return blogRepository.searchPosts(normalized, 20);
}

async function createPost(input: CreateBlogPostInput, adminEmail?: string) {
  void adminEmail;
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

async function updatePost(input: UpdateBlogPostInput, adminEmail?: string) {
  const existingPost = await findPostVersionSourceById(input.id);
  if (!existingPost) {
    throw new DomainError("Blog post not found", 404, "BLOG_POST_NOT_FOUND");
  }

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

  const updated = await blogRepository.updatePost(input);
  if (existingPost.status !== updated.status) {
    await createVersion(updated.id, toVersionSnapshot(updated), adminEmail);
    await deleteOldVersions(updated.id, 50);
  }

  await invalidateBlogCache("*");
  return updated;
}

async function publishPost(id: string, adminEmail?: string) {
  const published = await prisma.$transaction(async (tx) => {
    const existingPost = await findPostVersionSourceById(id, tx);
    if (!existingPost) {
      throw new DomainError("Blog post not found", 404, "BLOG_POST_NOT_FOUND");
    }

    const publishedPost = await tx.blogPost.update({
      where: { id },
      data: {
        status: BlogPostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        publishedAt: true,
        status: true,
        titleVi: true,
        contentMarkdown: true,
        excerptVi: true,
        metaTitleVi: true,
        metaDescVi: true,
        coverImageUrl: true,
      },
    });

    if (existingPost.status !== publishedPost.status) {
      await createVersion(id, toVersionSnapshot(publishedPost), adminEmail, tx);
    }

    return {
      id: publishedPost.id,
      publishedAt: publishedPost.publishedAt,
      status: publishedPost.status,
    };
  });

  await deleteOldVersions(id, 50);
  await notifyNewPost(id);
  await refreshRelatedPosts(id);
  await invalidateBlogCache("*");
  return published;
}

async function listPostVersions(postId: string, limit = 20) {
  return findVersionsByPostId(postId, limit);
}

async function saveCurrentPostVersion(postId: string, adminEmail?: string) {
  const post = await findPostVersionSourceById(postId);
  if (!post) {
    throw new DomainError("Blog post not found", 404, "BLOG_POST_NOT_FOUND");
  }

  const version = await createVersion(postId, toVersionSnapshot(post), adminEmail);
  await deleteOldVersions(postId, 50);
  return version;
}

export const blogService = {
  getPostBySlug,
  listPosts,
  getFeaturedPosts,
  searchPosts,
  createPost,
  updatePost,
  publishPost,
  listPostVersions,
  saveCurrentPostVersion,
};

export {
  createPost,
  getFeaturedPosts,
  getPostBySlug,
  listPostVersions,
  listPosts,
  publishPost,
  saveCurrentPostVersion,
  searchPosts,
  updatePost,
};
