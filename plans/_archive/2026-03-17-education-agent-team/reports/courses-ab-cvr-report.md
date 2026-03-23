# Courses A/B CVR Report

Generated at: 2026-03-18T11:18:50.025Z
Window: last 30 days (since 2026-02-16T11:18:49.978Z)

## Summary
- Checkout started: 8
- Purchase succeeded: 6
- Checkout -> Purchase: 75%

## Per Variant
| Variant | Checkout started | Purchase succeeded | Checkout->Purchase |
|---|---:|---:|---:|
| unknown | 8 | 6 | 75% |

## Per Variant x Target
| Variant | Target kind | Target slug | Checkout started | Purchase succeeded | Checkout->Purchase |
|---|---|---|---:|---:|---:|
| unknown | course | little-fox-cn-level-1 | 8 | 6 | 75% |

## Notes
- Source: audit logs (`course_checkout_started`, `course_purchase_succeeded`).
- Variant key: `ab_courses_v` captured as `attributionExperimentCoursesVariant`.
- CVR uses unique `sessionId` per event type.

