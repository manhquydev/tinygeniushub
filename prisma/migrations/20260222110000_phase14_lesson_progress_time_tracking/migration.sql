-- phase14: lesson progress time tracking (idempotent + safe backfill)
BEGIN;

CREATE TABLE IF NOT EXISTS "public"."LessonProgress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."LessonProgress" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "public"."LessonProgress" ADD COLUMN IF NOT EXISTS "childId" TEXT;
ALTER TABLE "public"."LessonProgress" ADD COLUMN IF NOT EXISTS "lessonId" TEXT;
ALTER TABLE "public"."LessonProgress" ADD COLUMN IF NOT EXISTS "timeSpent" INTEGER;
ALTER TABLE "public"."LessonProgress" ADD COLUMN IF NOT EXISTS "lastAccessedAt" TIMESTAMP(3);
ALTER TABLE "public"."LessonProgress" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "public"."LessonProgress" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "public"."LessonProgress"
SET "id" = CONCAT('lp_', md5(random()::text || clock_timestamp()::text))
WHERE "id" IS NULL;

UPDATE "public"."LessonProgress"
SET "timeSpent" = 0
WHERE "timeSpent" IS NULL OR "timeSpent" < 0;

UPDATE "public"."LessonProgress"
SET "lastAccessedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "lastAccessedAt" IS NULL;

UPDATE "public"."LessonProgress"
SET "createdAt" = COALESCE("lastAccessedAt", CURRENT_TIMESTAMP)
WHERE "createdAt" IS NULL;

UPDATE "public"."LessonProgress"
SET "updatedAt" = COALESCE("lastAccessedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

ALTER TABLE "public"."LessonProgress" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "childId" SET NOT NULL;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "lessonId" SET NOT NULL;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "timeSpent" SET NOT NULL;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "timeSpent" SET DEFAULT 0;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "lastAccessedAt" SET NOT NULL;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "lastAccessedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."LessonProgress" ALTER COLUMN "updatedAt" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LessonProgress_pkey'
      AND conrelid = 'public."LessonProgress"'::regclass
  ) THEN
    ALTER TABLE "public"."LessonProgress"
      ADD CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id");
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "childId", "lessonId"
      ORDER BY "lastAccessedAt" DESC, "updatedAt" DESC, "createdAt" DESC, "id" DESC
    ) AS row_num
  FROM "public"."LessonProgress"
)
DELETE FROM "public"."LessonProgress" AS lp
USING ranked
WHERE lp."id" = ranked."id"
  AND ranked.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "LessonProgress_childId_lessonId_key"
  ON "public"."LessonProgress" ("childId", "lessonId");

CREATE INDEX IF NOT EXISTS "LessonProgress_childId_lastAccessedAt_idx"
  ON "public"."LessonProgress" ("childId", "lastAccessedAt");

CREATE INDEX IF NOT EXISTS "LessonProgress_lessonId_idx"
  ON "public"."LessonProgress" ("lessonId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LessonProgress_childId_fkey'
      AND conrelid = 'public."LessonProgress"'::regclass
  ) THEN
    ALTER TABLE "public"."LessonProgress"
      ADD CONSTRAINT "LessonProgress_childId_fkey"
      FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LessonProgress_lessonId_fkey'
      AND conrelid = 'public."LessonProgress"'::regclass
  ) THEN
    ALTER TABLE "public"."LessonProgress"
      ADD CONSTRAINT "LessonProgress_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
