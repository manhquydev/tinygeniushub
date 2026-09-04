import { z } from "zod";

const runtimeNodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = runtimeNodeEnv === "production";
const allowCiFallbacks = process.env.CI === "true";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().optional(),
);

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().min(1).optional(),
);

const optionalSecret = (minLength: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().min(minLength).optional(),
  );

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().email().optional(),
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  BETTER_AUTH_SECRET: z.string().min(32),
  ADMIN_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  AUTH_TRUSTED_ORIGINS: z
    .string()
    .optional()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => new URL(item).origin),
    ),
  BILLING_WEBHOOK_SECRET: z.string().min(8),
  BILLING_WEBHOOK_MAX_BYTES: z.coerce.number().int().min(1024).max(1024 * 1024).default(256 * 1024),
  BILLING_PROVIDER: z.string().min(1).default("mock_gateway"),
  COURSE_PAYMENT_PROVIDER: z.string().min(1).default("mock_gateway"),
  PAYOS_CLIENT_ID: optionalNonEmptyString,
  PAYOS_API_KEY: optionalNonEmptyString,
  PAYOS_CHECKSUM_KEY: optionalNonEmptyString,
  PAYOS_API_BASE_URL: z.string().url().default("https://api-merchant.payos.vn"),
  STRIPE_SECRET_KEY: optionalNonEmptyString,
  STRIPE_API_BASE_URL: z.string().url().default("https://api.stripe.com"),
  STRIPE_WEBHOOK_SECRETS: z
    .string()
    .optional()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  STRIPE_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(30).max(300).default(300),
  STRIPE_PRICE_ID_MONTHLY: optionalNonEmptyString,
  STRIPE_PRICE_ID_YEARLY: optionalNonEmptyString,
  REPORT_EMAIL_PROVIDER: z.string().min(1).default("mock_email"),
  REPORT_EMAIL_RESEND_API_KEY: optionalNonEmptyString,
  REPORT_EMAIL_RESEND_API_BASE_URL: z.string().url().default("https://api.resend.com"),
  REPORT_EMAIL_BREVO_API_KEY: optionalNonEmptyString,
  REPORT_EMAIL_BREVO_API_BASE_URL: z.string().url().default("https://api.brevo.com/v3"),
  REPORT_EMAIL_BREVO_WEBHOOK_SECRET: optionalNonEmptyString,
  REPORT_EMAIL_FROM: optionalEmail,
  REPORT_EMAIL_FROM_NAME: optionalNonEmptyString,
  REPORT_EMAIL_REPLY_TO: optionalEmail,
  REPORT_EMAIL_TO_OVERRIDE: optionalEmail,
  CRON_SECRET: z.string().min(32),
  STORAGE_PROVIDER: z.string().min(1).default("mock_r2"),
  MEDIA_UPLOAD_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  WATCH_SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(21600).default(7200),
  R2_ACCOUNT_ID: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  MOCK_UPLOAD_SIGNING_SECRET: z.string().min(32),
  BUNNY_STREAM_API_KEY: optionalNonEmptyString,
  BUNNY_STREAM_LIBRARY_ID: z.coerce.number().int().positive().optional(),
  BUNNY_STREAM_CDN_HOSTNAME: optionalNonEmptyString,
  BUNNY_WEBHOOK_SECRET: optionalSecret(8),
  REDIS_URL: z.string().url(),
  RATE_LIMIT_TRUST_PROXY: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  RATE_LIMIT_TRUSTED_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  ALLOW_PROD_MOCK_CHECKOUT_CALLBACK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  OBSERVABILITY_SERVICE_NAME: z.string().min(1).default("tinygeniushub-web"),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  GA4_PROPERTY_ID: optionalNonEmptyString,
  GA4_SERVICE_ACCOUNT_CLIENT_EMAIL: optionalEmail,
  GA4_SERVICE_ACCOUNT_PRIVATE_KEY: optionalNonEmptyString,
  GA4_SOT_REQUIRED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  // Microsoft Clarity analytics (optional)
  NEXT_PUBLIC_CLARITY_PROJECT_ID: optionalNonEmptyString,
  CLARITY_DATA_EXPORT_TOKEN: optionalNonEmptyString,
  ADMIN_EMAILS: z
    .string()
    .optional()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0),
    ),
  HEALTH_EXPOSE_DETAILS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  HEALTH_READY_CACHE_MS: z.coerce.number().int().min(0).max(60_000).default(5_000),
});

const parsedEnv = envSchema.parse({
  DATABASE_URL:
    process.env.DATABASE_URL ?? (isProduction ? undefined : "postgresql://postgres:postgres@localhost:5432/tinygeniushub?schema=public"),
  SESSION_SECRET:
    process.env.SESSION_SECRET ?? (isProduction ? undefined : "dev-session-secret-change-this-in-production-32"),
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ??
    (isProduction && !allowCiFallbacks ? undefined : "dev-better-auth-secret-change-this-in-production-32"),
  ADMIN_AUTH_SECRET:
    process.env.ADMIN_AUTH_SECRET ??
    (isProduction && !allowCiFallbacks ? undefined : "dev-admin-auth-secret-change-this-in-production-32"),
  BETTER_AUTH_URL:
    process.env.BETTER_AUTH_URL ?? (isProduction && !allowCiFallbacks ? undefined : "http://localhost:3000"),
  AUTH_TRUSTED_ORIGINS: process.env.AUTH_TRUSTED_ORIGINS,
  BILLING_WEBHOOK_SECRET: process.env.BILLING_WEBHOOK_SECRET ?? (isProduction ? undefined : "dev-webhook-secret"),
  BILLING_WEBHOOK_MAX_BYTES: process.env.BILLING_WEBHOOK_MAX_BYTES,
  BILLING_PROVIDER: process.env.BILLING_PROVIDER,
  COURSE_PAYMENT_PROVIDER: process.env.COURSE_PAYMENT_PROVIDER,
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID,
  PAYOS_API_KEY: process.env.PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY,
  PAYOS_API_BASE_URL: process.env.PAYOS_API_BASE_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_API_BASE_URL: process.env.STRIPE_API_BASE_URL,
  STRIPE_WEBHOOK_SECRETS: process.env.STRIPE_WEBHOOK_SECRETS,
  STRIPE_WEBHOOK_TOLERANCE_SECONDS: process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS,
  STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY,
  STRIPE_PRICE_ID_YEARLY: process.env.STRIPE_PRICE_ID_YEARLY,
  REPORT_EMAIL_PROVIDER: process.env.REPORT_EMAIL_PROVIDER,
  REPORT_EMAIL_RESEND_API_KEY: process.env.REPORT_EMAIL_RESEND_API_KEY,
  REPORT_EMAIL_RESEND_API_BASE_URL: process.env.REPORT_EMAIL_RESEND_API_BASE_URL,
  REPORT_EMAIL_BREVO_API_KEY: process.env.REPORT_EMAIL_BREVO_API_KEY,
  REPORT_EMAIL_BREVO_API_BASE_URL: process.env.REPORT_EMAIL_BREVO_API_BASE_URL,
  REPORT_EMAIL_BREVO_WEBHOOK_SECRET: process.env.REPORT_EMAIL_BREVO_WEBHOOK_SECRET,
  REPORT_EMAIL_FROM: process.env.REPORT_EMAIL_FROM,
  REPORT_EMAIL_FROM_NAME: process.env.REPORT_EMAIL_FROM_NAME,
  REPORT_EMAIL_REPLY_TO: process.env.REPORT_EMAIL_REPLY_TO,
  REPORT_EMAIL_TO_OVERRIDE: process.env.REPORT_EMAIL_TO_OVERRIDE,
  CRON_SECRET: process.env.CRON_SECRET ?? (isProduction && !allowCiFallbacks ? undefined : "dev-cron-secret-change-this-must-be-32-chars!!"),
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  MEDIA_UPLOAD_URL_TTL_SECONDS: process.env.MEDIA_UPLOAD_URL_TTL_SECONDS,
  WATCH_SESSION_TTL_SECONDS: process.env.WATCH_SESSION_TTL_SECONDS,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  MOCK_UPLOAD_SIGNING_SECRET:
    process.env.MOCK_UPLOAD_SIGNING_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    (isProduction && !allowCiFallbacks ? undefined : "dev-mock-upload-signing-secret-change-this-in-production-32"),
  BUNNY_STREAM_API_KEY: process.env.BUNNY_STREAM_API_KEY,
  BUNNY_STREAM_LIBRARY_ID: process.env.BUNNY_STREAM_LIBRARY_ID,
  BUNNY_STREAM_CDN_HOSTNAME: process.env.BUNNY_STREAM_CDN_HOSTNAME,
  BUNNY_WEBHOOK_SECRET: process.env.BUNNY_WEBHOOK_SECRET,
  REDIS_URL: process.env.REDIS_URL ?? (isProduction ? undefined : "redis://localhost:6379"),
  RATE_LIMIT_TRUST_PROXY: process.env.RATE_LIMIT_TRUST_PROXY,
  RATE_LIMIT_TRUSTED_HOPS: process.env.RATE_LIMIT_TRUSTED_HOPS,
  ALLOW_PROD_MOCK_CHECKOUT_CALLBACK: process.env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK,
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  OBSERVABILITY_SERVICE_NAME: process.env.OBSERVABILITY_SERVICE_NAME,
  APP_VERSION: process.env.APP_VERSION,
  GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID,
  GA4_SERVICE_ACCOUNT_CLIENT_EMAIL: process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL,
  GA4_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY,
  GA4_SOT_REQUIRED: process.env.GA4_SOT_REQUIRED,
  // Microsoft Clarity analytics
  NEXT_PUBLIC_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  CLARITY_DATA_EXPORT_TOKEN: process.env.CLARITY_DATA_EXPORT_TOKEN,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  HEALTH_EXPOSE_DETAILS: process.env.HEALTH_EXPOSE_DETAILS,
  HEALTH_READY_CACHE_MS: process.env.HEALTH_READY_CACHE_MS,
});

if (parsedEnv.NODE_ENV === "production" && parsedEnv.HEALTH_EXPOSE_DETAILS) {
  throw new Error("HEALTH_EXPOSE_DETAILS must be false in production");
}

if (parsedEnv.NODE_ENV === "production" && !parsedEnv.RATE_LIMIT_TRUST_PROXY) {
  throw new Error("RATE_LIMIT_TRUST_PROXY must be true in production");
}

if (parsedEnv.NODE_ENV === "production" && parsedEnv.COURSE_PAYMENT_PROVIDER === "mock_gateway") {
  throw new Error("COURSE_PAYMENT_PROVIDER=mock_gateway is not allowed in production");
}

if (parsedEnv.NODE_ENV === "production" && parsedEnv.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK) {
  throw new Error("ALLOW_PROD_MOCK_CHECKOUT_CALLBACK must be false in production");
}

if (parsedEnv.NODE_ENV === "production" && parsedEnv.GA4_SOT_REQUIRED) {
  if (
    !parsedEnv.GA4_PROPERTY_ID ||
    !parsedEnv.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL ||
    !parsedEnv.GA4_SERVICE_ACCOUNT_PRIVATE_KEY
  ) {
    throw new Error(
      "GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_CLIENT_EMAIL, GA4_SERVICE_ACCOUNT_PRIVATE_KEY are required when GA4_SOT_REQUIRED=true in production",
    );
  }
}

if (parsedEnv.BILLING_PROVIDER === "stripe" && !parsedEnv.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required when BILLING_PROVIDER=stripe");
}

if (parsedEnv.BILLING_PROVIDER === "stripe" && parsedEnv.STRIPE_WEBHOOK_SECRETS.length === 0) {
  throw new Error("STRIPE_WEBHOOK_SECRETS is required when BILLING_PROVIDER=stripe");
}

if (parsedEnv.COURSE_PAYMENT_PROVIDER === "payos") {
  if (!parsedEnv.PAYOS_CLIENT_ID || !parsedEnv.PAYOS_API_KEY || !parsedEnv.PAYOS_CHECKSUM_KEY) {
    throw new Error(
      "PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY are required when COURSE_PAYMENT_PROVIDER=payos",
    );
  }
}

if (parsedEnv.REPORT_EMAIL_PROVIDER === "resend") {
  if (!parsedEnv.REPORT_EMAIL_RESEND_API_KEY) {
    throw new Error("REPORT_EMAIL_RESEND_API_KEY is required when REPORT_EMAIL_PROVIDER=resend");
  }

  if (!parsedEnv.REPORT_EMAIL_FROM) {
    throw new Error("REPORT_EMAIL_FROM is required when REPORT_EMAIL_PROVIDER=resend");
  }
}

if (parsedEnv.REPORT_EMAIL_PROVIDER === "brevo") {
  if (!parsedEnv.REPORT_EMAIL_BREVO_API_KEY) {
    throw new Error("REPORT_EMAIL_BREVO_API_KEY is required when REPORT_EMAIL_PROVIDER=brevo");
  }

  if (!parsedEnv.REPORT_EMAIL_FROM) {
    throw new Error("REPORT_EMAIL_FROM is required when REPORT_EMAIL_PROVIDER=brevo");
  }
}

export const env = parsedEnv;
