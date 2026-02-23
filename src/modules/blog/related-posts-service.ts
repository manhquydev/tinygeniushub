import { prisma } from "@/lib/db";

/**
 * Auto-populates BlogPostRelation for a post based on shared tags and category.
 * Call this after creating/publishing a post.
 * Finds up to 5 most related posts (by shared tags count, then same category).
 */
export async function refreshRelatedPosts(postId: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: { tags: true },
  });
  if (!post) {
    return;
  }

  const tagIds = post.tags.map((tag) => tag.tagId);

  const candidates = await prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: "PUBLISHED",
      OR: [
        { categoryId: post.categoryId },
        ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    include: { tags: { select: { tagId: true } } },
    take: 20,
    orderBy: { viewCount: "desc" },
  });

  const scored = candidates.map((candidate) => {
    const sharedTags = candidate.tags.filter((tag) => tagIds.includes(tag.tagId)).length;
    const sameCategory = candidate.categoryId === post.categoryId ? 1 : 0;
    return { id: candidate.id, score: sharedTags * 2 + sameCategory };
  });

  scored.sort((a, b) => b.score - a.score);
  const top5 = scored.slice(0, 5);

  await prisma.$transaction([
    prisma.blogPostRelation.deleteMany({ where: { sourcePostId: postId } }),
    ...(top5.length > 0
      ? [
          prisma.blogPostRelation.createMany({
            data: top5.map((related) => ({ sourcePostId: postId, relatedPostId: related.id })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}
