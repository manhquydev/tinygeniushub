import { Job, Worker } from "bullmq";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
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

  const baseUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const postUrl = `${baseUrl}/blog/${post.slug}#comments`;
  const unsubToken = createCommentReplyUnsubscribeToken({
    commentId: parentComment.id,
    authorEmail: parentComment.authorEmail,
  });
  const unsubscribeUrl = `${baseUrl}/api/blog/comments/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

  const subject = "Co phan hoi moi cho binh luan cua ban";
  const text = [
    `Xin chao ${parentComment.authorName},`,
    "",
    `Co nguoi vua tra loi binh luan cua ban trong bai: ${post.titleVi}`,
    `Nguoi tra loi: ${replyComment.authorName}`,
    "",
    `Xem chi tiet: ${postUrl}`,
    "",
    "Neu ban khong muon nhan email thong bao tra loi nua, bam link:",
    unsubscribeUrl,
  ].join("\n");

  if (env.REPORT_EMAIL_PROVIDER === "mock_email") {
    console.log(
      `[email] notify comment reply (mock): parent=${parentComment.id} reply=${replyComment.id} to=${parentComment.authorEmail}`,
    );
    return true;
  }

  if (env.REPORT_EMAIL_PROVIDER === "resend") {
    const response = await fetch(`${env.REPORT_EMAIL_RESEND_API_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.REPORT_EMAIL_RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.REPORT_EMAIL_FROM,
        to: [env.REPORT_EMAIL_TO_OVERRIDE ?? parentComment.authorEmail],
        subject,
        text,
        ...(env.REPORT_EMAIL_REPLY_TO ? { reply_to: env.REPORT_EMAIL_REPLY_TO } : {}),
        tags: [
          { name: "feature", value: "blog_comment_reply" },
          { name: "environment", value: env.NODE_ENV },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Comment reply email failed: status=${response.status}`);
    }

    return true;
  }

  throw new Error(`Unsupported report email provider: ${env.REPORT_EMAIL_PROVIDER}`);
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
