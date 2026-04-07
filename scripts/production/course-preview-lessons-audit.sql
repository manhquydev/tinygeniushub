SELECT c.slug, cl."orderNo", l.title AS lesson_title, l."videoStatus", (l."videoSource" IS NOT NULL) AS has_video_source, (l."bunnyVideoId" IS NOT NULL) AS has_bunny
FROM "Course" c
JOIN "CourseLesson" cl ON cl."courseId" = c.id
JOIN "Lesson" l ON l.id = cl."lessonId"
WHERE c."isPublished" = true
  AND cl."orderNo" <= 3
ORDER BY c.slug, cl."orderNo";
