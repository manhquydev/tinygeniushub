-- CreateEnum
CREATE TYPE "AbekaSubjectCode" AS ENUM ('PHONICS', 'ARITHMETIC', 'COMBINATION', 'ACTIVITIES', 'ROUTINES', 'SEATWORK_C', 'SEATWORK_M', 'SPELLING', 'WRITING_C', 'WRITING_M', 'BIBLE', 'HISTORY', 'SCIENCE', 'HEALTH', 'LITERATURE', 'COMPOSITION', 'VOCABULARY', 'POETRY', 'READING', 'GRAMMAR');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "AbekaAssignmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'OVERDUE');

-- CreateTable
CREATE TABLE "AbekaVideo" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "subjectCode" "AbekaSubjectCode" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cdnUrl" TEXT NOT NULL,
    "m3u8Path" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationMinutes" INTEGER,
    "teacherName" TEXT,
    "lessonPackageId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaGrade" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "description" TEXT,
    "totalLessons" INTEGER NOT NULL DEFAULT 170,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaSubject" (
    "id" TEXT NOT NULL,
    "code" "AbekaSubjectCode" NOT NULL,
    "name" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "description" TEXT,
    "iconEmoji" TEXT,
    "colorHex" TEXT,
    "gradeId" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaLesson" (
    "id" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "gradeId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "bibleVerse" TEXT,
    "memoryWork" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaLessonPackage" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "subjectCode" "AbekaSubjectCode" NOT NULL,
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER,

    CONSTRAINT "AbekaLessonPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaLearningJourney" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gradeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetEndDate" TIMESTAMP(3),
    "daysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "minutesPerDay" INTEGER NOT NULL DEFAULT 120,
    "currentLessonNo" INTEGER NOT NULL DEFAULT 1,
    "totalLessons" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AbekaLearningJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaWeeklyPlan" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetLessons" INTEGER NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "completedLessons" INTEGER NOT NULL DEFAULT 0,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaWeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaDailyPlan" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "targetMinutes" INTEGER NOT NULL DEFAULT 120,
    "completedAssignments" INTEGER NOT NULL DEFAULT 0,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "parentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaDailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaAssignment" (
    "id" TEXT NOT NULL,
    "dailyPlanId" TEXT NOT NULL,
    "lessonPackageId" TEXT NOT NULL,
    "subjectCode" "AbekaSubjectCode" NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "status" "AbekaAssignmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "targetMinutes" INTEGER,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaWatchProgress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchPercent" INTEGER NOT NULL DEFAULT 0,
    "watchSeconds" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastPosition" INTEGER NOT NULL DEFAULT 0,
    "lastWatchedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaWatchProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildGradeProgress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "currentLessonNo" INTEGER NOT NULL DEFAULT 1,
    "totalLessons" INTEGER NOT NULL,
    "completedLessons" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "subjectProgress" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildGradeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaStreak" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "freezeCount" INTEGER NOT NULL DEFAULT 0,
    "freezeUsedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaStreakHistory" (
    "id" TEXT NOT NULL,
    "streakId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "streakCount" INTEGER NOT NULL,
    "activityMinutes" INTEGER NOT NULL,
    "lessonsCompleted" INTEGER NOT NULL,
    "streakMaintained" BOOLEAN NOT NULL DEFAULT true,
    "freezeUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbekaStreakHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaSkillNode" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "parentId" TEXT,
    "subjectCode" "AbekaSubjectCode" NOT NULL,
    "name" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "description" TEXT,
    "iconEmoji" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiredLessons" INTEGER[],
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaSkillNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaSkillPrerequisite" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "AbekaSkillPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildSkillProgress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildSkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaBadge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionVi" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#FFD700',
    "animationUrl" TEXT,
    "requirementType" TEXT NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "orderNo" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildEarnedBadge" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earnedContext" JSONB,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "ChildEarnedBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbekaParentPreferences" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "defaultStartTime" TEXT NOT NULL DEFAULT '08:00',
    "defaultDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "defaultMinutesPerDay" INTEGER NOT NULL DEFAULT 120,
    "notifyOnLessonComplete" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnStreakMilestone" BOOLEAN NOT NULL DEFAULT true,
    "notifyWeeklyProgress" BOOLEAN NOT NULL DEFAULT true,
    "preferredSubjects" "AbekaSubjectCode"[],
    "skipSubjects" "AbekaSubjectCode"[],
    "showBibleContent" BOOLEAN NOT NULL DEFAULT true,
    "showSkillTree" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbekaParentPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbekaVideo_videoId_key" ON "AbekaVideo"("videoId");

-- CreateIndex
CREATE INDEX "AbekaVideo_gradeLevel_lessonNumber_idx" ON "AbekaVideo"("gradeLevel", "lessonNumber");

-- CreateIndex
CREATE INDEX "AbekaVideo_subjectCode_idx" ON "AbekaVideo"("subjectCode");

-- CreateIndex
CREATE INDEX "AbekaVideo_videoId_idx" ON "AbekaVideo"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaGrade_level_key" ON "AbekaGrade"("level");

-- CreateIndex
CREATE INDEX "AbekaGrade_level_idx" ON "AbekaGrade"("level");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaSubject_gradeId_code_key" ON "AbekaSubject"("gradeId", "code");

-- CreateIndex
CREATE INDEX "AbekaSubject_gradeId_idx" ON "AbekaSubject"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaLesson_gradeId_lessonNumber_key" ON "AbekaLesson"("gradeId", "lessonNumber");

-- CreateIndex
CREATE INDEX "AbekaLesson_gradeId_lessonNumber_idx" ON "AbekaLesson"("gradeId", "lessonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaLessonPackage_lessonId_subjectCode_key" ON "AbekaLessonPackage"("lessonId", "subjectCode");

-- CreateIndex
CREATE INDEX "AbekaLessonPackage_lessonId_idx" ON "AbekaLessonPackage"("lessonId");

-- CreateIndex
CREATE INDEX "AbekaLearningJourney_childId_idx" ON "AbekaLearningJourney"("childId");

-- CreateIndex
CREATE INDEX "AbekaLearningJourney_childId_status_idx" ON "AbekaLearningJourney"("childId", "status");

-- CreateIndex
CREATE INDEX "AbekaLearningJourney_gradeId_idx" ON "AbekaLearningJourney"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaWeeklyPlan_journeyId_weekNumber_key" ON "AbekaWeeklyPlan"("journeyId", "weekNumber");

-- CreateIndex
CREATE INDEX "AbekaWeeklyPlan_journeyId_weekNumber_idx" ON "AbekaWeeklyPlan"("journeyId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaDailyPlan_weeklyPlanId_dayOfWeek_key" ON "AbekaDailyPlan"("weeklyPlanId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "AbekaDailyPlan_weeklyPlanId_date_idx" ON "AbekaDailyPlan"("weeklyPlanId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaAssignment_dailyPlanId_lessonPackageId_key" ON "AbekaAssignment"("dailyPlanId", "lessonPackageId");

-- CreateIndex
CREATE INDEX "AbekaAssignment_dailyPlanId_status_idx" ON "AbekaAssignment"("dailyPlanId", "status");

-- CreateIndex
CREATE INDEX "AbekaAssignment_dailyPlanId_orderNo_idx" ON "AbekaAssignment"("dailyPlanId", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaWatchProgress_childId_videoId_key" ON "AbekaWatchProgress"("childId", "videoId");

-- CreateIndex
CREATE INDEX "AbekaWatchProgress_childId_lastWatchedAt_idx" ON "AbekaWatchProgress"("childId", "lastWatchedAt");

-- CreateIndex
CREATE INDEX "AbekaWatchProgress_childId_isCompleted_idx" ON "AbekaWatchProgress"("childId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "ChildGradeProgress_childId_gradeId_key" ON "ChildGradeProgress"("childId", "gradeId");

-- CreateIndex
CREATE INDEX "ChildGradeProgress_childId_gradeId_idx" ON "ChildGradeProgress"("childId", "gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaStreak_childId_key" ON "AbekaStreak"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaStreakHistory_streakId_date_key" ON "AbekaStreakHistory"("streakId", "date");

-- CreateIndex
CREATE INDEX "AbekaStreakHistory_streakId_date_idx" ON "AbekaStreakHistory"("streakId", "date");

-- CreateIndex
CREATE INDEX "AbekaSkillNode_gradeId_subjectCode_idx" ON "AbekaSkillNode"("gradeId", "subjectCode");

-- CreateIndex
CREATE INDEX "AbekaSkillNode_parentId_idx" ON "AbekaSkillNode"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaSkillPrerequisite_skillId_prerequisiteId_key" ON "AbekaSkillPrerequisite"("skillId", "prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildSkillProgress_childId_skillNodeId_key" ON "ChildSkillProgress"("childId", "skillNodeId");

-- CreateIndex
CREATE INDEX "ChildSkillProgress_childId_status_idx" ON "ChildSkillProgress"("childId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaBadge_code_key" ON "AbekaBadge"("code");

-- CreateIndex
CREATE INDEX "AbekaBadge_requirementType_idx" ON "AbekaBadge"("requirementType");

-- CreateIndex
CREATE UNIQUE INDEX "ChildEarnedBadge_childId_badgeId_key" ON "ChildEarnedBadge"("childId", "badgeId");

-- CreateIndex
CREATE INDEX "ChildEarnedBadge_childId_earnedAt_idx" ON "ChildEarnedBadge"("childId", "earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AbekaParentPreferences_parentId_key" ON "AbekaParentPreferences"("parentId");

-- AddForeignKey
ALTER TABLE "AbekaVideo" ADD CONSTRAINT "AbekaVideo_lessonPackageId_fkey" FOREIGN KEY ("lessonPackageId") REFERENCES "AbekaLessonPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaSubject" ADD CONSTRAINT "AbekaSubject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "AbekaGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaLesson" ADD CONSTRAINT "AbekaLesson_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "AbekaGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaLessonPackage" ADD CONSTRAINT "AbekaLessonPackage_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "AbekaLesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaLearningJourney" ADD CONSTRAINT "AbekaLearningJourney_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaLearningJourney" ADD CONSTRAINT "AbekaLearningJourney_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "AbekaGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaWeeklyPlan" ADD CONSTRAINT "AbekaWeeklyPlan_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "AbekaLearningJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaDailyPlan" ADD CONSTRAINT "AbekaDailyPlan_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "AbekaWeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaAssignment" ADD CONSTRAINT "AbekaAssignment_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "AbekaDailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaAssignment" ADD CONSTRAINT "AbekaAssignment_lessonPackageId_fkey" FOREIGN KEY ("lessonPackageId") REFERENCES "AbekaLessonPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaWatchProgress" ADD CONSTRAINT "AbekaWatchProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaWatchProgress" ADD CONSTRAINT "AbekaWatchProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "AbekaVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildGradeProgress" ADD CONSTRAINT "ChildGradeProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildGradeProgress" ADD CONSTRAINT "ChildGradeProgress_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "AbekaGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaStreak" ADD CONSTRAINT "AbekaStreak_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaStreakHistory" ADD CONSTRAINT "AbekaStreakHistory_streakId_fkey" FOREIGN KEY ("streakId") REFERENCES "AbekaStreak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaSkillNode" ADD CONSTRAINT "AbekaSkillNode_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "AbekaGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaSkillNode" ADD CONSTRAINT "AbekaSkillNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AbekaSkillNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaSkillPrerequisite" ADD CONSTRAINT "AbekaSkillPrerequisite_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "AbekaSkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSkillProgress" ADD CONSTRAINT "ChildSkillProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSkillProgress" ADD CONSTRAINT "ChildSkillProgress_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "AbekaSkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildEarnedBadge" ADD CONSTRAINT "ChildEarnedBadge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildEarnedBadge" ADD CONSTRAINT "ChildEarnedBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "AbekaBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbekaParentPreferences" ADD CONSTRAINT "AbekaParentPreferences_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
