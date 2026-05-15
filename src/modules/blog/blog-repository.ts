import { createHash } from "node:crypto";
import { BlogPostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { calculateReadingTime } from "@/modules/blog/blog-markdown";
import type {
  BlogAuthor,
  BlogCategory,
  BlogListParams,
  BlogPostCardDTO,
  BlogPostFullDTO,
  BlogTag,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "@/modules/blog/blog-types";

const postCardSelect = {
  id: true,
  slug: true,
  type: true,
  status: true,
  titleVi: true,
  excerptVi: true,
  coverImageUrl: true,
  publishedAt: true,
  readingTimeMin: true,
  viewCount: true,
  likeCount: true,
  ageGroup: true,
  author: {
    select: {
      displayName: true,
      avatarUrl: true,
      slug: true,
      role: true,
      bio: true,
      linkedinUrl: true,
    },
  },
  category: {
    select: {
      nameVi: true,
      nameEn: true,
      slug: true,
      emoji: true,
      color: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          slug: true,
          nameVi: true,
        },
      },
    },
  },
} satisfies Prisma.BlogPostSelect;

const postFullSelect = {
  ...postCardSelect,
  contentMarkdown: true,
  contentHtml: true,
  metaTitleVi: true,
  metaDescVi: true,
  ogImageUrl: true,
  structuredData: true,
  isFeatured: true,
  isPinned: true,
  coAuthorIds: true,
  relatedPosts: {
    where: {
      relatedPost: {
        status: BlogPostStatus.PUBLISHED,
      },
    },
    take: 3,
    select: {
      relatedPost: {
        select: postCardSelect,
      },
    },
  },
} satisfies Prisma.BlogPostSelect;

type PostCardRow = Prisma.BlogPostGetPayload<{ select: typeof postCardSelect }>;
type PostFullRow = Prisma.BlogPostGetPayload<{ select: typeof postFullSelect }>;

export const BLOG_LIKE_SESSION_COOKIE_NAME = "ccth_blog_like_session";

function mapPostCard(row: PostCardRow): BlogPostCardDTO {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    status: row.status,
    titleVi: row.titleVi,
    excerptVi: row.excerptVi,
    coverImageUrl: row.coverImageUrl,
    publishedAt: row.publishedAt,
    readingTimeMin: row.readingTimeMin,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    ageGroup: row.ageGroup,
    author: {
      displayName: row.author.displayName,
      avatarUrl: row.author.avatarUrl,
      slug: row.author.slug,
      role: row.author.role,
      bio: row.author.bio,
      linkedinUrl: row.author.linkedinUrl,
    },
    category: {
      nameVi: row.category.nameVi,
      nameEn: row.category.nameEn,
      slug: row.category.slug,
      emoji: row.category.emoji,
      color: row.category.color,
    },
    tags: row.tags.map((entry) => ({
      slug: entry.tag.slug,
      nameVi: entry.tag.nameVi,
    })),
  };
}

function mapPostFull(row: PostFullRow): BlogPostFullDTO {
  return {
    ...mapPostCard(row),
    contentMarkdown: row.contentMarkdown,
    contentHtml: row.contentHtml ?? "",
    metaTitleVi: row.metaTitleVi,
    metaDescVi: row.metaDescVi,
    ogImageUrl: row.ogImageUrl,
    structuredData: row.structuredData,
    isFeatured: row.isFeatured,
    isPinned: row.isPinned,
    coAuthorIds: row.coAuthorIds,
    relatedPosts: row.relatedPosts.map((entry) => mapPostCard(entry.relatedPost)),
  };
}

function buildPublishedFilters(params: BlogListParams): Prisma.BlogPostWhereInput {
  const filters: Prisma.BlogPostWhereInput = {
    status: BlogPostStatus.PUBLISHED,
  };

  if (params.category) {
    filters.category = { slug: params.category };
  }

  if (params.tag) {
    filters.tags = {
      some: {
        tag: {
          slug: params.tag,
        },
      },
    };
  }

  if (params.author) {
    filters.author = { slug: params.author };
  }

  if (params.ageGroup) {
    filters.ageGroup = params.ageGroup;
  }

  if (params.type) {
    filters.type = params.type;
  }

  if (params.featured === true) {
    filters.isFeatured = true;
    filters.OR = [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }];
  }

  return filters;
}

function buildSortOrder(sort: BlogListParams["sort"]): Prisma.BlogPostOrderByWithRelationInput[] {
  if (sort === "popular") {
    return [{ viewCount: "desc" }, { publishedAt: "desc" }];
  }

  if (sort === "trending") {
    return [{ likeCount: "desc" }, { viewCount: "desc" }, { publishedAt: "desc" }];
  }

  return [{ publishedAt: "desc" }];
}

async function findPostByIdWithRelations(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<BlogPostFullDTO> {
  const post = await tx.blogPost.findUnique({
    where: { id },
    select: postFullSelect,
  });

  if (!post) {
    throw new Error("Blog post not found after write operation");
  }

  return mapPostFull(post);
}

function isUniqueLikeError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export function getBlogLikeIdentityHash(input: {
  readerId?: string | null;
  sessionToken?: string | null;
}) {
  if (input.readerId && input.readerId.trim().length > 0) {
    return `reader:${createHash("sha256").update(`reader:${input.readerId}`).digest("hex")}`;
  }

  if (input.sessionToken && input.sessionToken.trim().length > 0) {
    return `session:${createHash("sha256").update(input.sessionToken).digest("hex")}`;
  }

  return null;
}

export async function findPostBySlug(slug: string): Promise<BlogPostFullDTO | null> {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: BlogPostStatus.PUBLISHED,
    },
    select: postFullSelect,
  });

  return post ? mapPostFull(post) : null;
}

export async function findPosts(
  params: BlogListParams,
): Promise<{ posts: BlogPostCardDTO[]; total: number }> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  const where = buildPublishedFilters(params);
  const orderBy = buildSortOrder(params.sort);

  const [posts, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: postCardSelect,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts: posts.map(mapPostCard),
    total,
  };
}

export async function findFeaturedPosts(limit: number): Promise<BlogPostCardDTO[]> {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: BlogPostStatus.PUBLISHED,
      isFeatured: true,
      OR: [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }],
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: postCardSelect,
  });

  return posts.map(mapPostCard);
}

export async function findTrendingPosts(limit: number): Promise<BlogPostCardDTO[]> {
  const clampedLimit = Math.min(Math.max(limit, 1), 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const posts = await prisma.blogPost.findMany({
    where: {
      status: BlogPostStatus.PUBLISHED,
      publishedAt: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: clampedLimit,
    select: postCardSelect,
  });

  return posts.map(mapPostCard);
}

export async function findCategories(): Promise<BlogCategory[]> {
  return prisma.blogCategory.findMany({
    where: { active: true },
    orderBy: { orderNo: "asc" },
    select: {
      id: true,
      slug: true,
      nameVi: true,
      nameEn: true,
      description: true,
      emoji: true,
      color: true,
      parentId: true,
      orderNo: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function findTags(): Promise<BlogTag[]> {
  return prisma.blogTag.findMany({
    orderBy: [{ nameVi: "asc" }],
    select: {
      id: true,
      slug: true,
      nameVi: true,
      createdAt: true,
    },
  });
}

export async function findAuthors(): Promise<BlogAuthor[]> {
  return prisma.blogAuthor.findMany({
    where: { active: true },
    orderBy: [{ displayName: "asc" }],
    select: {
      id: true,
      slug: true,
      displayName: true,
      role: true,
      bio: true,
      avatarUrl: true,
      linkedinUrl: true,
      email: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function incrementViewCount(postId: string): Promise<void> {
  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      viewCount: { increment: 1 },
    },
  });
}

export async function incrementLikeCount(postId: string): Promise<number> {
  const updated = await prisma.blogPost.update({
    where: { id: postId },
    data: {
      likeCount: { increment: 1 },
    },
    select: {
      likeCount: true,
    },
  });

  return updated.likeCount;
}

export async function hasPostLike(postId: string, identityHash: string) {
  const like = await prisma.blogPostLike.findUnique({
    where: {
      postId_identityHash: {
        postId,
        identityHash,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(like);
}

export async function registerPostLike(
  postId: string,
  identityHash: string,
): Promise<{ likeCount: number; created: boolean }> {
  try {
    const likeCount = await prisma.$transaction(async (tx) => {
      await tx.blogPostLike.create({
        data: {
          postId,
          identityHash,
        },
        select: {
          id: true,
        },
      });

      const updated = await tx.blogPost.update({
        where: { id: postId },
        data: {
          likeCount: { increment: 1 },
        },
        select: {
          likeCount: true,
        },
      });

      return updated.likeCount;
    });

    return { likeCount, created: true };
  } catch (error) {
    if (!isUniqueLikeError(error)) {
      throw error;
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: {
        likeCount: true,
      },
    });

    if (!post) {
      throw new DomainError("Blog post not found", 404, "BLOG_POST_NOT_FOUND");
    }

    return { likeCount: post.likeCount, created: false };
  }
}

export async function searchPosts(query: string, limit: number): Promise<BlogPostCardDTO[]> {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: BlogPostStatus.PUBLISHED,
      OR: [
        {
          titleVi: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          excerptVi: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: postCardSelect,
  });

  return posts.map(mapPostCard);
}

export async function findPostById(id: string): Promise<BlogPostFullDTO | null> {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: postFullSelect,
  });

  return post ? mapPostFull(post) : null;
}

export async function createPost(input: CreateBlogPostInput): Promise<BlogPostFullDTO> {
  const created = await prisma.$transaction(async (tx) => {
    const post = await tx.blogPost.create({
      data: {
        slug: input.slug,
        type: input.type,
        titleVi: input.titleVi,
        titleEn: input.titleEn,
        excerptVi: input.excerptVi,
        contentMarkdown: input.contentMarkdown,
        contentHtml: null,
        coverImageUrl: input.coverImageUrl,
        categoryId: input.categoryId,
        authorId: input.authorId,
        ageGroup: input.ageGroup,
        metaTitleVi: input.metaTitleVi,
        metaDescVi: input.metaDescVi,
        readingTimeMin: calculateReadingTime(input.contentMarkdown),
        status: input.status,
        scheduledAt: input.scheduledAt,
        tags: {
          create: input.tagIds.map((tagId) => ({
            tag: {
              connect: {
                id: tagId,
              },
            },
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return findPostByIdWithRelations(tx, post.id);
  });

  return created;
}

export async function updatePost(input: UpdateBlogPostInput): Promise<BlogPostFullDTO> {
  return prisma.$transaction(async (tx) => {
    const data: Prisma.BlogPostUpdateInput = {};

    if (input.slug !== undefined) data.slug = input.slug;
    if (input.type !== undefined) data.type = input.type;
    if (input.titleVi !== undefined) data.titleVi = input.titleVi;
    if (input.titleEn !== undefined) data.titleEn = input.titleEn;
    if (input.excerptVi !== undefined) data.excerptVi = input.excerptVi;
    if (input.contentMarkdown !== undefined) {
      data.contentMarkdown = input.contentMarkdown;
      data.contentHtml = null;
      data.readingTimeMin = calculateReadingTime(input.contentMarkdown);
    }
    if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl;
    if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
    if (input.authorId !== undefined) data.author = { connect: { id: input.authorId } };
    if (input.ageGroup !== undefined) data.ageGroup = input.ageGroup;
    if (input.metaTitleVi !== undefined) data.metaTitleVi = input.metaTitleVi;
    if (input.metaDescVi !== undefined) data.metaDescVi = input.metaDescVi;
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt;
    if (input.status !== undefined) data.status = input.status;

    await tx.blogPost.update({
      where: { id: input.id },
      data,
      select: { id: true },
    });

    if (input.tagIds !== undefined) {
      await tx.blogPostTag.deleteMany({
        where: {
          postId: input.id,
        },
      });

      if (input.tagIds.length > 0) {
        await tx.blogPostTag.createMany({
          data: input.tagIds.map((tagId) => ({
            postId: input.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return findPostByIdWithRelations(tx, input.id);
  });
}

