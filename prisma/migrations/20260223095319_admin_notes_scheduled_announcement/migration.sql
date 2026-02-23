-- DropIndex
DROP INDEX "public"."SystemAnnouncement_active_endsAt_idx";

-- AlterTable
ALTER TABLE "public"."SystemAnnouncement" ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."AdminNote" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNote_parentId_createdAt_idx" ON "public"."AdminNote"("parentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SystemAnnouncement_active_scheduledAt_endsAt_idx" ON "public"."SystemAnnouncement"("active", "scheduledAt", "endsAt");

-- AddForeignKey
ALTER TABLE "public"."AdminNote" ADD CONSTRAINT "AdminNote_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
