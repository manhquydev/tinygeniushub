# WS3 Production Recheck - 2026-04-05

## Scope
- Recheck data quality thresholds after WS3 backfill.
- Recheck storefront free-temporary display behavior.
- Recheck production health gate.

## Execution
- Host: `do-server` (`/var/www/cungcontuhoc`)
- DB container: `root-postgres-1`
- Query source: `scripts/production/ws3-metrics.sql`
- Gate command: `bash scripts/production/production-gate-check.sh --base-url http://localhost:3000`

## Results
- `total_courses`: `18`
- `zero_price_courses`: `18`
- `published_courses`: `12`
- `published_desc_ge_80`: `12`
- `active_package_total`: `8`
- `active_package_desc_ge_60`: `8`
- `video_total`: `20195`
- `video_desc_ge_20`: `20195`

## Storefront Checks
- `/courses`: HTTP `200`, detected `Miễn phí` labels.
- `/courses/abeka-k4-intro-4w`: detected `0đ (miễn phí tạm thời)`.

## Gate Result
- `PASS=12 WARN=0 FAIL=0`

## Conclusion
- WS3 quality/content/commerce objectives are met on production.
- Backfill is complete for published course descriptions.

## Unresolved Questions
- Should the remaining unpublished `0đ` courses stay unpublished by product policy, or move to staged publish in next rollout?
