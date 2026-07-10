import { createPortfolioRetentionWorker } from "@/worker/jobs/purge-expired-media";
import { createWeeklyReportsWorker } from "@/worker/jobs/generate-weekly-reports";
import { createWeeklyReportEmailsWorker } from "@/worker/jobs/dispatch-weekly-report-emails";
import { createVerifyBlogCommentEmailWorker } from "@/worker/jobs/verify-blog-comment-email";
import { createNotifyBlogCommentReplyWorker } from "@/worker/jobs/notify-blog-comment-reply";
import { createLifecycleEmailsWorker } from "@/worker/jobs/dispatch-lifecycle-emails";
import { createTransactionalEmailsWorker } from "@/worker/jobs/dispatch-transactional-emails";
import { createCertificateWorker } from "@/worker/jobs/generate-certificate";
import { createBulkEnrollWorker } from "@/worker/jobs/bulk-enroll-processor";
import { enqueueRetentionCleanup, enqueueWeeklyReportEmails, enqueueWeeklyReports, enqueueDispatchPendingLifecycleEmails } from "@/worker/queue";
import { logError, logInfo } from "@/lib/observability/logger";

const weeklyWorker = createWeeklyReportsWorker();
const retentionWorker = createPortfolioRetentionWorker();
const weeklyEmailWorker = createWeeklyReportEmailsWorker();
const verifyBlogCommentEmailWorker = createVerifyBlogCommentEmailWorker();
const notifyBlogCommentReplyWorker = createNotifyBlogCommentReplyWorker();
const lifecycleEmailWorker = createLifecycleEmailsWorker();
const transactionalEmailWorker = createTransactionalEmailsWorker();
const certificateWorker = createCertificateWorker();
const bulkEnrollWorker = createBulkEnrollWorker();

weeklyWorker.on("completed", (job) => {
  logInfo("worker.weekly_reports.completed", {
    jobId: job.id,
  });
});

retentionWorker.on("completed", (job) => {
  logInfo("worker.retention_cleanup.completed", {
    jobId: job.id,
  });
});

weeklyEmailWorker.on("completed", (job) => {
  logInfo("worker.weekly_report_email.completed", {
    jobId: job.id,
  });
});

verifyBlogCommentEmailWorker.on("completed", (job) => {
  logInfo("worker.blog_comment_verify_email.completed", {
    jobId: job.id,
  });
});

notifyBlogCommentReplyWorker.on("completed", (job) => {
  logInfo("worker.blog_comment_reply_email.completed", {
    jobId: job.id,
  });
});

lifecycleEmailWorker.on("completed", (job) => {
  logInfo("worker.lifecycle_email.completed", {
    jobId: job.id,
  });
});

transactionalEmailWorker.on("completed", (job) => {
  logInfo("worker.transactional_email.completed", {
    jobId: job.id,
  });
});

certificateWorker.on("completed", (job) => {
  logInfo("worker.certificate.completed", {
    jobId: job.id,
  });
});

bulkEnrollWorker.on("completed", (job) => {
  logInfo("worker.bulk_enroll.completed", { jobId: job.id });
});

bulkEnrollWorker.on("failed", (job, error) => {
  logError("worker.bulk_enroll.failed", { jobId: job?.id, error });
});

weeklyWorker.on("failed", (job, error) => {
  logError("worker.weekly_reports.failed", {
    jobId: job?.id,
    error,
  });
});

retentionWorker.on("failed", (job, error) => {
  logError("worker.retention_cleanup.failed", {
    jobId: job?.id,
    error,
  });
});

weeklyEmailWorker.on("failed", (job, error) => {
  logError("worker.weekly_report_email.failed", {
    jobId: job?.id,
    error,
  });
});

verifyBlogCommentEmailWorker.on("failed", (job, error) => {
  logError("worker.blog_comment_verify_email.failed", {
    jobId: job?.id,
    error,
  });
});

notifyBlogCommentReplyWorker.on("failed", (job, error) => {
  logError("worker.blog_comment_reply_email.failed", {
    jobId: job?.id,
    error,
  });
});

lifecycleEmailWorker.on("failed", (job, error) => {
  logError("worker.lifecycle_email.failed", {
    jobId: job?.id,
    error,
  });
});

transactionalEmailWorker.on("failed", (job, error) => {
  logError("worker.transactional_email.failed", {
    jobId: job?.id,
    error,
  });
});

certificateWorker.on("failed", (job, error) => {
  logError("worker.certificate.failed", {
    jobId: job?.id,
    error,
  });
});

async function bootstrap() {
  logInfo("worker.bootstrap_started");

  await enqueueWeeklyReports();
  await enqueueRetentionCleanup();
  await enqueueWeeklyReportEmails();
  await enqueueDispatchPendingLifecycleEmails();

  logInfo("worker.bootstrap_completed");

  setInterval(() => {
    enqueueWeeklyReports().catch((error) => {
      logError("worker.weekly_reports.enqueue_failed", {
        error,
      });
    });
  }, 1000 * 60 * 60 * 24 * 7);

  setInterval(() => {
    enqueueRetentionCleanup().catch((error) => {
      logError("worker.retention_cleanup.enqueue_failed", {
        error,
      });
    });
  }, 1000 * 60 * 60 * 24);

  setInterval(() => {
    enqueueWeeklyReportEmails().catch((error) => {
      logError("worker.weekly_report_email.enqueue_failed", {
        error,
      });
    });
  }, 1000 * 60 * 30);

  // Dispatch D3/D7 lifecycle emails every hour
  setInterval(() => {
    enqueueDispatchPendingLifecycleEmails().catch((error) => {
      logError("worker.lifecycle_email.enqueue_failed", { error });
    });
  }, 1000 * 60 * 60);
}

bootstrap().catch((error) => {
  logError("worker.bootstrap_failed", {
    error,
  });
  process.exit(1);
});

process.on("SIGINT", async () => {
  logInfo("worker.shutdown_started");
  await Promise.all([
    weeklyWorker.close(),
    retentionWorker.close(),
    weeklyEmailWorker.close(),
    verifyBlogCommentEmailWorker.close(),
    notifyBlogCommentReplyWorker.close(),
    lifecycleEmailWorker.close(),
    transactionalEmailWorker.close(),
    certificateWorker.close(),
    bulkEnrollWorker.close(),
  ]);
  logInfo("worker.shutdown_completed");
  process.exit(0);
});
