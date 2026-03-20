import { Job, Worker } from "bullmq";
import { deliverQueuedWeeklyReportEmails } from "@/modules/reports/email-delivery-service";
import { redisConnection } from "@/worker/queue";

export function createWeeklyReportEmailsWorker() {
  return new Worker(
    "weekly-report-emails",
    async (job: Job) => {
      if (job.name !== "dispatch-weekly-report-emails") {
        return;
      }

      await deliverQueuedWeeklyReportEmails();
    },
    {
      connection: redisConnection,
      concurrency: 1,
    },
  );
}
