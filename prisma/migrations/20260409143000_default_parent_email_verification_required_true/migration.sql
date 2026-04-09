-- Ensure AdminSecuritySettings has safe defaults for parent email verification.
-- This migration preserves existing explicit admin choices while backfilling missing keys.
INSERT INTO "public"."AdminSecuritySettings" AS settings (
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
  'migration:20260409143000_default_parent_email_verification_required_true',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET
  "rateLimitPolicies" = COALESCE(settings."rateLimitPolicies", '{}'::jsonb),
  "securityControls" = (
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
        WHEN jsonb_typeof(settings."securityControls") = 'object'
          THEN jsonb_strip_nulls(settings."securityControls")
        ELSE '{}'::jsonb
      END,
      '{}'::jsonb
    )
  ),
  "updatedAt" = CURRENT_TIMESTAMP;
