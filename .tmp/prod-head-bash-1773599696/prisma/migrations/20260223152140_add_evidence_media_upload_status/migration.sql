-- AlterTable
ALTER TABLE "public"."EvidenceMedia" ADD COLUMN     "uploadStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "uploadedAt" TIMESTAMP(3);
