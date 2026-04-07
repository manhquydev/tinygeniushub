SELECT 'total_courses' AS metric, COUNT(*)::text AS value FROM "Course"
UNION ALL
SELECT 'zero_price_courses', COUNT(*)::text FROM "Course" WHERE "salePriceVnd"=0
UNION ALL
SELECT 'published_courses', COUNT(*)::text FROM "Course" WHERE "isPublished"=true
UNION ALL
SELECT 'published_desc_ge_80', COUNT(*)::text FROM "Course" WHERE "isPublished"=true AND LENGTH(COALESCE(description,''))>=80
UNION ALL
SELECT 'active_package_total', COUNT(*)::text FROM "CurriculumPackage" WHERE "isActive"=true
UNION ALL
SELECT 'active_package_desc_ge_60', COUNT(*)::text FROM "CurriculumPackage" WHERE "isActive"=true AND LENGTH(COALESCE(description,''))>=60
UNION ALL
SELECT 'video_total', COUNT(*)::text FROM "AbekaVideo"
UNION ALL
SELECT 'video_desc_ge_20', COUNT(*)::text FROM "AbekaVideo" WHERE LENGTH(COALESCE(description,''))>=20
ORDER BY metric;
