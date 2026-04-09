CREATE TABLE "public"."ParentEmailVerificationToken" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentEmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParentEmailVerificationToken_tokenHash_key" ON "public"."ParentEmailVerificationToken"("tokenHash");
CREATE INDEX "ParentEmailVerificationToken_parentId_expiresAt_consumedAt_idx" ON "public"."ParentEmailVerificationToken"("parentId", "expiresAt", "consumedAt");

ALTER TABLE "public"."ParentEmailVerificationToken"
  ADD CONSTRAINT "ParentEmailVerificationToken_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backward-compat: keep existing parent accounts usable when enabling verify-before-login.
UPDATE "public"."User"
SET "emailVerified" = TRUE
WHERE "parentId" IS NOT NULL;
