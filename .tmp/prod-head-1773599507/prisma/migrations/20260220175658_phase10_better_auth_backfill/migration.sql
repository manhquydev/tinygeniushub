-- Backfill Better Auth identity tables from existing parent accounts.
INSERT INTO "public"."User" ("id", "name", "email", "emailVerified", "parentId", "createdAt", "updatedAt")
SELECT
  p."id",
  COALESCE(NULLIF(p."displayName", ''), LOWER(p."email")),
  LOWER(p."email"),
  false,
  p."id",
  p."createdAt",
  p."updatedAt"
FROM "public"."ParentAccount" p
ON CONFLICT ("id")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "parentId" = EXCLUDED."parentId",
  "updatedAt" = GREATEST("public"."User"."updatedAt", EXCLUDED."updatedAt");

INSERT INTO "public"."Account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT
  CONCAT('credential-', p."id"),
  p."id",
  'credential',
  p."id",
  p."passwordHash",
  p."createdAt",
  p."updatedAt"
FROM "public"."ParentAccount" p
ON CONFLICT ("providerId", "accountId")
DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "password" = EXCLUDED."password",
  "updatedAt" = GREATEST("public"."Account"."updatedAt", EXCLUDED."updatedAt");
