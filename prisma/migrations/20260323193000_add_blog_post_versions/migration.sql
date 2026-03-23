-- CreateTable
CREATE TABLE "BlogPostVersion" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "excerptVi" TEXT NOT NULL,
    "metaTitleVi" TEXT,
    "metaDescVi" TEXT,
    "coverImageUrl" TEXT,
    "status" "BlogPostStatus" NOT NULL,
    "savedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogPostVersion_postId_createdAt_idx" ON "BlogPostVersion"("postId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "BlogPostVersion" ADD CONSTRAINT "BlogPostVersion_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;