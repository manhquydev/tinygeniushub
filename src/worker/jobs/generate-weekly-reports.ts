import { Job, Worker } from "bullmq";
import { generateWeeklyReportsForAllChildren } from "@/modules/reports/weekly-report-service";
import { enqueueWeeklyReportEmails, redisConnection } from "@/worker/queue";

export function createWeeklyReportsWorker() {
  return new Worker(
    "weekly-reports",
    async (job: Job) => {
      if (job.name !== "generate-weekly-reports") {
        return;
      }

      await generateWeeklyReportsForAllChildren();
      await enqueueWeeklyReportEmails();
    },
    {
      connection: redisConnection,
      concurrency: 1,
    },
  );
}
