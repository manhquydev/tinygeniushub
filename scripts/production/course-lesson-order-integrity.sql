WITH lesson_seq AS (
  SELECT c.slug, COUNT(*) AS total_rows, COUNT(DISTINCT cl."orderNo") AS distinct_orders,
         MIN(cl."orderNo") AS min_order, MAX(cl."orderNo") AS max_order
  FROM "Course" c
  JOIN "CourseLesson" cl ON cl."courseId"=c.id
  WHERE c."isPublished"=true
  GROUP BY c.id
)
SELECT slug, total_rows, distinct_orders, min_order, max_order,
       CASE WHEN min_order=1 AND max_order=total_rows AND distinct_orders=total_rows THEN 'OK' ELSE 'ISSUE' END AS order_integrity
FROM lesson_seq
ORDER BY slug;
