WITH base AS (
  SELECT slug, title,
    CASE
      WHEN slug ~ '^abeka-(k4|k5|g\d+)-' THEN upper(substring(slug from '^abeka-(k4|k5|g\d+)-'))
      WHEN slug ~ '^lfen-l(\d+)-' THEN concat('L', substring(slug from '^lfen-l(\d+)-'))
      WHEN slug ~ '^lfcn-l(\d+)-' THEN concat('L', substring(slug from '^lfcn-l(\d+)-'))
      ELSE NULL
    END AS expected_level,
    CASE
      WHEN slug LIKE '%-intro-%' OR slug LIKE '%-starter-%' THEN 'starter'
      WHEN slug LIKE '%-foundation-%' OR slug LIKE '%-builder-%' THEN 'builder'
      ELSE NULL
    END AS expected_phase
  FROM "Course"
  WHERE "isPublished" = true
)
SELECT slug, title, expected_level, expected_phase,
       (expected_level IS NULL OR title ILIKE '%' || expected_level || '%') AS level_ok,
       (expected_phase IS NULL OR (
          (expected_phase = 'starter' AND (title ILIKE '%khởi động%' OR title ILIKE '%starter%' OR title ILIKE '%intro%')) OR
          (expected_phase = 'builder' AND (title ILIKE '%xây nền%' OR title ILIKE '%nền tảng%' OR title ILIKE '%builder%' OR title ILIKE '%foundation%'))
       )) AS phase_ok
FROM base
ORDER BY slug;
