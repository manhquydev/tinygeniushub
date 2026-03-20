import { NextRequest, NextResponse } from "next/server";
import { isCronRequestAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { newsletterService } from "@/modules/blog/newsletter-service";
import { enqueueSendBlogNewsletter } from "@/worker/queue";

export async function GET(request: NextRequest) {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      id: true,
      slug: true,
      titleVi: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 10,
  });

  if (recentPosts.length === 0) {
    return NextResponse.json({ dispatched: 0, reason: "No posts this week" });
  }

  const subscribers = await newsletterService.getActiveSubscribers();
  if (subscribers.length === 0) {
    return NextResponse.json({ dispatched: 0, reason: "No active subscribers" });
  }

  const postIds = recentPosts.map((post) => post.id);
  let dispatched = 0;

  for (const subscriber of subscribers) {
    try {
      await enqueueSendBlogNewsletter({
        subscriberId: subscriber.id,
        subscriberEmail: subscriber.email,
        postIds,
      });
      dispatched += 1;
    } catch (error) {
      console.error("Failed to enqueue newsletter for", subscriber.email, error);
    }
  }

  return NextResponse.json({ dispatched, posts: recentPosts.length });
}
