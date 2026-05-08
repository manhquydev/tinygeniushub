#!/usr/bin/env bash
set -euo pipefail
cd /var/www/tinygeniushub
rows=$(docker exec root-postgres-1 psql -U postgres -d tinygeniushub -At -F '|' -c "SELECT c.slug, l.id, cl.\"orderNo\" FROM \"Course\" c JOIN \"CourseLesson\" cl ON cl.\"courseId\"=c.id JOIN \"Lesson\" l ON l.id=cl.\"lessonId\" WHERE c.\"isPublished\"=true AND cl.\"orderNo\"<=3 ORDER BY c.slug, cl.\"orderNo\";")
echo "$rows" | while IFS='|' read -r slug lesson_id order_no; do
  code=$(curl -sS -o /tmp/preview.json -w '%{http_code}' "http://localhost:3000/api/lessons/${lesson_id}/video-token") || code="000"
  ok=$(jq -r '.ok // false' /tmp/preview.json 2>/dev/null || echo false)
  embed=$(jq -r '.data.embedUrl // empty' /tmp/preview.json 2>/dev/null || true)
  if [[ "$code" == "200" && "$ok" == "true" && -n "$embed" ]]; then
    echo "PASS|$slug|$order_no|$lesson_id"
  else
    echo "FAIL|$slug|$order_no|$lesson_id|http=$code|ok=$ok"
  fi
done
