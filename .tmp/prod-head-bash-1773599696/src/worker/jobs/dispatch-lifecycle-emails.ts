import { Job, Worker } from "bullmq";
import { LifecycleEmailType } from "@prisma/client";
import { dispatchPendingLifecycleEmails, sendLifecycleEmail } from "@/modules/platform/lifecycle-email-service";
import { redisConnection } from "@/worker/queue";

export function createLifecycleEmailsWorker() {
  return new Worker(
    "lifecycle-emails",
    async (job: Job) => {
      if (job.name === "send-lifecycle-email") {
        const { parentId, type } = job.data as { parentId: string; type: LifecycleEmailType };
        await sendLifecycleEmail(parentId, type);
        return;
      }

      if (job.name === "dispatch-pending-lifecycle-emails") {
        await dispatchPendingLifecycleEmails();
        return;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );
}
