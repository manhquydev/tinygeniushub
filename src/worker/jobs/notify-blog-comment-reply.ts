import { Job, Worker } from "bullmq";
import { prisma } from "@/lib/db";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import { logInfo } from "@/lib/observability/logger";
import { createCommentReplyUnsubscribeToken } from "@/modules/blog/comment-reply-notification-token";
import { redisConnection } from "@/worker/queue";

type NotifyCommentReplyJobPayload = {
  parentCommentId: string;
  replyCommentId: string;
  postSlug: string;
};

async function sendReplyNotificationEmail(payload: NotifyCommentReplyJobPayload) {
  const [parentComment, replyComment, post] = await Promise.all([
    prisma.blogComment.findUnique({
      where: { id: payload.parentCommentId },
      select: {
        id: true,
        authorName: true,
        authorEmail: true,
        notifyOnReply: true,
        status: true,
      },
    }),
    prisma.blogComment.findUnique({
      where: { id: payload.replyCommentId },
      select: {
        id: true,
        authorName: true,
        content: true,
        status: true,
      },
    }),
    prisma.blogPost.findFirst({
      where: {
        slug: payload.postSlug,
      },
      select: {
        slug: true,
        titleVi: true,
      },
    }),
  ]);

  if (!parentComment || !replyComment || !post) {
    return false;
  }

  if (parentComment.status !== "APPROVED" || !parentComment.notifyOnReply) {
    return false;
  }

  if (replyComment.status !== "APPROVED") {
    return false;
  }

  const baseUrl = resolveEmailPublicBaseUrl();
  const postUrl = `${baseUrl}/blog/${post.slug}#comments`;
  const unsubToken = createCommentReplyUnsubscribeToken({
    commentId: parentComment.id,
    authorEmail: parentComment.authorEmail,
  });
  const unsubscribeUrl = `${baseUrl}/api/blog/comments/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

  const subject = "Có phản hồi mới cho bình luận của bạn";
  const text = [
    `Xin chào ${parentComment.authorName},`,
    "",
    `Có người vừa trả lời bình luận của bạn trong bài: ${post.titleVi}`,
    `Người trả lời: ${replyComment.authorName}`,
    "",
    `Xem chi tiết: ${postUrl}`,
    "",
    "Nếu bạn không muốn nhận email thông báo trả lời nữa, bấm link:",
    unsubscribeUrl,
  ].join("\n");

  await sendTransactionalEmail({
    to: parentComment.authorEmail,
    subject,
    text,
    tags: [{ name: "feature", value: "blog_comment_reply" }],
  });

  return true;
}

export function createNotifyBlogCommentReplyWorker() {
  return new Worker(
    "blog-comment-reply-emails",
    async (job: Job<NotifyCommentReplyJobPayload>) => {
      if (job.name !== "notify-comment-reply") {
        return;
      }

      const sent = await sendReplyNotificationEmail(job.data);
      if (!sent) {
        return;
      }

      logInfo("worker.blog_comment_reply_email.sent", {
        jobId: job.id,
        parentCommentId: job.data.parentCommentId,
        replyCommentId: job.data.replyCommentId,
      });
    },
    {
      connection: redisConnection,
      concurrency: 4,
    },
  );
}
