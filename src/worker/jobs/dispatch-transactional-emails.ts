import { Job, Worker } from "bullmq";
import {
  sendTransactionalEmail,
  type SendTransactionalEmailInput,
} from "@/lib/email/transactional-email-sender";
import { logInfo } from "@/lib/observability/logger";
import { redisConnection } from "@/worker/queue";

function isValidEmailPayload(data: unknown): data is SendTransactionalEmailInput {
  if (!data || typeof data !== "object") {
    return false;
  }

  const payload = data as Record<string, unknown>;
  return (
    typeof payload.to === "string" &&
    typeof payload.subject === "string" &&
    typeof payload.text === "string"
  );
}

export function createTransactionalEmailsWorker() {
  return new Worker(
    "transactional-emails",
    async (job: Job<unknown>) => {
      if (job.name !== "send-transactional-email") {
        return;
      }

      if (!isValidEmailPayload(job.data)) {
        throw new Error("Invalid transactional email payload");
      }

      const delivery = await sendTransactionalEmail(job.data);
      logInfo("worker.transactional_email.sent", {
        jobId: job.id,
        provider: delivery.provider,
        to: job.data.to,
        subject: job.data.subject,
      });
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );
}

