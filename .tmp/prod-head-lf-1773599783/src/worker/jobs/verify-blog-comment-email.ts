import { Job, Worker } from "bullmq";
import { env } from "@/lib/env";
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
  const verifyUrl = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/api/blog/comments/verify?token=${encodeURIComponent(payload.verifyToken)}`;
  const subject = "Xac nhan binh luan cua ban tren CungConTuHoc";
  const text = [
    `Xin chào ${payload.authorName},`,
    "Cảm ơn bạn đã gửi bình luận trên CùngConTựHọc.",
    `Vui lòng xác nhận bình luận tại: ${verifyUrl}`,
    `Bài viết: /blog/${payload.postSlug}`,
  ].join("\n");

  if (env.REPORT_EMAIL_PROVIDER === "mock_email") {
    console.log(
      `[email] verify blog comment (mock): comment=${payload.commentId} to=${payload.authorEmail} link=${verifyUrl}`,
    );
    return;
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
        to: [env.REPORT_EMAIL_TO_OVERRIDE ?? payload.authorEmail],
        subject,
        text,
        ...(env.REPORT_EMAIL_REPLY_TO ? { reply_to: env.REPORT_EMAIL_REPLY_TO } : {}),
        tags: [
          { name: "feature", value: "blog_comment_verify" },
          { name: "environment", value: env.NODE_ENV },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Verify comment email failed: status=${response.status}`);
    }

    return;
  }

  throw new Error(`Unsupported report email provider: ${env.REPORT_EMAIL_PROVIDER}`);
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
