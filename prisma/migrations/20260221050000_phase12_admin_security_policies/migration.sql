-- CreateTable
CREATE TABLE "public"."AdminSecuritySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "rateLimitPolicies" JSONB NOT NULL,
    "updatedByActorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSecuritySettings_pkey" PRIMARY KEY ("id")
);
