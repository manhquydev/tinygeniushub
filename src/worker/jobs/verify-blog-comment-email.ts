import { Job, Worker } from "bullmq";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import { logInfo } from "@/lib/observability/logger";
import { redisConnection } from "@/worker/queue";

type VerifyBlogCommentJobPayload = {
  commentId: string;
  authorName: string;
  authorEmail: string;
  postSlug: string;
  verifyToken: string;
};

async function sendVerifyEmail(payload: VerifyBlogCommentJobPayload) {
  const baseUrl = resolveEmailPublicBaseUrl();
  const verifyUrl = `${baseUrl}/api/blog/comments/verify?token=${encodeURIComponent(payload.verifyToken)}`;
  const postUrl = `${baseUrl}/blog/${payload.postSlug}`;
  const subject = "Xác nhận bình luận của bạn trên Cùng Con Tự Học";
  const text = [
    `Xin chào ${payload.authorName},`,
    "Cảm ơn bạn đã gửi bình luận trên Cùng Con Tự Học.",
    `Vui lòng xác nhận bình luận tại: ${verifyUrl}`,
    `Bài viết: ${postUrl}`,
  ].join("\n");

  await sendTransactionalEmail({
    to: payload.authorEmail,
    subject,
    text,
    tags: [{ name: "feature", value: "blog_comment_verify" }],
  });
}

export function createVerifyBlogCommentEmailWorker() {
  return new Worker(
    "blog-comment-emails",
    async (job: Job<VerifyBlogCommentJobPayload>) => {
      if (job.name !== "verify-blog-comment") {
        return;
      }

      await sendVerifyEmail(job.data);
      logInfo("worker.blog_comment_verify_email.sent", {
        jobId: job.id,
        commentId: job.data.commentId,
        authorEmail: job.data.authorEmail,
      });
    },
    {
      connection: redisConnection,
      concurrency: 4,
    },
  );
}
