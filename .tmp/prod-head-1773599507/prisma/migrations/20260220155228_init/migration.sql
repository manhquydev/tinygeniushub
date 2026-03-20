-- CreateEnum
CREATE TYPE "public"."PlanCode" AS ENUM ('TRIAL', 'YEARLY_STANDARD', 'YEARLY_FAMILY_PLUS');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE_STANDARD', 'ACTIVE_FAMILYPLUS', 'CANCELED_AT_PERIOD_END', 'EXPIRED', 'GRACE', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."RetentionPolicy" AS ENUM ('DEFAULT_90D', 'EXTENDED_365D');

-- CreateEnum
CREATE TYPE "public"."TrackCode" AS ENUM ('ENGLISH', 'MATH', 'HABIT');

-- CreateEnum
CREATE TYPE "public"."EvidenceMediaType" AS ENUM ('PHOTO', 'AUDIO');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."RewardType" AS ENUM ('LESSON_COMPLETED', 'STREAK_BADGE', 'MILESTONE_CERTIFICATE');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('QUEUED', 'SENT', 'BOUNCED', 'OPENED', 'CLICKED');

-- CreateEnum
CREATE TYPE "public"."CaregiverRole" AS ENUM ('VIEW_ONLY');

-- CreateTable
CREATE TABLE "public"."ParentAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "ParentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParentPreferences" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "weeklyReportChannel" TEXT NOT NULL DEFAULT 'IN_APP_AND_EMAIL',
    "weeklyReportEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmailOptIn" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',

    CONSTRAINT "ParentPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyEmailPreference" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WeeklyEmailPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CaregiverAccount" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "public"."CaregiverRole" NOT NULL DEFAULT 'VIEW_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaregiverAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "planCode" "public"."PlanCode" NOT NULL DEFAULT 'TRIAL',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "childProfileLimit" INTEGER NOT NULL DEFAULT 3,
    "caregiverLimit" INTEGER NOT NULL DEFAULT 2,
    "portfolioRetentionMaxDays" INTEGER NOT NULL DEFAULT 90,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChildProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "ageBand" TEXT NOT NULL,
    "avatarId" TEXT,
    "placementResult" JSONB,
    "dailyMinutesLimit" INTEGER NOT NULL DEFAULT 20,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'vi',
    "progressSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Track" (
    "id" TEXT NOT NULL,
    "code" "public"."TrackCode" NOT NULL,
    "title" TEXT NOT NULL,
    "isTrialEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Level" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Unit" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lesson" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "trialEnabled" BOOLEAN NOT NULL DEFAULT false,
    "videoSource" TEXT,
    "offlineCardMarkdown" TEXT,
    "parentScriptMarkdown" TEXT,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "passCriteria" INTEGER NOT NULL DEFAULT 80,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LessonCompletion" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minutesLearned" INTEGER NOT NULL DEFAULT 0,
    "quizScore" INTEGER NOT NULL,
    "checklist" JSONB NOT NULL,

    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evidence" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completionId" TEXT,
    "checklist" JSONB NOT NULL,
    "quizScore" INTEGER NOT NULL,
    "retentionPolicy" "public"."RetentionPolicy" NOT NULL DEFAULT 'DEFAULT_90D',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "showInPortfolio" BOOLEAN NOT NULL DEFAULT true,
    "shareableProgressCard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EvidenceMedia" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "type" "public"."EvidenceMediaType" NOT NULL,
    "objectPath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "checksum" TEXT,
    "uploadedByParentId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardGrant" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "public"."RewardType" NOT NULL DEFAULT 'LESSON_COMPLETED',
    "name" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgressState" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "trackCode" "public"."TrackCode" NOT NULL,
    "currentLevelId" TEXT,
    "currentUnitId" TEXT,
    "weekNo" INTEGER,
    "dayNo" INTEGER,
    "lastLessonCompletedAt" TIMESTAMP(3),
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "weeklyGoalStatus" TEXT,
    "reviewSchedule" JSONB,

    CONSTRAINT "ProgressState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyReport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "minutesLearned" INTEGER NOT NULL DEFAULT 0,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "skillsSummary" JSONB,
    "recommendations" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredInAppAt" TIMESTAMP(3),
    "deliveredEmailAt" TIMESTAMP(3),
    "emailStatus" "public"."EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "deepLinkToken" TEXT NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentRecord" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "provider" TEXT NOT NULL,
    "providerTransactionId" TEXT NOT NULL,
    "amountVnd" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "public"."PaymentStatus" NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "status" "public"."WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditTrail" JSONB,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralCode" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralAttribution" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "referredParentId" TEXT NOT NULL,
    "signedUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReferralAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BackgroundJobRun" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "BackgroundJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_email_key" ON "public"."ParentAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_parentId_idx" ON "public"."Session"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentPreferences_parentId_key" ON "public"."ParentPreferences"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyEmailPreference_parentId_childId_key" ON "public"."WeeklyEmailPreference"("parentId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "CaregiverAccount_parentId_email_key" ON "public"."CaregiverAccount"("parentId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_parentId_key" ON "public"."Subscription"("parentId");

-- CreateIndex
CREATE INDEX "ChildProfile_parentId_idx" ON "public"."ChildProfile"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Track_code_key" ON "public"."Track"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Level_trackId_orderNo_key" ON "public"."Level"("trackId", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_levelId_orderNo_key" ON "public"."Unit"("levelId", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "public"."Lesson"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_unitId_orderNo_key" ON "public"."Lesson"("unitId", "orderNo");

-- CreateIndex
CREATE INDEX "Activity_lessonId_idx" ON "public"."Activity"("lessonId");

-- CreateIndex
CREATE INDEX "LessonCompletion_childId_completedAt_idx" ON "public"."LessonCompletion"("childId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LessonCompletion_childId_lessonId_key" ON "public"."LessonCompletion"("childId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_completionId_key" ON "public"."Evidence"("completionId");

-- CreateIndex
CREATE INDEX "Evidence_childId_createdAt_idx" ON "public"."Evidence"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "EvidenceMedia_evidenceId_idx" ON "public"."EvidenceMedia"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardGrant_childId_lessonId_type_key" ON "public"."RewardGrant"("childId", "lessonId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressState_childId_trackCode_key" ON "public"."ProgressState"("childId", "trackCode");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_deepLinkToken_key" ON "public"."WeeklyReport"("deepLinkToken");

-- CreateIndex
CREATE INDEX "WeeklyReport_childId_generatedAt_idx" ON "public"."WeeklyReport"("childId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_childId_weekStart_key" ON "public"."WeeklyReport"("childId", "weekStart");

-- CreateIndex
CREATE INDEX "PaymentRecord_parentId_processedAt_idx" ON "public"."PaymentRecord"("parentId", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_provider_providerTransactionId_key" ON "public"."PaymentRecord"("provider", "providerTransactionId");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_createdAt_idx" ON "public"."WebhookEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "public"."WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "public"."AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_parentId_key" ON "public"."ReferralCode"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "public"."ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralAttribution_referredParentId_key" ON "public"."ReferralAttribution"("referredParentId");

-- CreateIndex
CREATE INDEX "ReferralAttribution_referralCodeId_idx" ON "public"."ReferralAttribution"("referralCodeId");

-- CreateIndex
CREATE INDEX "BackgroundJobRun_jobType_startedAt_idx" ON "public"."BackgroundJobRun"("jobType", "startedAt");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentPreferences" ADD CONSTRAINT "ParentPreferences_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyEmailPreference" ADD CONSTRAINT "WeeklyEmailPreference_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyEmailPreference" ADD CONSTRAINT "WeeklyEmailPreference_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaregiverAccount" ADD CONSTRAINT "CaregiverAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildProfile" ADD CONSTRAINT "ChildProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Level" ADD CONSTRAINT "Level_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "public"."Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lesson" ADD CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonCompletion" ADD CONSTRAINT "LessonCompletion_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonCompletion" ADD CONSTRAINT "LessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "public"."LessonCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EvidenceMedia" ADD CONSTRAINT "EvidenceMedia_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "public"."Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardGrant" ADD CONSTRAINT "RewardGrant_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardGrant" ADD CONSTRAINT "RewardGrant_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgressState" ADD CONSTRAINT "ProgressState_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgressState" ADD CONSTRAINT "ProgressState_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "public"."Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgressState" ADD CONSTRAINT "ProgressState_currentUnitId_fkey" FOREIGN KEY ("currentUnitId") REFERENCES "public"."Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyReport" ADD CONSTRAINT "WeeklyReport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentRecord" ADD CONSTRAINT "PaymentRecord_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentRecord" ADD CONSTRAINT "PaymentRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralCode" ADD CONSTRAINT "ReferralCode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "public"."ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_referredParentId_fkey" FOREIGN KEY ("referredParentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
