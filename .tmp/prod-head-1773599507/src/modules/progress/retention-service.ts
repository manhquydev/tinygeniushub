import { prisma } from "@/lib/db";

export async function purgeExpiredPortfolioMedia() {
  const now = new Date();
  const expiredEvidence = await prisma.evidence.findMany({
    where: {
      expiresAt: {
        lte: now,
      },
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (expiredEvidence.length === 0) {
    return { deletedEvidence: 0, deletedMedia: 0 };
  }

  const evidenceIds = expiredEvidence.map((item) => item.id);

  const [mediaResult, evidenceResult] = await prisma.$transaction([
    prisma.evidenceMedia.updateMany({
      where: {
        evidenceId: { in: evidenceIds },
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    }),
    prisma.evidence.updateMany({
      where: {
        id: { in: evidenceIds },
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    }),
  ]);

  return {
    deletedEvidence: evidenceResult.count,
    deletedMedia: mediaResult.count,
  };
}
