-- CreateEnum
CREATE TYPE "public"."PackageSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."CurriculumPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "grades" TEXT[],
    "subjects" TEXT[],
    "videoCount" INTEGER NOT NULL,
    "monthlyPrice" INTEGER NOT NULL,
    "yearlyPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackageSubscription" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT,
    "packageId" TEXT NOT NULL,
    "status" "public"."PackageSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumPackage_code_key" ON "public"."CurriculumPackage"("code");

-- CreateIndex
CREATE INDEX "CurriculumPackage_isActive_displayOrder_idx" ON "public"."CurriculumPackage"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "CurriculumPackage_grades_idx" ON "public"."CurriculumPackage" USING GIN ("grades");

-- CreateIndex
CREATE INDEX "PackageSubscription_parentId_idx" ON "public"."PackageSubscription"("parentId");

-- CreateIndex
CREATE INDEX "PackageSubscription_parentId_status_idx" ON "public"."PackageSubscription"("parentId", "status");

-- CreateIndex
CREATE INDEX "PackageSubscription_packageId_idx" ON "public"."PackageSubscription"("packageId");

-- CreateIndex
CREATE INDEX "PackageSubscription_endDate_idx" ON "public"."PackageSubscription"("endDate");

-- AddForeignKey
ALTER TABLE "public"."PackageSubscription" ADD CONSTRAINT "PackageSubscription_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageSubscription" ADD CONSTRAINT "PackageSubscription_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageSubscription" ADD CONSTRAINT "PackageSubscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."CurriculumPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
