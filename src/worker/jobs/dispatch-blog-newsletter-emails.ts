import { Job, Worker } from "bullmq";
import { prisma } from "@/lib/db";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import { logInfo } from "@/lib/observability/logger";
import { getNewsletterWeekStart, redisConnection } from "@/worker/queue";

type NewsletterPost = {
  id: string;
  slug: string;
  titleVi: string;
};

type VerifyBlogNewsletterJobPayload = {
  subscriberId: string;
  email: string;
  nameVi: string | null;
  verifyToken: string;
};

type DispatchBlogNewsletterJobPayload = {
  subscriberId: string;
  subscriberEmail: string;
  nameVi: string | null;
  postIds: string[];
  newsletterWeekStartAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toVerifyPayload(data: unknown): VerifyBlogNewsletterJobPayload {
  if (
    isRecord(data) &&
    typeof data.subscriberId === "string" &&
    typeof data.email === "string" &&
    (typeof data.nameVi === "string" || data.nameVi === null) &&
    typeof data.verifyToken === "string"
  ) {
    return {
      subscriberId: data.subscriberId,
      email: data.email,
      nameVi: data.nameVi,
      verifyToken: data.verifyToken,
    };
  }

  throw new Error("Invalid verify newsletter payload");
}

function toWeeklyPayload(
  data: unknown,
): DispatchBlogNewsletterJobPayload {
  if (
    isRecord(data) &&
    typeof data.subscriberId === "string" &&
    typeof data.subscriberEmail === "string" &&
    (typeof data.nameVi === "string" || data.nameVi === null) &&
    Array.isArray(data.postIds) &&
    data.postIds.every((postId) => typeof postId === "string") &&
    typeof data.newsletterWeekStartAt === "string"
  ) {
    return {
      subscriberId: data.subscriberId,
      subscriberEmail: data.subscriberEmail,
      nameVi: data.nameVi,
      postIds: data.postIds,
      newsletterWeekStartAt: data.newsletterWeekStartAt,
    };
  }

  if (
    isRecord(data) &&
    typeof data.subscriberId === "string" &&
    typeof data.email === "string" &&
    (typeof data.nameVi === "string" || data.nameVi === null) &&
    Array.isArray(data.posts)
  ) {
    const postPublishedDates = data.posts
      .map((post) =>
        isRecord(post) && typeof post.publishedAt === "string"
          ? new Date(post.publishedAt)
          : null,
      )
      .filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()));
    const referenceDate = postPublishedDates.length > 0 ? postPublishedDates[0] : new Date();
    const newsletterWeekStartAt = getNewsletterWeekStart(referenceDate).toISOString();

    const postIds = data.posts
      .map((post) => (isRecord(post) && typeof post.id === "string" ? post.id : null))
      .filter((postId): postId is string => postId !== null);
    return {
      subscriberId: data.subscriberId,
      subscriberEmail: data.email,
      nameVi: data.nameVi,
      postIds,
      newsletterWeekStartAt,
    };
  }

  throw new Error("Invalid weekly newsletter payload");
}

function buildVerifyUrl(token: string) {
  return `${resolveEmailPublicBaseUrl()}/api/blog/newsletter/verify?token=${encodeURIComponent(token)}`;
}

function buildPostUrl(slug: string) {
  return `${resolveEmailPublicBaseUrl()}/blog/${slug}`;
}

function buildUnsubscribeUrl(unsubToken: string) {
  return `${resolveEmailPublicBaseUrl()}/api/blog/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
}

function buildNewsletterVerifyText(payload: VerifyBlogNewsletterJobPayload, unsubscribeUrl: string) {
  const name = payload.nameVi?.trim() || "parents";
  const verifyUrl = buildVerifyUrl(payload.verifyToken);
  return [
    `Hello${name},`,
    "",
    "Please confirm your blog newsletter subscription.",
    `Click this link to confirm:${verifyUrl}`,
    "",
    "If you did not request registration, you can ignore this email.",
    "Or unsubscribe here:",
    unsubscribeUrl,
  ].join("\n");
}

function buildWeeklyNewsletterText(
  subscriberName: string | null,
  posts: NewsletterPost[],
  unsubscribeUrl: string,
) {
  const name = subscriberName?.trim() || "parents";
  const lines = [`Hello${name},`, "", "This is this week's blog news."];
  for (const post of posts) {
    lines.push(`- ${post.titleVi}: ${buildPostUrl(post.slug)}`);
  }
  lines.push(
    "",
    "Thank you for following our blog.",
    "You can stop receiving the newsletter here:",
    unsubscribeUrl,
  );
  return lines.join("\n");
}

async function sendNewsletterEmail(input: {
  to: string;
  subject: string;
  text: string;
  tags: Array<{ name: string; value: string }>;
}) {
  return sendTransactionalEmail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    tags: input.tags,
  });
}

async function sendVerifyNewsletterEmail(payload: VerifyBlogNewsletterJobPayload) {
  const subscriber = await prisma.blogNewsletterSubscriber.findUnique({
    where: { id: payload.subscriberId },
    select: {
      id: true,
      email: true,
      verifyToken: true,
      verified: true,
      unsubscribedAt: true,
      unsubToken: true,
    },
  });

  if (!subscriber) {
    return false;
  }

  if (
    subscriber.verified ||
    subscriber.unsubscribedAt !== null ||
    subscriber.verifyToken !== payload.verifyToken
  ) {
    return false;
  }

  const delivery = await sendNewsletterEmail({
    to: subscriber.email,
    subject: "Confirm blog newsletter subscription",
    text: buildNewsletterVerifyText(payload, buildUnsubscribeUrl(subscriber.unsubToken)),
    tags: [
      { name: "feature", value: "blog_newsletter_verify" },
      { name: "subscriber_id", value: payload.subscriberId },
    ],
  });

  return delivery.sent;
}

async function sendWeeklyNewsletterEmail(payload: DispatchBlogNewsletterJobPayload) {
  const weekStartAt = new Date(payload.newsletterWeekStartAt);
  if (Number.isNaN(weekStartAt.getTime())) {
    throw new Error("Invalid newsletterWeekStartAt");
  }

  const subscriber = await prisma.blogNewsletterSubscriber.findUnique({
    where: { id: payload.subscriberId },
    select: {
      id: true,
      email: true,
      nameVi: true,
      verified: true,
      unsubscribedAt: true,
      lastEmailAt: true,
      unsubToken: true,
    },
  });

  if (!subscriber) {
    return false;
  }

  if (subscriber.lastEmailAt && subscriber.lastEmailAt >= weekStartAt) {
    logInfo("worker.blog_newsletter_email.skipped_duplicate", {
      subscriberId: subscriber.id,
      lastEmailAt: subscriber.lastEmailAt.toISOString(),
      weekStartAt: weekStartAt.toISOString(),
    });
    return false;
  }

  if (!subscriber.verified || subscriber.unsubscribedAt !== null) {
    return false;
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      id: { in: payload.postIds },
      status: "PUBLISHED",
    },
    select: {
      id: true,
      slug: true,
      titleVi: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  if (posts.length === 0) {
    return false;
  }

  const delivery = await sendNewsletterEmail({
    to: subscriber.email,
    subject: "Blog news this week",
    text: buildWeeklyNewsletterText(subscriber.nameVi, posts, buildUnsubscribeUrl(subscriber.unsubToken)),
    tags: [
      { name: "feature", value: "blog_newsletter_weekly" },
      { name: "subscriber_id", value: subscriber.id },
      { name: "week_start", value: weekStartAt.toISOString().slice(0, 10) },
    ],
  });
  if (!delivery.sent) {
    return false;
  }

  await prisma.blogNewsletterSubscriber.updateMany({
    where: {
      id: subscriber.id,
      OR: [{ lastEmailAt: null }, { lastEmailAt: { lt: weekStartAt } }],
    },
    data: {
      lastEmailAt: new Date(),
    },
  });

  return true;
}

export function createBlogNewsletterWorker() {
  return new Worker(
    "blog-newsletter",
    async (job: Job<unknown>) => {
      if (job.name === "verify-blog-newsletter-email") {
        const payload = toVerifyPayload(job.data);
        const sent = await sendVerifyNewsletterEmail(payload);
        if (!sent) {
          return;
        }

        logInfo("worker.blog_newsletter_verify_email.sent", {
          jobId: job.id,
          subscriberId: payload.subscriberId,
          email: payload.email,
        });
        return;
      }

      if (job.name === "dispatch-blog-newsletter-email" || job.name === "send-blog-newsletter") {
        const payload = toWeeklyPayload(job.data);
        const sent = await sendWeeklyNewsletterEmail(payload);
        if (!sent) {
          return;
        }

        logInfo("worker.blog_newsletter_email.dispatched", {
          jobId: job.id,
          subscriberId: payload.subscriberId,
          postCount: payload.postIds.length,
        });
      }
    },
    {
      connection: redisConnection,
      concurrency: 4,
    },
  );
}
