BEGIN;

CREATE TABLE IF NOT EXISTS "public"."CaregiverInvite" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "accepted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CaregiverInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CaregiverInvite_token_key"
  ON "public"."CaregiverInvite" ("token");

CREATE UNIQUE INDEX IF NOT EXISTS "CaregiverInvite_parentId_email_key"
  ON "public"."CaregiverInvite" ("parentId", "email");

CREATE INDEX IF NOT EXISTS "CaregiverInvite_parentId_createdAt_idx"
  ON "public"."CaregiverInvite" ("parentId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CaregiverInvite_parentId_fkey'
      AND conrelid = 'public."CaregiverInvite"'::regclass
  ) THEN
    ALTER TABLE "public"."CaregiverInvite"
      ADD CONSTRAINT "CaregiverInvite_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
