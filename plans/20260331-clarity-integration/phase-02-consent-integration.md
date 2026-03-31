# Phase 2: Consent Integration

**Status:** Ready  
**Owner:** dev-2  
**Dependencies:** None  
**Estimated Effort:** 2 hours

## Tasks

### 2.1 Update Cookie Consent Module
**File:** `src/lib/legal/cookie-consent.ts`

Add Clarity consent check function:

```typescript
// Add to existing file, after hasAnalyticsConsent()

/**
 * Check if Clarity tracking is allowed.
 * Clarity is an analytics tool, so it follows analytics consent.
 */
export function hasClarityConsent(rawConsent: string | null): boolean {
  return hasAnalyticsConsent(rawConsent);
}
```

### 2.2 Update AnalyticsByConsent Component
**File:** `src/components/legal/analytics-by-consent.tsx`

Add Clarity loading alongside GA4 and Meta Pixel:

```typescript
import { useEffect } from "react";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  hasAnalyticsConsent,
  hasMarketingConsent,
  hasClarityConsent,
} from "@/lib/legal/cookie-consent";
import { loadClarity } from "@/lib/analytics/clarity";

type AnalyticsByConsentProps = {
  ga4Id?: string;
  fbPixelId?: string;
  clarityProjectId?: string;  // NEW
};

// ... existing window type and readCookie function ...

// Add Clarity loader function
function initClarity(projectId: string) {
  const win = window as ConsentAwareWindow;
  if (win.__ccthClarityLoaded) return;
  
  loadClarity({ projectId });
  win.__ccthClarityLoaded = true;
}

export function AnalyticsByConsent({ 
  ga4Id, 
  fbPixelId, 
  clarityProjectId  // NEW
}: AnalyticsByConsentProps) {
  useEffect(() => {
    const rawConsent = readCookie(COOKIE_CONSENT_COOKIE_NAME);
    if (!rawConsent) return;

    if (ga4Id && hasAnalyticsConsent(rawConsent)) {
      loadGa4(ga4Id);
    }

    if (fbPixelId && hasMarketingConsent(rawConsent)) {
      loadMetaPixel(fbPixelId);
    }

    // NEW: Load Clarity
    if (clarityProjectId && hasClarityConsent(rawConsent)) {
      initClarity(clarityProjectId);
    }
  }, [ga4Id, fbPixelId, clarityProjectId]);

  return null;
}
```

Update window type:
```typescript
type ConsentAwareWindow = Window & {
  // ... existing properties ...
  __ccthClarityLoaded?: boolean;  // NEW
};
```

### 2.3 Update Root Layout
**File:** `src/app/layout.tsx`

Add Clarity environment variable:

```typescript
const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;  // NEW

// Update AnalyticsByConsent call
<AnalyticsByConsent 
  ga4Id={GA4_ID} 
  fbPixelId={FB_PIXEL_ID} 
  clarityProjectId={CLARITY_PROJECT_ID}  // NEW
/>
```

## Acceptance Criteria

- [ ] Clarity only loads when `hasAnalyticsConsent()` returns true
- [ ] Clarity does NOT load when consent is declined
- [ ] `AnalyticsByConsent` receives `clarityProjectId` prop correctly
- [ ] No TypeScript errors in updated files
- [ ] Existing GA4/Meta functionality still works
- [ ] `__ccthClarityLoaded` flag prevents duplicate loading

## Testing Notes

Test scenarios:
1. User accepts all cookies → Clarity loads
2. User accepts only necessary → Clarity does NOT load
3. User already has consent cookie on page load → Clarity loads immediately
4. Component re-renders → Clarity only loads once
