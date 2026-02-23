-- CreateTable
CREATE TABLE "public"."SystemAnnouncement" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "SystemAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureFlag" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."CouponCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "CouponCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemAnnouncement_active_endsAt_idx" ON "public"."SystemAnnouncement"("active", "endsAt");

-- CreateIndex
CREATE INDEX "SystemAnnouncement_createdAt_idx" ON "public"."SystemAnnouncement"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CouponCode_code_key" ON "public"."CouponCode"("code");

-- CreateIndex
CREATE INDEX "CouponCode_active_expiresAt_idx" ON "public"."CouponCode"("active", "expiresAt");

-- CreateIndex
CREATE INDEX "CouponCode_createdAt_idx" ON "public"."CouponCode"("createdAt" DESC);

-- Seed default feature flags
INSERT INTO "public"."FeatureFlag" ("key", "enabled", "description", "updatedAt", "updatedBy")
VALUES
  ('PARENT_V2_DASHBOARD', false, 'Dashboard phụ huynh phiên bản mới', CURRENT_TIMESTAMP, 'system'),
  ('BETA_LESSON_EDITOR', false, 'Trình soạn nội dung beta', CURRENT_TIMESTAMP, 'system'),
  ('CAREGIVER_VIDEO_CALL', false, 'Tính năng video call người chăm sóc (sắp ra mắt)', CURRENT_TIMESTAMP, 'system'),
  ('REFERRAL_V2', false, 'Hệ thống giới thiệu v2', CURRENT_TIMESTAMP, 'system'),
  ('AI_LESSON_SUGGESTIONS', false, 'Gợi ý bài học bằng AI (sắp ra mắt)', CURRENT_TIMESTAMP, 'system')
ON CONFLICT ("key") DO NOTHING;
