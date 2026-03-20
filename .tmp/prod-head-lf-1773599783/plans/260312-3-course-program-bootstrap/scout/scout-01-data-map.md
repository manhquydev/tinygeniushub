# Scout Report - docs/api learning sources

## Scope
- Target sources: `abeka`, `littlefox`, `littlefoxcn`
- Objective: map structure for lesson allocation bootstrap

## Findings
- `docs/api/abeka`
  - Root files: `index.json`, `all.json`, `all_raw.json`
  - Provider index: `providers/<grade>/index.json`
  - Lesson detail: `providers/<grade>/lessons/<lesson>.json`
  - Cardinality: 14 grades, 2,380 lessons, 20,195 videos
- `docs/api/littlefox`
  - Root files: `index.json`, `<lfid>.json`
  - Episode detail: `<lfid>/<episode>.json`
  - Cardinality: 9 levels, 137 series, 8,718 episodes
- `docs/api/littlefoxcn`
  - Root files: `index.json`, `<lfid>.json`
  - Episode detail: `<lfid>/<episode>.json`
  - Cardinality: 5 levels, 48 series, 1,983 episodes

## Data integrity checks
- `littlefox`: `index.episode_count` matches actual series file counts
- `littlefoxcn`: `index.episode_count` matches actual series file counts
- `abeka`: provider-level totals match `index.json`

## Notes
- `littlefox` contains tracked empty series `FS0133` with `episode_count = 0` (expected from source report).
