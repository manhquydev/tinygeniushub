WITH ranked_super_admins AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS rank_no
  FROM "AdminAccount"
  WHERE "role" = 'SUPER_ADMIN'
)
UPDATE "AdminAccount"
SET "role" = 'SUPPORT_AGENT'
WHERE "id" IN (
  SELECT "id"
  FROM ranked_super_admins
  WHERE rank_no > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_account_single_super_admin_idx"
ON "AdminAccount" ("role")
WHERE "role" = 'SUPER_ADMIN';
