import type { CourseReview } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ReviewWithParent = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  parent: { displayName: string | null };
};

export type PaginatedReviews = {
  reviews: ReviewWithParent[];
  total: number;
  page: number;
  totalPages: number;
};

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export async function getApprovedReviews(
  courseId: string,
  page: number,
  pageSize = 5,
): Promise<PaginatedReviews> {
  const skip = (page - 1) * pageSize;

  const [reviews, total] = await Promise.all([
    prisma.courseReview.findMany({
      where: { courseId, isApproved: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        parent: { select: { displayName: true } },
      },
    }),
    prisma.courseReview.count({ where: { courseId, isApproved: true } }),
  ]);

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getRatingDistribution(courseId: string): Promise<RatingDistribution> {
  const groups = await prisma.courseReview.groupBy({
    by: ["rating"],
    where: { courseId, isApproved: true },
    _count: { rating: true },
  });

  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const group of groups) {
    const star = group.rating as 1 | 2 | 3 | 4 | 5;
    if (star >= 1 && star <= 5) {
      distribution[star] = group._count.rating;
    }
  }

  return distribution;
}

export async function createReview(
  courseId: string,
  parentId: string,
  data: { rating: number; comment?: string },
): Promise<CourseReview> {
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  if (data.comment !== undefined && data.comment.length > 1000) {
    throw new Error("Comment must be 1000 characters or fewer");
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_parentId: { courseId, parentId } },
  });

  if (!enrollment) {
    throw new Error("Must be enrolled to review");
  }

  return prisma.courseReview.upsert({
    where: { courseId_parentId: { courseId, parentId } },
    create: {
      courseId,
      parentId,
      rating: data.rating,
      comment: data.comment ?? null,
      isApproved: false,
    },
    update: {
      rating: data.rating,
      comment: data.comment ?? null,
      isApproved: false,
    },
  });
}

export async function moderateReview(reviewId: string, approved: boolean): Promise<void> {
  const review = await prisma.courseReview.update({
    where: { id: reviewId },
    data: { isApproved: approved },
    select: { courseId: true },
  });

  await updateCourseRatingAggregate(review.courseId);
}

async function updateCourseRatingAggregate(courseId: string): Promise<void> {
  const agg = await prisma.courseReview.aggregate({
    where: { courseId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: {
      reviewAverageRating: agg._avg.rating,
      reviewCount: agg._count.rating,
    },
  });
}
