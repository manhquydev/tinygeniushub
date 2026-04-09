-- Enforce secure default: parent accounts must verify email before login.
-- Admin can still turn this off later in emergency scenarios via Admin Security UI.
INSERT INTO "public"."AdminSecuritySettings" (
  "id",
  "rateLimitPolicies",
  "securityControls",
  "updatedByActorId",
  "createdAt",
  "updatedAt"
)
VALUES (
  'default',
  '{}'::jsonb,
  jsonb_build_object(
    'ddosMode', 'normal',
    'globalLimitMultiplier', 1,
    'blockedIpCidrs', '[]'::jsonb,
    'readinessAllowlistCidrs', '[]'::jsonb,
    'parentEmailVerificationRequired', true,
    'parentEmailVerificationTokenTtlMinutes', 15
  ),
  'migration:20260409150000_enforce_parent_email_verification_required_true',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

UPDATE "public"."AdminSecuritySettings"
SET
  "securityControls" = jsonb_set(
    (
      jsonb_build_object(
        'ddosMode', 'normal',
        'globalLimitMultiplier', 1,
        'blockedIpCidrs', '[]'::jsonb,
        'readinessAllowlistCidrs', '[]'::jsonb,
        'parentEmailVerificationRequired', true,
        'parentEmailVerificationTokenTtlMinutes', 15
      )
      || COALESCE(
        CASE
          WHEN jsonb_typeof("securityControls") = 'object'
            THEN jsonb_strip_nulls("securityControls")
          ELSE '{}'::jsonb
        END,
        '{}'::jsonb
      )
    ),
    '{parentEmailVerificationRequired}',
    'true'::jsonb,
    true
  ),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default';
