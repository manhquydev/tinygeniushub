# Research Report - Abeka allocation

## Key metrics
- Grades: `14` (`k4`, `k5`, `g1`..`g12`)
- Lessons per grade: `170` (fixed)
- Total lessons: `2,380`
- Total videos: `20,195`

## Observations
- Load profile by grade is uneven:
  - High density: `g1` (~15.88 videos/lesson), `g2` (~12.14), `k5` (~10.06), `k4` (~9.38)
  - Medium: `g3`..`g6` (~8.18-9.20)
  - Light: `g7`..`g10` (~5.13-6.24)
- Lesson count is stable, so schedule can be standardized by lesson units.

## Allocation strategy
- Unit granularity: lesson-based scheduling (not video-based) because all grades have 170 lessons.
- Weekly pacing:
  - `k4`, `k5`: `4 lessons/week`
  - `g1`..`g12`: `5 lessons/week`
- Three learning phases per grade:
  - `foundation`: first 30%
  - `core`: next 50%
  - `mastery`: last 20%

## Output shape
- For each grade:
  - weekly blocks with lesson range + summed video load
  - phase ranges
  - estimated completion weeks
