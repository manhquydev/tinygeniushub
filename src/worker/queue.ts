import { Queue } from "bullmq";
import { env } from "@/lib/env";

export const redisConnection = {
  url: env.REDIS_URL,
};

export const reportsQueue = new Queue("weekly-reports", {
  connection: redisConnection,
});

export const retentionQueue = new Queue("portfolio-retention", {
  connection: redisConnection,
});

export const weeklyReportEmailQueue = new Queue("weekly-report-emails", {
  connection: redisConnection,
});

export const blogNewsletterQueue = new Queue("blog-newsletter", {
  connection: redisConnection,
});

export const blogCommentEmailQueue = new Queue("blog-comment-emails", {
  connection: redisConnection,
});

export async function enqueueWeeklyReports() {
  return reportsQueue.add(
    "generate-weekly-reports",
    {
      triggeredAt: new Date().toISOString(),
    },
    {
      removeOnComplete: true,
      removeOnFail: 50,
    },
  );
}

export async function enqueueRetentionCleanup() {
  return retentionQueue.add(
    "purge-expired-media",
    {
      triggeredAt: new Date().toISOString(),
    },
    {
      removeOnComplete: true,
      removeOnFail: 50,
    },
  );
}

export async function enqueueWeeklyReportEmails() {
  return weeklyReportEmailQueue.add(
    "dispatch-weekly-report-emails",
    {
      triggeredAt: new Date().toISOString(),
    },
    {
      removeOnComplete: true,
      removeOnFail: 50,
    },
  );
}

export async function enqueueBlogNewsletterEmail(payload: {
  subscriberId: string;
  email: string;
  nameVi: string | null;
  posts: Array<{
    id: string;
    slug: string;
    titleVi: string;
    publishedAt: string | null;
  }>;
}) {
  return blogNewsletterQueue.add("dispatch-blog-newsletter-email", payload, {
    removeOnComplete: true,
    removeOnFail: 50,
  });
}

export async function enqueueSendBlogNewsletter(payload: {
  subscriberId: string;
  subscriberEmail: string;
  postIds: string[];
}) {
  return blogNewsletterQueue.add("send-blog-newsletter", payload, {
    removeOnComplete: true,
    removeOnFail: 50,
  });
}

export async function enqueueVerifyBlogComment(payload: {
  commentId: string;
  authorName: string;
  authorEmail: string;
  postSlug: string;
  verifyToken: string;
}) {
  return blogCommentEmailQueue.add("verify-blog-comment", payload, {
    removeOnComplete: true,
    removeOnFail: 50,
  });
}
