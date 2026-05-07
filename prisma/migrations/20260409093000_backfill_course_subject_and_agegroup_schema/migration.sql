-- Backfill schema drift for Course subject/age-group metadata.
-- Aligns Prisma schema with production-like database state.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourseSubject') THEN
    CREATE TYPE "public"."CourseSubject" AS ENUM ('MATH', 'ENGLISH', 'SCIENCE', 'ART', 'MUSIC', 'OTHER');
  END IF;
END $$;

ALTER TYPE "public"."AgeGroup" ADD VALUE IF NOT EXISTS 'AGE_4_6';
ALTER TYPE "public"."AgeGroup" ADD VALUE IF NOT EXISTS 'AGE_7_9';
ALTER TYPE "public"."AgeGroup" ADD VALUE IF NOT EXISTS 'AGE_10_12';

ALTER TABLE "public"."Course"
  ADD COLUMN IF NOT EXISTS "subject" "public"."CourseSubject",
  ADD COLUMN IF NOT EXISTS "ageGroup" "public"."AgeGroup",
  ADD COLUMN IF NOT EXISTS "reviewAverageRating" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Course_subject_isPublished_idx"
  ON "public"."Course" ("subject", "isPublished");

CREATE INDEX IF NOT EXISTS "Course_ageGroup_isPublished_idx"
  ON "public"."Course" ("ageGroup", "isPublished");