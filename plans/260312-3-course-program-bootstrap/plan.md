# Plan - Bootstrap 3-course learning program (abeka, littlefox, littlefoxcn)

## Objective
Create a machine-readable lesson allocation package from `docs/api` so product and backend can initialize the first 3 external-source programs quickly.

## Agent team split
- Agent A (`scout`): map source schemas and integrity checks.
- Agent B (`research`): analyze and allocate `abeka`.
- Agent C (`research`): analyze and allocate `littlefox` + `littlefoxcn`.
- Coordinator (`planning`): unify schema, rollout phases, and outputs.

## Deliverables
1. Allocation JSON:
   - `docs/api/program-bootstrap/three-courses-program.json`
2. Human summary:
   - `docs/api/program-bootstrap/three-courses-program-summary.md`
3. Supporting reports:
   - `scout/scout-01-data-map.md`
   - `research/research-01-abeka.md`
   - `research/research-02-littlefox.md`
   - `research/research-03-littlefoxcn.md`

## Implementation decisions
- Use source-native structures:
  - `abeka`: `grade -> lesson`
  - `littlefox*`: `level -> series -> episode`
- Keep allocation deterministic and reproducible via script:
  - `scripts/bootstrap-three-courses-program.mjs`
- Prefer weekly blocks for practical scheduling and progress tracking.

## Rollout phases
1. Pilot:
   - `abeka`: `k4`, `k5`, `g1`
   - `littlefox`: levels `1-2`
   - `littlefoxcn`: levels `1-2`
2. Scale:
   - `abeka`: `g2-g6`
   - `littlefox`: levels `3-6`
   - `littlefoxcn`: levels `3-4`
3. Full:
   - `abeka`: `g7-g12`
   - `littlefox`: levels `7-9`
   - `littlefoxcn`: level `5`

## Assumptions
- `abeka` schedule:
  - kindergarten (`k4/k5`): 4 lessons/week
  - others: 5 lessons/week
- `littlefox` schedule:
  - L1-L2: 5 episodes/week
  - L3-L5: 4 episodes/week
  - L6+: 3 episodes/week
- `littlefoxcn` schedule:
  - L1-L2: 5 episodes/week
  - L3-L5: 4 episodes/week

## Next implementation step
Map this bootstrap JSON into Prisma seed/upsert pipeline (`Course`, `Lesson`, `CourseLesson`) when business rules for course pricing/publishing are finalized.
