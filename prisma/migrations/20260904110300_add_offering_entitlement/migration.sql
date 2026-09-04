-- CreateEnum
CREATE TYPE "public"."OfferingKind" AS ENUM ('RECURRING', 'ONE_TIME_PROGRAM', 'ONE_TIME_LEVEL');

-- CreateEnum
CREATE TYPE "public"."EntitlementStatus" AS ENUM ('ACTIVE', 'GRACE', 'CANCELED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."Offering" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "public"."OfferingKind" NOT NULL,
    "catalogKey" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Entitlement" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "status" "public"."EntitlementStatus" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "sourcePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offering_code_key" ON "public"."Offering"("code");

-- CreateIndex
CREATE INDEX "Offering_catalogKey_active_idx" ON "public"."Offering"("catalogKey", "active");

-- CreateIndex
CREATE INDEX "Entitlement_parentId_status_idx" ON "public"."Entitlement"("parentId", "status");

-- CreateIndex
CREATE INDEX "Entitlement_offeringId_status_idx" ON "public"."Entitlement"("offeringId", "status");

-- CreateIndex
CREATE INDEX "Entitlement_sourcePaymentId_idx" ON "public"."Entitlement"("sourcePaymentId");

-- AddForeignKey
ALTER TABLE "public"."Entitlement" ADD CONSTRAINT "Entitlement_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Entitlement" ADD CONSTRAINT "Entitlement_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "public"."Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Entitlement" ADD CONSTRAINT "Entitlement_sourcePaymentId_fkey" FOREIGN KEY ("sourcePaymentId") REFERENCES "public"."PaymentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
