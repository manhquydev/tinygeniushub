## Marketing Analytics Report

### Executive Summary
- Decision: **Use internal admin page as primary dashboard visualization tool**.
- Why: current codebase already has admin auth, analytics pages, SQL audit logs, and API surface; fastest path to reliable SoT GA4 + SQL is extending existing admin module, not standing up a new BI stack.
- Secondary tooling policy:
  - Looker Studio: optional read-only marketing share views later.
  - Metabase: optional deep ad-hoc SQL exploration later.

### Performance Overview
| Metric | This Period | Last Period | Change | Target |
|--------|-------------|-------------|--------|--------|
| Delivery speed | High (existing admin infra) | N/A | N/A | Fastest |
| SoT reliability | High (single auth domain + typed API) | N/A | N/A | High |
| Operational overhead | Low | N/A | N/A | Low |

### Traffic Analysis
| Source | Sessions | Conv. Rate | Revenue |
|--------|----------|------------|---------|
| GA4 | via GA4 Data API in admin | derived in admin | N/A |
| SQL audit logs | via Prisma/Postgres | derived in admin | billing-linked via audit trail |

### Campaign Performance
| Campaign | Spend | Conversions | CPA | ROAS |
|----------|-------|-------------|-----|------|
| N/A (tool decision report) | N/A | N/A | N/A | N/A |

### Funnel Analysis
| Stage | Volume | Conv. Rate | Drop-off |
|-------|--------|------------|----------|
| `course_checkout_started` | SQL + GA4 | calculated in admin | derived |
| `course_purchase_succeeded` | SQL + GA4 | calculated in admin | derived |

### Trends & Anomalies
- Existing repo already tracks GA4 client events and persists SQL audit logs for key lifecycle actions.
- Admin analytics routes/pages exist, so extension risk is low.
- No existing first-class Metabase/Looker integration in repo, so adopting either now adds setup + governance overhead.

### Key Insights
1. Internal admin page is the only option that can unify auth, SQL, and GA4 in one controlled runtime immediately.
2. Metabase is strong for SQL but weak for GA4-native SoT without extra pipelines/plugins.
3. Looker Studio is strong for GA4 but weaker for secure low-friction SQL audit joins in this current stack.

### Recommendations
| Priority | Action | Expected Impact |
|----------|--------|-----------------|
| High | Keep `/admin/analytics` as primary SoT dashboard | Fast launch, minimal new infra |
| High | Pull GA4 summary via service-account API into admin backend | Single place for GA4 + SQL reconciliation |
| High | Keep audit-log funnel counters in SQL and display side-by-side with GA4 | Immediate data trust checks |
| High | Lock `GA4_PROPERTY_ID` to the production web stream property for `cungcontuhoc.io.vn` | Prevent cross-property drift |
| High | Use GitHub Actions Secrets as source of truth; inject runtime env at deploy + PM2 `--update-env` | No plaintext secrets in repo |
| Medium | Add optional Looker Studio link for stakeholder sharing | Lightweight exec visibility |
| Medium | Add Metabase later only if ad-hoc SQL demand rises | Avoid early complexity |

### Data Quality Notes
- GA4 and SQL will naturally differ on identity/session semantics; use side-by-side reconciliation, not forced equality.
- Current implementation exposes GA4 status (`ready|disabled|error`) so operations can detect connector drift quickly.

### Unresolved Questions
1. Stakeholder-facing cadence: weekly static export, or live admin-only access?
