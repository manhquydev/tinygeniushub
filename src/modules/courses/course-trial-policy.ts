import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";
import { COURSE_TRIAL_PREVIEW_LESSON_LIMIT } from "@/modules/courses/course-trial-constants";

const COURSE_GUEST_PREVIEW_TOKEN_VERSION = 1;
const COURSE_GUEST_PREVIEW_TOKEN_TTL_SECONDS = 60 * 5;

type GuestPreviewPlaybackClaims = {
  v: number;
  mode: "guest-preview";
  lessonId: string;
  exp: number;
};

type CourseLessonPreviewWindowRow = {
  courseId: string;
  lessonId: string;
  orderNo: number;
};

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url");
}

function deriveTokenKey(secret: string) {
  return createHash("sha256").update(`course-guest-preview-token:${secret}`).digest("hex");
}

export function isPublicPreviewCourseOrder(orderNo: number) {
  return Number.isInteger(orderNo) && orderNo >= 1 && orderNo <= COURSE_TRIAL_PREVIEW_LESSON_LIMIT;
}

export function isLessonWithinPublicPreviewWindow(
  rows: CourseLessonPreviewWindowRow[],
  lessonId: string,
  previewLimit = COURSE_TRIAL_PREVIEW_LESSON_LIMIT,
) {
  if (!Number.isInteger(previewLimit) || previewLimit < 1) {
    return false;
  }

  let currentCourseId: string | null = null;
  let courseRank = 0;

  for (const row of rows) {
    if (row.courseId !== currentCourseId) {
      currentCourseId = row.courseId;
      courseRank = 1;
    } else {
      courseRank += 1;
    }

    if (courseRank > previewLimit) {
      continue;
    }

    if (row.lessonId === lessonId) {
      return true;
    }
  }

  return false;
}

export async function isPublicPreviewEligibleLesson(
  db: Pick<PrismaClient, "courseLesson">,
  lessonId: string,
) {
  const candidateCourses = await db.courseLesson.findMany({
    where: {
      lessonId,
      course: {
        isPublished: true,
      },
    },
    select: {
      courseId: true,
    },
    distinct: ["courseId"],
  });

  if (candidateCourses.length === 0) {
    return false;
  }

  const orderedLessons = await db.courseLesson.findMany({
    where: {
      courseId: {
        in: candidateCourses.map((item) => item.courseId),
      },
    },
    orderBy: [{ courseId: "asc" }, { orderNo: "asc" }],
    select: {
      courseId: true,
      lessonId: true,
      orderNo: true,
    },
  });

  return isLessonWithinPublicPreviewWindow(orderedLessons, lessonId);
}

export function buildGuestPreviewPlaybackToken(input: { lessonId: string; ttlSeconds?: number }) {
  const ttl = Math.max(30, input.ttlSeconds ?? COURSE_GUEST_PREVIEW_TOKEN_TTL_SECONDS);
  const claims: GuestPreviewPlaybackClaims = {
    v: COURSE_GUEST_PREVIEW_TOKEN_VERSION,
    mode: "guest-preview",
    lessonId: input.lessonId,
    exp: Date.now() + ttl * 1000,
  };

  const payload = toBase64Url(JSON.stringify(claims));
  const signature = createHmac("sha256", deriveTokenKey(env.SESSION_SECRET)).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyGuestPreviewPlaybackToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  const expected = createHmac("sha256", deriveTokenKey(env.SESSION_SECRET)).update(payload).digest("base64url");
  const signatureBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (
    signatureBuf.length !== expectedBuf.length ||
    !timingSafeEqual(signatureBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(fromBase64Url(payload).toString("utf8")) as GuestPreviewPlaybackClaims;
    if (
      claims.v !== COURSE_GUEST_PREVIEW_TOKEN_VERSION ||
      claims.mode !== "guest-preview" ||
      typeof claims.lessonId !== "string" ||
      typeof claims.exp !== "number"
    ) {
      return null;
    }

    if (Date.now() > claims.exp) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}
