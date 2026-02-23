import { Job, Worker } from "bullmq";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/observability/logger";
import { redisConnection } from "@/worker/queue";

type BlogNewsletterJobPayload = {
  subscriberId: string;
  email: string;
  nameVi: string | null;
  posts: Array<{
    id: string;
    slug: string;
    titleVi: string;
    publishedAt: string | null;
  }>;
};

type SendBlogNewsletterJobPayload = {
  subscriberId: string;
  subscriberEmail: string;
  postIds: string[];
};

export function createBlogNewsletterWorker() {
  return new Worker(
    "blog-newsletter",
    async (job: Job<BlogNewsletterJobPayload | SendBlogNewsletterJobPayload>) => {
      if (job.name !== "dispatch-blog-newsletter-email" && job.name !== "send-blog-newsletter") {
        return;
      }

      // TODO: integrate with dedicated email template provider for production newsletters.
      await prisma.blogNewsletterSubscriber.update({
        where: {
          id: job.data.subscriberId,
        },
        data: {
          lastEmailAt: new Date(),
        },
      });

      logInfo("worker.blog_newsletter_email.dispatched", {
        jobId: job.id,
        subscriberId: job.data.subscriberId,
        postCount: "posts" in job.data ? job.data.posts.length : job.data.postIds.length,
      });
    },
    {
      connection: redisConnection,
      concurrency: 4,
    },
  );
}
