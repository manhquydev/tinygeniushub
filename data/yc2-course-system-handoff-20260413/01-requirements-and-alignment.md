# Requirements vs Current Alignment

Nguon scope bat buoc:
- Su dung 4 sources: `abeka`, `littlefox`, `playtt`, `playgg`
- Loai tru: `phim`
- Chia khoa hoc theo 2 huong:
  1) source-native (giu cau truc native cua tung nguon, dac biet PlayTT sub-course/provider)
  2) topic-mixed (tron nguon theo chu de)

## Checklist

1. DB schema + course_mode tachdong 2 pipeline: PASS
- Evidence: `databases/topic-courses-yc2.db`, `databases/schema.sql`

2. Auto-tagging 4 sources, exclude phim: PASS
- Evidence: `scripts/auto-tagger.py`, `03-current-metrics.json` (`phim_items=0`)

3. Topic hierarchy + topic-mixed generation: PASS
- Evidence: `reports/yc2-topic-course-report.md`

4. Source-native generation (PlayTT split by provider/sub-course): PASS
- Evidence: `reports/yc2-source-native-report.md`

5. LittleFox FS -> level 1..9 fixed rule table: PASS
- Evidence: `scripts/littlefox-fs-level-map.json`, `scripts/source_native_rules.py`

6. Abeka Unknown grade -> K4/K5/G1..G6: PASS
- Evidence: `03-current-metrics.json` (`source_native_abeka_unknown=0`)

7. Strict mode reject bucket rac (khong don Misc): PASS
- Evidence: `scripts/generate-source-native-courses.py` (`--strict-mode`), `03-current-metrics.json` (`source_native_misc_courses=0`)

8. Deliver reports tong hop: PASS
- Evidence: `reports/yc2-dual-pipeline-summary.md`, `reports/yc2-dual-pipeline-summary.json`

## Current result snapshot

- courses_total: 61
- courses_by_mode:
  - topic-mixed: 15
  - source-native: 46
- course_items_total: 36,244
- tagging coverage >=0.7 (4 sources): 100%

Unresolved questions:
- none
