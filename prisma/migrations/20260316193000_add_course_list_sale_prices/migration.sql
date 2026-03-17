ALTER TABLE "public"."Course"
ADD COLUMN "listPriceVnd" INTEGER,
ADD COLUMN "salePriceVnd" INTEGER;

UPDATE "public"."Course"
SET
  "listPriceVnd" = "priceVnd",
  "salePriceVnd" = "priceVnd"
WHERE
  "listPriceVnd" IS NULL
  OR "salePriceVnd" IS NULL;