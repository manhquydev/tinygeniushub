-- phase15: parent notification system (idempotent)
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'NotificationType'
  ) THEN
    CREATE TYPE "public"."NotificationType" AS ENUM ('ACHIEVEMENT', 'REPORT', 'TIP', 'STREAK');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "public"."NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "type" "public"."NotificationType";
ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "href" TEXT;
ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "read" BOOLEAN;
ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

UPDATE "public"."Notification"
SET "read" = false
WHERE "read" IS NULL;

UPDATE "public"."Notification"
SET "createdAt" = CURRENT_TIMESTAMP
WHERE "createdAt" IS NULL;

ALTER TABLE "public"."Notification" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "message" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "href" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "read" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "read" SET DEFAULT false;
ALTER TABLE "public"."Notification" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "public"."Notification" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Notification_pkey'
      AND conrelid = 'public."Notification"'::regclass
  ) THEN
    ALTER TABLE "public"."Notification"
      ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("id");
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "public"."Notification" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx"
  ON "public"."Notification" ("userId", "read");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Notification_userId_fkey'
      AND conrelid = 'public."Notification"'::regclass
  ) THEN
    ALTER TABLE "public"."Notification"
      ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
