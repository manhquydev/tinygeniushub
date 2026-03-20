-- Phase 16: Add Bunny Stream video fields, Course system, Lifecycle emails, B2B Organizations

-- CreateEnum
CREATE TYPE "public"."LifecycleEmailType" AS ENUM ('TRIAL_WELCOME', 'TRIAL_D3', 'TRIAL_D7');

-- CreateEnum
CREATE TYPE "public"."OrgRole" AS ENUM ('TEACHER_ADMIN', 'STUDENT_PARENT');

-- AlterTable
ALTER TABLE "public"."Lesson" ADD COLUMN     "bunnyVideoId" TEXT,
ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoStatus" TEXT NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "public"."LifecycleEmailLog" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "type" "public"."LifecycleEmailType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceVnd" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,

    CONSTRAINT "CourseLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "paymentId" TEXT,
    "completedAt" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GiftCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "planCode" TEXT NOT NULL DEFAULT 'YEARLY_STANDARD',
    "durationDays" INTEGER NOT NULL DEFAULT 365,
    "usedByParentId" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "GiftCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "domain" TEXT,
    "billingStart" TIMESTAMP(3),
    "billingEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "role" "public"."OrgRole" NOT NULL DEFAULT 'STUDENT_PARENT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifecycleEmailLog_parentId_idx" ON "public"."LifecycleEmailLog"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleEmailLog_parentId_type_key" ON "public"."LifecycleEmailLog"("parentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "public"."Course"("slug");

-- CreateIndex
CREATE INDEX "CourseLesson_courseId_orderNo_idx" ON "public"."CourseLesson"("courseId", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "CourseLesson_courseId_lessonId_key" ON "public"."CourseLesson"("courseId", "lessonId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_parentId_idx" ON "public"."CourseEnrollment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_courseId_parentId_key" ON "public"."CourseEnrollment"("courseId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCode_code_key" ON "public"."GiftCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_role_idx" ON "public"."OrganizationMember"("organizationId", "role");

-- CreateIndex
CREATE INDEX "OrganizationMember_parentId_idx" ON "public"."OrganizationMember"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_parentId_key" ON "public"."OrganizationMember"("organizationId", "parentId");

-- AddForeignKey
ALTER TABLE "public"."LifecycleEmailLog" ADD CONSTRAINT "LifecycleEmailLog_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseLesson" ADD CONSTRAINT "CourseLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseLesson" ADD CONSTRAINT "CourseLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
