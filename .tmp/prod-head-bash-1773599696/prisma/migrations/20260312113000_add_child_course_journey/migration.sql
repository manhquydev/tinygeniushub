-- Phase A: Child Course Journey for Cloud Garden / Beanstalk progression

-- CreateEnum
CREATE TYPE "public"."ChildCourseJourneyStatus" AS ENUM ('SEEDED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ChildCourseJourneyEventType" AS ENUM ('PLANTED', 'WATERED', 'LESSON_COMPLETED', 'TIER_UNLOCKED', 'JOURNEY_COMPLETED');

-- CreateTable
CREATE TABLE "public"."ChildCourseJourney" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sourceEnrollmentId" TEXT,
    "status" "public"."ChildCourseJourneyStatus" NOT NULL DEFAULT 'SEEDED',
    "seedName" TEXT NOT NULL,
    "currentTierNo" INTEGER NOT NULL DEFAULT 1,
    "currentTierProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildCourseJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChildCourseJourneyTier" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "tierNo" INTEGER NOT NULL,
    "tierKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lessonTotal" INTEGER NOT NULL,
    "lessonCompleted" INTEGER NOT NULL DEFAULT 0,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildCourseJourneyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChildCourseJourneyEvent" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "eventType" "public"."ChildCourseJourneyEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildCourseJourneyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChildCourseJourney_childId_courseId_key" ON "public"."ChildCourseJourney"("childId", "courseId");

-- CreateIndex
CREATE INDEX "ChildCourseJourney_childId_status_idx" ON "public"."ChildCourseJourney"("childId", "status");

-- CreateIndex
CREATE INDEX "ChildCourseJourney_courseId_idx" ON "public"."ChildCourseJourney"("courseId");

-- CreateIndex
CREATE INDEX "ChildCourseJourney_sourceEnrollmentId_idx" ON "public"."ChildCourseJourney"("sourceEnrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildCourseJourneyTier_journeyId_tierNo_key" ON "public"."ChildCourseJourneyTier"("journeyId", "tierNo");

-- CreateIndex
CREATE INDEX "ChildCourseJourneyTier_journeyId_isUnlocked_tierNo_idx" ON "public"."ChildCourseJourneyTier"("journeyId", "isUnlocked", "tierNo");

-- CreateIndex
CREATE INDEX "ChildCourseJourneyEvent_journeyId_createdAt_idx" ON "public"."ChildCourseJourneyEvent"("journeyId", "createdAt");

-- CreateIndex
CREATE INDEX "ChildCourseJourneyEvent_journeyId_eventType_createdAt_idx" ON "public"."ChildCourseJourneyEvent"("journeyId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ChildCourseJourney" ADD CONSTRAINT "ChildCourseJourney_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildCourseJourney" ADD CONSTRAINT "ChildCourseJourney_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildCourseJourney" ADD CONSTRAINT "ChildCourseJourney_sourceEnrollmentId_fkey" FOREIGN KEY ("sourceEnrollmentId") REFERENCES "public"."CourseEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildCourseJourneyTier" ADD CONSTRAINT "ChildCourseJourneyTier_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "public"."ChildCourseJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildCourseJourneyEvent" ADD CONSTRAINT "ChildCourseJourneyEvent_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "public"."ChildCourseJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;
