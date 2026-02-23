import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

function createToken() {
  return randomUUID().replace(/-/g, "");
}

async function subscribe(email: string, opts?: { nameVi?: string }): Promise<{ token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const token = createToken();

  await prisma.blogNewsletterSubscriber.upsert({
    where: {
      email: normalizedEmail,
    },
    create: {
      email: normalizedEmail,
      nameVi: opts?.nameVi,
      verified: false,
      verifyToken: token,
    },
    update: {
      nameVi: opts?.nameVi,
      verified: false,
      verifyToken: token,
      unsubscribedAt: null,
    },
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

async function getActiveSubscribers(): Promise<Array<{ id: string; email: string; nameVi: string | null }>> {
  return prisma.blogNewsletterSubscriber.findMany({
    where: {
      verified: true,
      unsubscribedAt: null,
    },
    orderBy: {
      subscribedAt: "asc",
    },
    select: {
      id: true,
      email: true,
      nameVi: true,
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

