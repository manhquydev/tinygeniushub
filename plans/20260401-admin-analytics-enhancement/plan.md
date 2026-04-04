# Admin Analytics Enhancement Plan

**Date:** 2026-04-01  
**Goal:** Hoàn thiện hệ thống Analytics để nắm data mọi mặt - comprehensive, real-time, actionable

## Current State Analysis

**Existing Analytics:**
- ✅ GA4 Reporting (external)
- ✅ SoT Dashboard (audit logs)
- ✅ Learning Analytics (streaks, completions)
- ✅ Retention Analytics (churn, retention rate)
- ✅ Overview Stats (counts, payments, referrals)
- ✅ Microsoft Clarity (deployed, but not in admin dashboard)

**Gaps Identified:**
- ❌ Clarity integration in admin dashboard
- ❌ Real-time analytics (live users, active sessions)
- ❌ Cohort analysis (user lifecycle)
- ❌ Funnel analytics (conversion rates)
- ❌ Content performance metrics
- ❌ Revenue analytics (MRR/ARR, churn revenue)
- ❌ User segmentation (plan types, activity levels)
- ❌ Time-series trends (charts over time)
- ❌ A/B test analytics integration
- ❌ Alert/notification system for anomalies

## Architecture

```
Admin Analytics System
├── Data Collection Layer
│   ├── Audit Logs (existing)
│   ├── GA4 API (existing)
│   ├── Clarity API (new)
│   ├── Real-time Events (Redis + WebSocket)
│   └── Database Aggregations (Prisma)
├── Processing Layer
│   ├── Time-series Aggregation (new)
│   ├── Cohort Analysis Engine (new)
│   ├── Funnel Calculator (new)
│   └── Anomaly Detection (new)
├── API Layer
│   ├── GET /api/admin/analytics/overview (enhanced)
│   ├── GET /api/admin/analytics/realtime (new)
│   ├── GET /api/admin/analytics/cohorts (new)
│   ├── GET /api/admin/analytics/funnels (new)
│   ├── GET /api/admin/analytics/clarity (new)
│   ├── GET /api/admin/analytics/revenue (new)
│   └── GET /api/admin/analytics/content (new)
└── Dashboard Layer
    ├── Overview Page (enhanced)
    ├── Real-time Dashboard (new)
    ├── Cohort Analysis (new)
    ├── Funnel Analytics (new)
    ├── Revenue Metrics (new)
    ├── Content Performance (new)
    └── Settings/Alerts (new)
```

## Phase Breakdown

### Phase 1: Real-time Analytics Foundation
**Independent:** Yes  
**Tasks:**
- Create Redis pub/sub for real-time events
- WebSocket server for admin dashboard
- Real-time counters (active users, sessions)
- API endpoint: GET /api/admin/analytics/realtime

### Phase 2: Clarity Admin Integration
**Independent:** Yes  
**Tasks:**
- Create Clarity dashboard component
- API wrapper for Clarity data export
- Heatmap iframe integration
- Session recording browser
- Add to admin navigation

### Phase 3: Cohort Analysis Engine
**Independent:** Yes  
**Tasks:**
- Cohort calculation service
- Retention by signup date
- User lifecycle metrics
- API endpoint: GET /api/admin/analytics/cohorts
- Cohort visualization component

### Phase 4: Funnel Analytics
**Independent:** Yes  
**Tasks:**
- Funnel definition service
- Checkout → Purchase funnel
- Trial → Paid conversion
- API endpoint: GET /api/admin/analytics/funnels
- Funnel chart component

### Phase 5: Revenue Analytics
**Independent:** Yes  
**Tasks:**
- MRR/ARR calculation service
- Revenue by plan type
- Churn revenue impact
- API endpoint: GET /api/admin/analytics/revenue
- Revenue dashboard component

### Phase 6: Content Performance
**Independent:** Yes  
**Tasks:**
- Lesson engagement metrics
- Video watch time analytics
- Completion rates by content
- API endpoint: GET /api/admin/analytics/content
- Content performance table

### Phase 7: Enhanced Overview Dashboard
**Depends:** Phases 1-6  
**Tasks:**
- Merge all analytics into unified dashboard
- Time-series charts (Recharts)
- User segmentation filters
- Export to CSV/Excel
- Date range picker

### Phase 8: Alert System
**Depends:** Phase 7  
**Tasks:**
- Anomaly detection rules
- Alert configuration UI
- Email/notification dispatch
- Alert history log

## Execution Strategy

**Parallel Phases 1-6:** All independent, can run simultaneously  
**Sequential:** Phase 7 → after 1-6 complete, Phase 8 → after 7 complete

## Data Sources

1. **Prisma Database:** User data, subscriptions, completions
2. **Audit Logs:** User actions, events
3. **GA4 API:** Web traffic, sessions
4. **Clarity API:** Heatmaps, recordings, user behavior
5. **Redis:** Real-time counters, pub/sub events

## Acceptance Criteria

- [ ] Real-time active user count displays correctly
- [ ] Clarity heatmaps accessible from admin dashboard
- [ ] Cohort retention tables show accurate data
- [ ] Funnel conversion rates calculate correctly
- [ ] MRR/ARR metrics match Stripe dashboard
- [ ] Content performance rankings accurate
- [ ] All charts interactive with date filtering
- [ ] Export functionality works (CSV)
- [ ] Alert system triggers on anomalies
- [ ] Page load time < 3 seconds

## Technical Stack

- **Frontend:** React + Recharts for charts
- **Backend:** Next.js API routes
- **Real-time:** Redis + Socket.io or Server-Sent Events
- **Charts:** Recharts or Chart.js
- **Export:** CSV generation with papaparse

## File Ownership Matrix

| Phase | Owner | Key Files |
|-------|-------|-----------|
| 1 | dev-1 | Real-time service, WebSocket, API |
| 2 | dev-2 | Clarity integration, components |
| 3 | dev-3 | Cohort service, calculations |
| 4 | dev-4 | Funnel service, definitions |
| 5 | dev-5 | Revenue service, MRR calc |
| 6 | dev-6 | Content analytics, engagement |
| 7 | dev-1 | Dashboard integration, charts |
| 8 | dev-2 | Alert system, notifications |

## Unresolved Questions

1. Should we use WebSocket or Server-Sent Events for real-time?
2. Data retention policy for time-series data?
3. Alert threshold configuration approach?
