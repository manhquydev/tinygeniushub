# Phase 06: Observability and Postmortem

## Context Links
- `docs/review/REVIEW-SUMMARY-MASTER.md`
- `docs/review/plan-implementation-gap-analysis.md`

## Overview
- Priority: High
- Status: Pending
- Goal: Prevent recurrence via monitoring, runbooks, and process fixes.

## Key Insights
- Incident source was not one bug; it was missing cross-layer gates.
- Need both technical telemetry and process discipline.

## Requirements
- Worker restart alerts.
- Data drift alert checks.
- Route regression checks in CI/deploy.
- Postmortem with action owners and deadlines.

## Architecture
- Observability stack + deploy hooks + quality policy in docs.

## Related Code Files
- Modify: health/monitor scripts
- Modify: CI/deploy checks
- Modify: documentation in `docs/` for final runbook

## Implementation Steps
1. Add alerting thresholds for PM2 restart storms.
2. Add scheduled drift checks for package parity.
3. Add route smoke checks in deployment pipeline.
4. Write postmortem: timeline, root cause, corrective actions.

## Todo List
- [ ] Alerts configured and tested
- [ ] Drift check cron active
- [ ] CI gate updated
- [ ] Postmortem published

## Success Criteria
- Similar drift would be detected before user-facing impact.

## Risk Assessment
- Risk: alert fatigue.
- Mitigation: calibrated thresholds and actionable alerts only.

## Security Considerations
- Monitoring output excludes sensitive payload fields.

## Next Steps
- Close incident after 7-day stability window and final sign-off.
