import { BlogPostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type ReaderAccountCreateInput = {
  email: string;
  displayName: string;
  passwordHash: string;
};

type ReaderSessionCreateInput = {
  readerId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function findReaderByEmail(email: string) {
  return prisma.readerAccount.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      image: true,
      passwordHash: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findReaderById(readerId: string) {
  return prisma.readerAccount.findUnique({
    where: { id: readerId },
    select: {
      id: true,
      email: true,
      displayName: true,
      image: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createReaderAccount(input: ReaderAccountCreateInput) {
  return prisma.readerAccount.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      image: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateReaderLastLogin(readerId: string) {
  return prisma.readerAccount.update({
    where: { id: readerId },
    data: {
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      image: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createReaderSession(input: ReaderSessionCreateInput) {
  return prisma.readerSession.create({
    data: {
      readerId: input.readerId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
    select: {
      id: true,
      readerId: true,
      tokenHash: true,
      expiresAt: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });
}

export async function findReaderSessionByTokenHash(tokenHash: string) {
  return prisma.readerSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      readerId: true,
      tokenHash: true,
      expiresAt: true,
      reader: {
        select: {
          id: true,
          email: true,
          displayName: true,
          image: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function deleteReaderSessionByTokenHash(tokenHash: string) {
  return prisma.readerSession.deleteMany({
    where: { tokenHash },
  });
}

export async function deleteExpiredReaderSessions() {
  return prisma.readerSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function countReaderBookmarks(readerId: string) {
  return prisma.blogBookmark.count({
    where: {
      readerId,
      post: {
        status: BlogPostStatus.PUBLISHED,
      },
    },
  });
}

export async function upsertReaderBookmark(readerId: string, postId: string) {
  return prisma.blogBookmark.upsert({
    where: {
      readerId_postId: {
        readerId,
        postId,
      },
    },
    create: {
      readerId,
      postId,
    },
    update: {},
    select: {
      id: true,
      readerId: true,
      postId: true,
      createdAt: true,
    },
  });
}

export async function deleteReaderBookmark(readerId: string, postId: string) {
  return prisma.blogBookmark.deleteMany({
    where: {
      readerId,
      postId,
    },
  });
}

export async function isReaderBookmarkedPost(readerId: string, postId: string) {
  const bookmark = await prisma.blogBookmark.findUnique({
    where: {
      readerId_postId: {
        readerId,
        postId,
      },
    },
    select: { id: true },
  });
  return Boolean(bookmark);
}

export async function findReaderBookmarks(readerId: string, limit = 20, page = 1) {
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  const where = {
    readerId,
    post: {
      status: BlogPostStatus.PUBLISHED,
    },
  } satisfies Prisma.BlogBookmarkWhereInput;

  const [items, total] = await prisma.$transaction([
    prisma.blogBookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            slug: true,
            titleVi: true,
            excerptVi: true,
            coverImageUrl: true,
            publishedAt: true,
            readingTimeMin: true,
            status: true,
            category: {
              select: {
                nameVi: true,
                slug: true,
              },
            },
            author: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    }),
    prisma.blogBookmark.count({ where }),
  ]);

  return {
    total,
    items: items.map((item: {
        id: string;
        createdAt: Date;
        post: {
          id: string;
          slug: string;
          titleVi: string;
          excerptVi: string;
          coverImageUrl: string | null;
          publishedAt: Date | null;
          readingTimeMin: number;
          category: { nameVi: string; slug: string };
          author: { displayName: string };
        };
      }) => ({
        id: item.id,
        bookmarkedAt: item.createdAt,
        post: {
          id: item.post.id,
          slug: item.post.slug,
          titleVi: item.post.titleVi,
          excerptVi: item.post.excerptVi,
          coverImageUrl: item.post.coverImageUrl,
          publishedAt: item.post.publishedAt,
          readingTimeMin: item.post.readingTimeMin,
          category: item.post.category,
          author: item.post.author,
        },
      })),
  };
}

export async function createReaderNotification(input: {
  readerId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  payload?: Prisma.InputJsonValue;
}) {
  return prisma.blogReaderNotification.create({
    data: {
      readerId: input.readerId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      payload: input.payload,
    },
    select: {
      id: true,
      readerId: true,
      type: true,
      title: true,
      message: true,
      link: true,
      payload: true,
      isRead: true,
      createdAt: true,
      readAt: true,
    },
  });
}

export async function createReaderNotifications(
  items: Array<{
    readerId: string;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    payload?: Prisma.InputJsonValue;
  }>,
) {
  if (items.length === 0) {
    return { count: 0 };
  }
  return prisma.blogReaderNotification.createMany({
    data: items.map((item) => ({
      readerId: item.readerId,
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link ?? null,
      payload: item.payload,
    })),
  });
}

export async function findReaderNotifications(readerId: string, limit = 10) {
  const take = Math.min(Math.max(limit, 1), 50);
  return prisma.blogReaderNotification.findMany({
    where: { readerId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      payload: true,
      isRead: true,
      createdAt: true,
      readAt: true,
    },
  });
}

export async function countReaderUnreadNotifications(readerId: string) {
  return prisma.blogReaderNotification.count({
    where: {
      readerId,
      isRead: false,
    },
  });
}

export async function markReaderNotificationRead(readerId: string, notificationId: string) {
  return prisma.blogReaderNotification.updateMany({
    where: {
      id: notificationId,
      readerId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllReaderNotificationsRead(readerId: string) {
  return prisma.blogReaderNotification.updateMany({
    where: {
      readerId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function findReadersInterestedInCategory(categoryId: string, limit = 1000) {
  const readers = await prisma.blogBookmark.findMany({
    where: {
      post: {
        categoryId,
      },
    },
    distinct: ["readerId"],
    take: Math.min(Math.max(limit, 1), 5000),
    select: {
      readerId: true,
    },
  });

  return readers.map((item: { readerId: string }) => item.readerId);
}
