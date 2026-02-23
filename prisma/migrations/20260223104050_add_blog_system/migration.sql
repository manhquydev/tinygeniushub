-- CreateEnum
CREATE TYPE "public"."BlogPostStatus" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."BlogPostType" AS ENUM ('ARTICLE', 'TIP', 'NEWS', 'GUIDE', 'RESEARCH', 'STORY');

-- CreateEnum
CREATE TYPE "public"."AgeGroup" AS ENUM ('UNDER_3', 'AGE_3_5', 'AGE_6_8', 'AGE_9_12', 'ALL_AGES');

-- CreateTable
CREATE TABLE "public"."BlogCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "emoji" TEXT,
    "color" TEXT,
    "parentId" TEXT,
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogAuthor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Bien tap vien',
    "bio" TEXT,
    "avatarUrl" TEXT,
    "linkedinUrl" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "public"."BlogPostType" NOT NULL DEFAULT 'ARTICLE',
    "status" "public"."BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "titleVi" TEXT NOT NULL,
    "titleEn" TEXT,
    "excerptVi" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "contentHtml" TEXT,
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT,
    "coverImageCredit" TEXT,
    "categoryId" TEXT NOT NULL,
    "ageGroup" "public"."AgeGroup" NOT NULL DEFAULT 'ALL_AGES',
    "metaTitleVi" TEXT,
    "metaDescVi" TEXT,
    "canonicalUrl" TEXT,
    "ogImageUrl" TEXT,
    "structuredData" JSONB,
    "authorId" TEXT NOT NULL,
    "coAuthorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewedBy" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "readingTimeMin" INTEGER NOT NULL DEFAULT 3,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "featuredUntil" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isIndexed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogPostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "public"."BlogPostRelation" (
    "sourcePostId" TEXT NOT NULL,
    "relatedPostId" TEXT NOT NULL,

    CONSTRAINT "BlogPostRelation_pkey" PRIMARY KEY ("sourcePostId","relatedPostId")
);

-- CreateTable
CREATE TABLE "public"."BlogNewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nameVi" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "parentId" TEXT,
    "ageGroups" "public"."AgeGroup"[] DEFAULT ARRAY['ALL_AGES']::"public"."AgeGroup"[],
    "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "unsubToken" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "lastEmailAt" TIMESTAMP(3),

    CONSTRAINT "BlogNewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogReadHistory" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sessionId" TEXT,
    "parentId" TEXT,
    "ipHash" TEXT,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeOnPage" INTEGER,

    CONSTRAINT "BlogReadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "public"."BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "BlogCategory_parentId_idx" ON "public"."BlogCategory"("parentId");

-- CreateIndex
CREATE INDEX "BlogCategory_active_orderNo_idx" ON "public"."BlogCategory"("active", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "public"."BlogTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogAuthor_slug_key" ON "public"."BlogAuthor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogAuthor_email_key" ON "public"."BlogAuthor"("email");

-- CreateIndex
CREATE INDEX "BlogAuthor_active_idx" ON "public"."BlogAuthor"("active");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "public"."BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "public"."BlogPost"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_status_publishedAt_idx" ON "public"."BlogPost"("categoryId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_isFeatured_featuredUntil_idx" ON "public"."BlogPost"("isFeatured", "featuredUntil");

-- CreateIndex
CREATE INDEX "BlogPost_ageGroup_status_idx" ON "public"."BlogPost"("ageGroup", "status");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "public"."BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogNewsletterSubscriber_email_key" ON "public"."BlogNewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BlogNewsletterSubscriber_verifyToken_key" ON "public"."BlogNewsletterSubscriber"("verifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "BlogNewsletterSubscriber_unsubToken_key" ON "public"."BlogNewsletterSubscriber"("unsubToken");

-- CreateIndex
CREATE INDEX "BlogNewsletterSubscriber_verified_unsubscribedAt_idx" ON "public"."BlogNewsletterSubscriber"("verified", "unsubscribedAt");

-- CreateIndex
CREATE INDEX "BlogNewsletterSubscriber_lastEmailAt_idx" ON "public"."BlogNewsletterSubscriber"("lastEmailAt");

-- CreateIndex
CREATE INDEX "BlogReadHistory_postId_readAt_idx" ON "public"."BlogReadHistory"("postId", "readAt");

-- CreateIndex
CREATE INDEX "BlogReadHistory_parentId_readAt_idx" ON "public"."BlogReadHistory"("parentId", "readAt");

-- AddForeignKey
ALTER TABLE "public"."BlogCategory" ADD CONSTRAINT "BlogCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."BlogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."BlogAuthor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogPostRelation" ADD CONSTRAINT "BlogPostRelation_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogPostRelation" ADD CONSTRAINT "BlogPostRelation_relatedPostId_fkey" FOREIGN KEY ("relatedPostId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
