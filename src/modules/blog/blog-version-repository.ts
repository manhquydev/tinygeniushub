import type { BlogPostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BlogPostVersionSnapshot = {
  titleVi: string;
  contentMarkdown: string;
  excerptVi: string;
  metaTitleVi?: string | null;
  metaDescVi?: string | null;
  coverImageUrl?: string | null;
  status: BlogPostStatus;
};

export async function createVersion(
  postId: string,
  snapshot: BlogPostVersionSnapshot,
  savedBy?: string | null,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  return db.blogPostVersion.create({
    data: {
      postId,
      titleVi: snapshot.titleVi,
      contentMarkdown: snapshot.contentMarkdown,
      excerptVi: snapshot.excerptVi,
      metaTitleVi: snapshot.metaTitleVi ?? null,
      metaDescVi: snapshot.metaDescVi ?? null,
      coverImageUrl: snapshot.coverImageUrl ?? null,
      status: snapshot.status,
      savedBy: savedBy ?? null,
    },
    select: {
      id: true,
      postId: true,
      titleVi: true,
      contentMarkdown: true,
      excerptVi: true,
      metaTitleVi: true,
      metaDescVi: true,
      coverImageUrl: true,
      status: true,
      savedBy: true,
      createdAt: true,
    },
  });
}

export async function findVersionsByPostId(postId: string, limit = 20) {
  const take = Math.min(Math.max(limit, 1), 100);
  return prisma.blogPostVersion.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      postId: true,
      titleVi: true,
      contentMarkdown: true,
      excerptVi: true,
      metaTitleVi: true,
      metaDescVi: true,
      coverImageUrl: true,
      status: true,
      savedBy: true,
      createdAt: true,
    },
  });
}

export async function findVersionById(versionId: string) {
  return prisma.blogPostVersion.findUnique({
    where: { id: versionId },
    select: {
      id: true,
      postId: true,
      titleVi: true,
      contentMarkdown: true,
      excerptVi: true,
      metaTitleVi: true,
      metaDescVi: true,
      coverImageUrl: true,
      status: true,
      savedBy: true,
      createdAt: true,
    },
  });
}

export async function deleteOldVersions(postId: string, keepCount = 50) {
  const keep = Math.max(keepCount, 1);
  const outdated = await prisma.blogPostVersion.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    skip: keep,
    select: { id: true },
  });

  if (outdated.length === 0) {
    return 0;
  }

  const deleted = await prisma.blogPostVersion.deleteMany({
    where: {
      id: {
        in: outdated.map((item) => item.id),
      },
    },
  });

  return deleted.count;
}
