# Research Report - Little Fox CN allocation

## Key metrics
- Levels: `5`
- Series: `48`
- Episodes: `1,983`
- Series status: all `ok`

## Distribution by level (episodes)
- L1: `459`
- L2: `504`
- L3: `362`
- L4: `321`
- L5: `337`

## Observations
- L1-L2 already account for almost half of total episodes.
- Content volume is smaller than Little Fox EN, suitable for faster rollout.

## Allocation strategy
- Use `level -> series -> episode blocks`.
- Weekly pacing:
  - L1-L2: `5 episodes/week`
  - L3-L5: `4 episodes/week`
- Keep identical output schema with Little Fox EN for easier backend reuse.

## Output shape
- Same schema as `littlefox` in bootstrap JSON:
  - level totals
  - series allocations
  - episode blocks
  - mismatch list (expected zero)
