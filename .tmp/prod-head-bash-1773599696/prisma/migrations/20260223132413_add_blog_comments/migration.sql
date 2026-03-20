-- CreateEnum
CREATE TYPE "public"."BlogCommentStatus" AS ENUM ('PENDING', 'APPROVED', 'SPAM', 'DELETED');

-- CreateTable
CREATE TABLE "public"."BlogComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."BlogCommentStatus" NOT NULL DEFAULT 'PENDING',
    "verifyToken" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogComment_verifyToken_key" ON "public"."BlogComment"("verifyToken");

-- CreateIndex
CREATE INDEX "BlogComment_postId_status_createdAt_idx" ON "public"."BlogComment"("postId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BlogComment_parentId_idx" ON "public"."BlogComment"("parentId");

-- CreateIndex
CREATE INDEX "BlogComment_authorEmail_createdAt_idx" ON "public"."BlogComment"("authorEmail", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."BlogComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
