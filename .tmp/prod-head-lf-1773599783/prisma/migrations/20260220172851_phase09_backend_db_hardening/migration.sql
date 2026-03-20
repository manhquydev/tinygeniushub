-- CreateIndex
CREATE INDEX "WeeklyReport_emailStatus_deliveredEmailAt_generatedAt_idx" ON "public"."WeeklyReport"("emailStatus", "deliveredEmailAt", "generatedAt");
