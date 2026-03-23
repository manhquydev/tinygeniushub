-- Add opt-out flag for reply notification emails on blog comments.
ALTER TABLE "public"."BlogComment"
ADD COLUMN "notifyOnReply" BOOLEAN NOT NULL DEFAULT true;
