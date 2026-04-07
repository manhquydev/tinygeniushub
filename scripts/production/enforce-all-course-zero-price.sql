UPDATE "Course"
SET "priceVnd" = 0,
    "listPriceVnd" = 0,
    "salePriceVnd" = 0,
    "saleStartsAt" = NULL,
    "saleEndsAt" = NULL,
    "updatedAt" = NOW()
WHERE "priceVnd" <> 0 OR COALESCE("listPriceVnd", 0) <> 0 OR COALESCE("salePriceVnd", 0) <> 0 OR "saleStartsAt" IS NOT NULL OR "saleEndsAt" IS NOT NULL;

SELECT COUNT(*) AS total_courses,
       SUM(CASE WHEN "salePriceVnd" = 0 THEN 1 ELSE 0 END) AS zero_sale,
       SUM(CASE WHEN "priceVnd" = 0 THEN 1 ELSE 0 END) AS zero_price,
       SUM(CASE WHEN COALESCE("listPriceVnd",0) = 0 THEN 1 ELSE 0 END) AS zero_list
FROM "Course";
