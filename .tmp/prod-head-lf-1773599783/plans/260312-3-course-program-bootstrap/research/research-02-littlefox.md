# Research Report - Little Fox EN allocation

## Key metrics
- Levels: `9`
- Series: `137`
- Episodes: `8,718`
- Series status: all `ok`

## Distribution by level (episodes)
- L1: `790`
- L2: `1,238`
- L3: `1,216`
- L4: `1,179`
- L5: `1,011`
- L6: `1,226`
- L7: `855`
- L8: `753`
- L9: `450`

## Observations
- Workload is concentrated in L2-L6.
- Series lengths vary strongly (some >200 episodes), so fixed "series = one unit" is too coarse.

## Allocation strategy
- Use `level -> series -> episode blocks`.
- Weekly pacing by level:
  - L1-L2: `5 episodes/week`
  - L3-L5: `4 episodes/week`
  - L6-L9: `3 episodes/week`
- Build episode blocks for every series to support incremental assignment and progress sync.

## Output shape
- For each level:
  - level totals and phase ranges
  - list of series with:
    - `episodeCount`
    - `recommendedEpisodesPerWeek`
    - `estimatedWeeks`
    - `episodeBlocks[]`
