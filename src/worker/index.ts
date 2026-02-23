import { createPortfolioRetentionWorker } from "@/worker/jobs/purge-expired-media";
import { createWeeklyReportsWorker } from "@/worker/jobs/generate-weekly-reports";
import { createWeeklyReportEmailsWorker } from "@/worker/jobs/dispatch-weekly-report-emails";
import { createBlogNewsletterWorker } from "@/worker/jobs/dispatch-blog-newsletter-emails";
import { enqueueRetentionCleanup, enqueueWeeklyReportEmails, enqueueWeeklyReports } from "@/worker/queue";
import { logError, logInfo } from "@/lib/observability/logger";

const weeklyWorker = createWeeklyReportsWorker();
const retentionWorker = createPortfolioRetentionWorker();
const weeklyEmailWorker = createWeeklyReportEmailsWorker();
const blogNewsletterWorker = createBlogNewsletterWorker();

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

blogNewsletterWorker.on("completed", (job) => {
  logInfo("worker.blog_newsletter_email.completed", {
    jobId: job.id,
  });
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

blogNewsletterWorker.on("failed", (job, error) => {
  logError("worker.blog_newsletter_email.failed", {
    jobId: job?.id,
    error,
  });
});

async function bootstrap() {
  logInfo("worker.bootstrap_started");

  await enqueueWeeklyReports();
  await enqueueRetentionCleanup();
  await enqueueWeeklyReportEmails();

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
}

bootstrap().catch((error) => {
  logError("worker.bootstrap_failed", {
    error,
  });
  process.exit(1);
});

process.on("SIGINT", async () => {
  logInfo("worker.shutdown_started");
  await Promise.all([weeklyWorker.close(), retentionWorker.close(), weeklyEmailWorker.close(), blogNewsletterWorker.close()]);
  logInfo("worker.shutdown_completed");
  process.exit(0);
});
