-- Align marketing email opt-in with existing lifecycle behavior
-- and allow unsubscribe route to toggle this flag reliably.
ALTER TABLE "public"."ParentPreferences"
ALTER COLUMN "marketingEmailOptIn" SET DEFAULT true;

UPDATE "public"."ParentPreferences"
SET "marketingEmailOptIn" = true
WHERE "marketingEmailOptIn" = false;
