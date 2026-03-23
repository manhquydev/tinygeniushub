-- CreateTable
CREATE TABLE "public"."BlogPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostLike_postId_identityHash_key" ON "public"."BlogPostLike"("postId", "identityHash");

-- CreateIndex
CREATE INDEX "BlogPostLike_postId_createdAt_idx" ON "public"."BlogPostLike"("postId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "public"."BlogPostLike"
ADD CONSTRAINT "BlogPostLike_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
