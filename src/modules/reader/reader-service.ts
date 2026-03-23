import { BlogPostStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import {
  countReaderBookmarks,
  createReaderNotification,
  createReaderNotifications,
  deleteReaderBookmark,
  findReaderBookmarks,
  findReaderByEmail,
  findReaderNotifications,
  findReadersInterestedInCategory,
  isReaderBookmarkedPost,
  markAllReaderNotificationsRead,
  markReaderNotificationRead,
  countReaderUnreadNotifications,
  upsertReaderBookmark,
} from "@/modules/reader/reader-repository";

const MAX_BOOKMARKS_PER_READER = 100;

export async function addBookmark(readerId: string, postId: string) {
  const [post, bookmarkCount] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        status: true,
      },
    }),
    countReaderBookmarks(readerId),
  ]);

  if (!post || post.status !== BlogPostStatus.PUBLISHED) {
    throw new DomainError("Blog post not found", 404, "BLOG_POST_NOT_FOUND");
  }

  const alreadyBookmarked = await isReaderBookmarkedPost(readerId, postId);
  if (!alreadyBookmarked && bookmarkCount >= MAX_BOOKMARKS_PER_READER) {
    throw new DomainError(
      `Bookmark limit reached (${MAX_BOOKMARKS_PER_READER})`,
      400,
      "BOOKMARK_LIMIT_REACHED",
    );
  }

  return upsertReaderBookmark(readerId, postId);
}

export async function removeBookmark(readerId: string, postId: string) {
  await deleteReaderBookmark(readerId, postId);
  return { removed: true };
}

export async function getBookmarkStatus(readerId: string, postId: string) {
  const bookmarked = await isReaderBookmarkedPost(readerId, postId);
  return { bookmarked };
}

export async function listBookmarks(readerId: string, page = 1, limit = 20) {
  return findReaderBookmarks(readerId, limit, page);
}

export async function listNotifications(readerId: string, limit = 10) {
  return findReaderNotifications(readerId, limit);
}

export async function countUnreadNotifications(readerId: string) {
  return countReaderUnreadNotifications(readerId);
}

export async function markNotificationRead(readerId: string, notificationId: string) {
  const result = await markReaderNotificationRead(readerId, notificationId);
  if (result.count === 0) {
    throw new DomainError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  }
  return { updated: result.count };
}

export async function markAllNotificationsRead(readerId: string) {
  const result = await markAllReaderNotificationsRead(readerId);
  return { updated: result.count };
}

export async function notifyCommentReply(input: {
  recipientEmail: string;
  postTitle: string;
  postSlug: string;
}) {
  const reader = await findReaderByEmail(input.recipientEmail.toLowerCase());
  if (!reader || !reader.isActive) {
    return { created: false };
  }

  await createReaderNotification({
    readerId: reader.id,
    type: "comment_reply",
    title: "Có phản hồi bình luận mới",
    message: `Ai đó vừa trả lời bình luận của bạn trong bài "${input.postTitle}".`,
    link: `/blog/${input.postSlug}#comments`,
    payload: {
      postSlug: input.postSlug,
    },
  });

  return { created: true };
}

export async function notifyNewPost(postId: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      titleVi: true,
      categoryId: true,
      status: true,
    },
  });

  if (!post || post.status !== BlogPostStatus.PUBLISHED) {
    return { created: 0 };
  }

  const readerIds = await findReadersInterestedInCategory(post.categoryId, 1000);
  if (readerIds.length === 0) {
    return { created: 0 };
  }

  const { count } = await createReaderNotifications(
    readerIds.map((readerId) => ({
      readerId,
      type: "new_post",
      title: "Bài viết mới bạn có thể quan tâm",
      message: post.titleVi,
      link: `/blog/${post.slug}`,
      payload: {
        postId: post.id,
        postSlug: post.slug,
      },
    })),
  );

  return { created: count };
}
