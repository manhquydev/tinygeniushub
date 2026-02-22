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
