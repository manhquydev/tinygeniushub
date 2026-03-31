# Microsoft Clarity Integration Plan

**Project ID:** w49qfrxwu5  
**Data Export Token Name:** cungcontuhoc  
**Created:** 2026-03-31

## Executive Summary

Integrate Microsoft Clarity user behavior analytics into the Cung Con Tu Hoc Next.js application with consent-aware loading, matching existing GA4/Meta Pixel patterns.

## Requirements

1. **Frontend Tracking:** Load Clarity tracking script when user consents to analytics
2. **Consent Integration:** Hook into existing cookie consent system
3. **Environment Config:** Add `NEXT_PUBLIC_CLARITY_PROJECT_ID` env variable
4. **Type Safety:** Full TypeScript support for Clarity API
5. **Data Export API:** Optional server-side integration for exporting raw data

## Architecture

```
src/
├── lib/
│   ├── analytics/
│   │   ├── track-event.ts          (existing - GA4/Meta)
│   │   └── clarity/
│   │       ├── index.ts              (main exports)
│   │       ├── types.ts              (Clarity type definitions)
│   │       ├── loader.ts             (consent-aware script loading)
│   │       └── api-client.ts         (data export API client)
│   └── legal/
│       └── cookie-consent.ts         (existing - add clarity check)
├── components/
│   └── legal/
│       ├── analytics-by-consent.tsx  (update to include Clarity)
│       └── cookie-consent-banner.tsx (existing)
└── app/
    └── api/
        └── clarity/
            └── export/               (data export API routes)
                └── route.ts
```

## Phase Breakdown

### Phase 1: Core Types & Loader (Independent)
- Create `src/lib/analytics/clarity/types.ts` with Clarity API types
- Create `src/lib/analytics/clarity/loader.ts` with script loading logic
- Export from `src/lib/analytics/clarity/index.ts`

### Phase 2: Consent Integration (Independent)
- Update `src/lib/legal/cookie-consent.ts` - add `hasClarityConsent()`
- Update `src/components/legal/analytics-by-consent.tsx` - add Clarity loading
- Update `src/app/layout.tsx` - pass Clarity project ID

### Phase 3: Environment Configuration (Independent)
- Update `.env.example` - add `NEXT_PUBLIC_CLARITY_PROJECT_ID`
- Create `src/lib/analytics/clarity/config.ts` - env variable handling

### Phase 4: Data Export API (Optional)
- Create `src/lib/analytics/clarity/api-client.ts` - JWT auth client
- Create `src/app/api/clarity/export/route.ts` - API route wrapper
- Add server-side token management

### Phase 5: Testing & Validation
- Unit tests for loader and consent logic
- E2E test for script loading
- Verify data appears in Clarity dashboard

## Execution Strategy

**Parallel Execution:** Phases 1, 2, 3 can run simultaneously (no dependencies)  
**Sequential Execution:** Phase 4 depends on Phase 1, Phase 5 depends on all previous

## File Ownership Matrix

| File | Owner | Phase |
|------|-------|-------|
| `src/lib/analytics/clarity/types.ts` | dev-1 | 1 |
| `src/lib/analytics/clarity/loader.ts` | dev-1 | 1 |
| `src/lib/analytics/clarity/index.ts` | dev-1 | 1 |
| `src/lib/legal/cookie-consent.ts` | dev-2 | 2 |
| `src/components/legal/analytics-by-consent.tsx` | dev-2 | 2 |
| `src/app/layout.tsx` | dev-2 | 2 |
| `.env.example` | dev-3 | 3 |
| `src/lib/analytics/clarity/config.ts` | dev-3 | 3 |
| `src/lib/analytics/clarity/api-client.ts` | dev-1 | 4 |
| `src/app/api/clarity/export/route.ts` | dev-1 | 4 |
| Tests | tester | 5 |

## Acceptance Criteria

- [ ] Clarity script loads only after analytics consent granted
- [ ] Script does not load if consent declined
- [ ] User sessions appear in Clarity dashboard within 5 minutes
- [ ] Heatmaps and recordings functional
- [ ] TypeScript compiles without errors
- [ ] No console errors from Clarity integration
- [ ] (Optional) Data export API returns valid JSON

## Risk Mitigation

1. **Script Loading Failure:** Implement retry logic with exponential backoff
2. **Consent Race Condition:** Ensure cookie is read before script injection
3. **Type Conflicts:** Use module augmentation for window.clarity
4. **Performance:** Lazy load Clarity only after user interaction or idle

## Clarity Project Info

```
Project ID: w49qfrxwu5
Token Name: cungcontuhoc
Token Type: Data Export JWT
```

## Dependencies

- `@microsoft/clarity` (optional NPM package, or manual script injection)
- Existing: cookie-consent system, AnalyticsByConsent component

## Notes

- Follow existing GA4/Meta patterns in `analytics-by-consent.tsx`
- Clarity is "analytics" category, requires `hasAnalyticsConsent()`
- Script URL: `https://www.clarity.ms/tag/{PROJECT_ID}`
- Data Export API: `https:// clarity.microsoft.com/api/export` with Bearer token
