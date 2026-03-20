import { Job, Worker } from "bullmq";
import { redisConnection } from "@/worker/queue";
import { purgeExpiredPortfolioMedia } from "@/modules/progress/retention-service";

export function createPortfolioRetentionWorker() {
  return new Worker(
    "portfolio-retention",
    async (job: Job) => {
      if (job.name !== "purge-expired-media") {
        return;
      }

      await purgeExpiredPortfolioMedia();
    },
    {
      connection: redisConnection,
      concurrency: 1,
    },
  );
}
