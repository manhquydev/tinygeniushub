import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { enqueueVerifyBlogNewsletterEmail } from "@/worker/queue";

function createToken() {
  return randomUUID().replace(/-/g, "");
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function subscribe(email: string, opts?: { nameVi?: string }): Promise<{ token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  let existing = await prisma.blogNewsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      nameVi: true,
      verified: true,
      unsubscribedAt: true,
      verifyToken: true,
    },
  });

  if (!existing) {
    const token = createToken();
    try {
      const created = await prisma.blogNewsletterSubscriber.create({
        data: {
          email: normalizedEmail,
          nameVi: opts?.nameVi,
          verified: false,
          verifyToken: token,
        },
        select: {
          id: true,
          email: true,
          nameVi: true,
        },
      });

      await enqueueVerifyBlogNewsletterEmail({
        subscriberId: created.id,
        email: created.email,
        nameVi: created.nameVi,
        verifyToken: token,
      });

      return { token };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      existing = await prisma.blogNewsletterSubscriber.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          nameVi: true,
          verified: true,
          unsubscribedAt: true,
          verifyToken: true,
        },
      });

      if (!existing) {
        throw error;
      }
    }
  }

  if (!existing) {
    throw new Error("Newsletter subscriber lookup failed");
  }

  const isActiveVerified = existing.verified && existing.unsubscribedAt === null;
  if (isActiveVerified) {
    await prisma.blogNewsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        nameVi: opts?.nameVi,
      },
      select: { id: true },
    });
    return { token: "" };
  }

  if (!existing.verified && existing.unsubscribedAt === null && existing.verifyToken) {
    await prisma.blogNewsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        nameVi: opts?.nameVi,
      },
      select: {
        id: true,
      },
    });

    await enqueueVerifyBlogNewsletterEmail({
      subscriberId: existing.id,
      email: existing.email,
      nameVi: opts?.nameVi ?? existing.nameVi,
      verifyToken: existing.verifyToken,
    });

    return { token: existing.verifyToken };
  }

  const token = createToken();
  const updated = await prisma.blogNewsletterSubscriber.update({
    where: { id: existing.id },
    data: {
      nameVi: opts?.nameVi,
      verified: false,
      verifyToken: token,
      unsubscribedAt: null,
    },
    select: {
      id: true,
      email: true,
      nameVi: true,
    },
  });

  await enqueueVerifyBlogNewsletterEmail({
    subscriberId: updated.id,
    email: updated.email,
    nameVi: updated.nameVi,
    verifyToken: token,
  });

  return { token };
}

async function verifySubscription(token: string): Promise<boolean> {
  const subscriber = await prisma.blogNewsletterSubscriber.findFirst({
    where: {
      verifyToken: token,
    },
    select: {
      id: true,
    },
  });

  if (!subscriber) {
    return false;
  }

  await prisma.blogNewsletterSubscriber.update({
    where: {
      id: subscriber.id,
    },
    data: {
      verified: true,
      verifyToken: null,
    },
  });

  return true;
}

async function unsubscribe(token: string): Promise<void> {
  const subscriber = await prisma.blogNewsletterSubscriber.findFirst({
    where: {
      unsubToken: token,
    },
    select: {
      id: true,
    },
  });

  if (!subscriber) {
    return;
  }

  await prisma.blogNewsletterSubscriber.update({
    where: {
      id: subscriber.id,
    },
    data: {
      unsubscribedAt: new Date(),
    },
  });
}

async function getActiveSubscribers(options?: {
  lastEmailAtBefore?: Date;
}): Promise<Array<{ id: string; email: string; nameVi: string | null; lastEmailAt: Date | null }>> {
  return prisma.blogNewsletterSubscriber.findMany({
    where: {
      verified: true,
      unsubscribedAt: null,
      ...(options?.lastEmailAtBefore
        ? {
            OR: [
              {
                lastEmailAt: null,
              },
              {
                lastEmailAt: {
                  lt: options.lastEmailAtBefore,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      subscribedAt: "asc",
    },
    select: {
      id: true,
      email: true,
      nameVi: true,
      lastEmailAt: true,
    },
  });
}

export const newsletterService = {
  subscribe,
  verifySubscription,
  unsubscribe,
  getActiveSubscribers,
};

export { getActiveSubscribers, subscribe, unsubscribe, verifySubscription };

