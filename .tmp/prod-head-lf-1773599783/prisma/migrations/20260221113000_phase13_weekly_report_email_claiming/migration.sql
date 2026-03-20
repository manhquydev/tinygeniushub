-- Add PROCESSING state so workers can atomically claim queued weekly report emails.
ALTER TYPE "public"."EmailStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

-- Track when a report was claimed to recover stale claims after worker crashes.
ALTER TABLE "public"."WeeklyReport"
ADD COLUMN IF NOT EXISTS "emailClaimedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "WeeklyReport_emailStatus_emailClaimedAt_idx"
ON "public"."WeeklyReport"("emailStatus", "emailClaimedAt");
