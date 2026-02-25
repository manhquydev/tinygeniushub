import { Job, Worker } from "bullmq";
import { processBulkEnrollRows, BulkEnrollRow } from "@/modules/organizations/bulk-enroll-service";
import { redisConnection } from "@/worker/queue";
import { logError, logInfo } from "@/lib/observability/logger";

interface BulkEnrollPayload {
  orgId: string;
  rows: BulkEnrollRow[];
  requestedByParentId: string;
}

export function createBulkEnrollWorker() {
  return new Worker(
    "bulk-enroll",
    async (job: Job) => {
      if (job.name !== "bulk-enroll") return;
      const { orgId, rows } = job.data as BulkEnrollPayload;
      const result = await processBulkEnrollRows(orgId, rows);
      logInfo("worker.bulk_enroll.completed", { orgId, ...result });
      return result;
    },
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );
}
