-- CreateEnum
CREATE TYPE "SkillDomain" AS ENUM ('MATH', 'ENGLISH_PHONICS');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('NOT_STARTED', 'NOVICE', 'DEVELOPING', 'PROFICIENT', 'MASTERED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable: Add adaptiveEnabled to ChildProfile
ALTER TABLE "ChildProfile" ADD COLUMN "adaptiveEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add difficulty and skillId to Activity
ALTER TABLE "Activity" ADD COLUMN "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Activity" ADD COLUMN "skillId" TEXT;

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "domain" "SkillDomain" NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "gradeLevel" INTEGER NOT NULL,
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "iconEmoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillPrerequisite" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "SkillPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonSkill" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LessonSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildSkillState" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryLevel" "MasteryLevel" NOT NULL DEFAULT 'NOT_STARTED',
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastReviewAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildSkillState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillAttempt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "activityId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "responseMs" INTEGER,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueue" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementTest" (
    "id" TEXT NOT NULL,
    "domain" "SkillDomain" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minItems" INTEGER NOT NULL DEFAULT 10,
    "maxItems" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementTestItem" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "activityType" TEXT NOT NULL,
    "activitySpec" JSONB NOT NULL,
    "orderHint" INTEGER NOT NULL DEFAULT 0,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementTestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementTestAttempt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "correctItems" INTEGER NOT NULL DEFAULT 0,
    "resultSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementTestResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "responseMs" INTEGER,
    "rawResponse" JSONB,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementTestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_code_key" ON "Skill"("code");
CREATE INDEX "Skill_domain_gradeLevel_orderNo_idx" ON "Skill"("domain", "gradeLevel", "orderNo");
CREATE INDEX "Skill_parentId_idx" ON "Skill"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillPrerequisite_skillId_prerequisiteId_key" ON "SkillPrerequisite"("skillId", "prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonSkill_lessonId_skillId_key" ON "LessonSkill"("lessonId", "skillId");
CREATE INDEX "LessonSkill_skillId_idx" ON "LessonSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildSkillState_childId_skillId_key" ON "ChildSkillState"("childId", "skillId");
CREATE INDEX "ChildSkillState_childId_masteryLevel_idx" ON "ChildSkillState"("childId", "masteryLevel");
CREATE INDEX "ChildSkillState_childId_nextReviewAt_idx" ON "ChildSkillState"("childId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "SkillAttempt_childId_skillId_createdAt_idx" ON "SkillAttempt"("childId", "skillId", "createdAt");
CREATE INDEX "SkillAttempt_childId_createdAt_idx" ON "SkillAttempt"("childId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewQueue_childId_skillId_scheduledAt_key" ON "ReviewQueue"("childId", "skillId", "scheduledAt");
CREATE INDEX "ReviewQueue_childId_scheduledAt_idx" ON "ReviewQueue"("childId", "scheduledAt");
CREATE INDEX "ReviewQueue_childId_completedAt_idx" ON "ReviewQueue"("childId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementTest_domain_isActive_key" ON "PlacementTest"("domain", "isActive");

-- CreateIndex
CREATE INDEX "PlacementTestItem_testId_difficulty_idx" ON "PlacementTestItem"("testId", "difficulty");
CREATE INDEX "PlacementTestItem_skillId_idx" ON "PlacementTestItem"("skillId");

-- CreateIndex
CREATE INDEX "PlacementTestAttempt_childId_testId_idx" ON "PlacementTestAttempt"("childId", "testId");

-- CreateIndex
CREATE INDEX "PlacementTestResponse_attemptId_idx" ON "PlacementTestResponse"("attemptId");

-- CreateIndex (Activity)
CREATE INDEX "Activity_skillId_idx" ON "Activity"("skillId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSkill" ADD CONSTRAINT "LessonSkill_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonSkill" ADD CONSTRAINT "LessonSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSkillState" ADD CONSTRAINT "ChildSkillState_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildSkillState" ADD CONSTRAINT "ChildSkillState_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAttempt" ADD CONSTRAINT "SkillAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillAttempt" ADD CONSTRAINT "SkillAttempt_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillAttempt" ADD CONSTRAINT "SkillAttempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementTestItem" ADD CONSTRAINT "PlacementTestItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "PlacementTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementTestItem" ADD CONSTRAINT "PlacementTestItem_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementTestAttempt" ADD CONSTRAINT "PlacementTestAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementTestAttempt" ADD CONSTRAINT "PlacementTestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "PlacementTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementTestResponse" ADD CONSTRAINT "PlacementTestResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PlacementTestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementTestResponse" ADD CONSTRAINT "PlacementTestResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PlacementTestItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
