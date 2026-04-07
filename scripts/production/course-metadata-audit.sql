SELECT c.slug, c.title, LENGTH(COALESCE(c.description,'')) AS desc_len, COUNT(cl.id) AS lesson_count,
MIN(cl."orderNo") AS min_order, MAX(cl."orderNo") AS max_order
FROM "Course" c
LEFT JOIN "CourseLesson" cl ON cl."courseId" = c.id
WHERE c."isPublished" = true
GROUP BY c.id
ORDER BY c.slug;
