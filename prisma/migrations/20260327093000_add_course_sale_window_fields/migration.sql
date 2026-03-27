ALTER TABLE "Course"
ADD COLUMN "saleStartsAt" TIMESTAMP(3),
ADD COLUMN "saleEndsAt" TIMESTAMP(3);

CREATE INDEX "Course_isPublished_saleStartsAt_saleEndsAt_idx"
ON "Course" ("isPublished", "saleStartsAt", "saleEndsAt");
