BEGIN;

ALTER TABLE "public"."ChildProfile"
  ADD COLUMN IF NOT EXISTS "dailyGoalMinutes" INTEGER;

UPDATE "public"."ChildProfile"
SET "dailyGoalMinutes" = 20
WHERE "dailyGoalMinutes" IS NULL;

ALTER TABLE "public"."ChildProfile"
  ALTER COLUMN "dailyGoalMinutes" SET DEFAULT 20;

ALTER TABLE "public"."ChildProfile"
  ALTER COLUMN "dailyGoalMinutes" SET NOT NULL;

COMMIT;
