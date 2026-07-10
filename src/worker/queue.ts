import { Queue } from "bullmq";
import { LifecycleEmailType } from "@prisma/client";
import { env } from "@/lib/env";
import type { SendTransactionalEmailInput } from "@/lib/email/transactional-email-sender";
import { createRedisConnectionOptions } from "@/lib/redis-connection";
import type { BulkEnrollRow } from "@/modules/organizations/bulk-enroll-service";

export const redisConnection = createRedisConnectionOptions(env.REDIS_URL);

export const reportsQueue = new Queue("weekly-reports", {
  connection: redisConnection,
});

export const retentionQueue = new Queue("portfolio-retention", {
  connection: redisConnection,
});

export const weeklyReportEmailQueue = new Queue("weekly-report-emails", {
  connection: redisConnection,
});

export const blogCommentEmailQueue = new Queue("blog-comment-emails", {
  connection: redisConnection,
});

export const blogCommentReplyEmailQueue = new Queue("blog-comment-reply-emails", {
  connection: redisConnection,
});

export const lifecycleEmailQueue = new Queue("lifecycle-emails", {
  connection: redisConnection,
});

export const transactionalEmailQueue = new Queue("transactional-emails", {
  connection: redisConnection,
});

export const certificateQueue = new Queue("certificates", {
  connection: redisConnection,
});

export const bulkEnrollQueue = new Queue("bulk-enroll", {
  connection: redisConnection,
});

export async function enqueueBulkEnroll(payload: {
  orgId: string;
  rows: BulkEnrollRow[];
  requestedByParentId: string;
}) {
  return bulkEnrollQueue.add("bulk-enroll", payload, {
    removeOnComplete: true,
    removeOnFail: 50,
  });
}

export async function enqueueCertificateGeneration(enrollmentId: string) {
  return certificateQueue.add(
    "generate-certificate",
    { enrollmentId },
    {
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: `certificate:${enrollmentId}`,
    },
  );
}

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

export async function enqueueNotifyBlogCommentReply(payload: {
  parentCommentId: string;
  replyCommentId: string;
  postSlug: string;
}) {
  return blogCommentReplyEmailQueue.add("notify-comment-reply", payload, {
    jobId: `blog-comment-reply:${payload.parentCommentId}:${payload.replyCommentId}`,
    removeOnComplete: true,
    removeOnFail: 50,
  });
}

export async function enqueueLifecycleEmail(parentId: string, type: LifecycleEmailType) {
  return lifecycleEmailQueue.add(
    "send-lifecycle-email",
    { parentId, type },
    {
      removeOnComplete: true,
      removeOnFail: 50,
      // Deduplicate: skip if same job already queued for same parent+type
      jobId: `lifecycle:${type.toLowerCase()}:${parentId}`,
    },
  );
}

export async function enqueueDispatchPendingLifecycleEmails() {
  return lifecycleEmailQueue.add(
    "dispatch-pending-lifecycle-emails",
    { triggeredAt: new Date().toISOString() },
    {
      removeOnComplete: true,
      removeOnFail: 50,
    },
  );
}




type EnqueueTransactionalEmailOptions = {
  jobId?: string;
  delayMs?: number;
};

export async function enqueueTransactionalEmail(
  payload: SendTransactionalEmailInput,
  options?: EnqueueTransactionalEmailOptions,
) {
  return transactionalEmailQueue.add(
    "send-transactional-email",
    payload,
    {
      jobId: options?.jobId,
      delay: options?.delayMs,
      attempts: 4,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}

