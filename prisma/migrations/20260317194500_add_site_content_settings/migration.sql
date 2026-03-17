-- CreateTable
CREATE TABLE "public"."SiteContentSettings" (
    "id" TEXT NOT NULL,
    "footerSocialLinks" JSONB NOT NULL,
    "updatedByActorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContentSettings_pkey" PRIMARY KEY ("id")
);
