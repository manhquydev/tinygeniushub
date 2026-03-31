# Phase 3: Environment Configuration

**Status:** Completed  
**Owner:** dev-3  
**Dependencies:** None  
**Estimated Effort:** 1 hour

## Tasks

### 3.1 Update .env.example
**File:** `.env.example`

Add Clarity environment variable in the Analytics section:

```bash
# Analytics (optional — leave empty to disable tracking)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_FB_PIXEL_ID=
NEXT_PUBLIC_CLARITY_PROJECT_ID=  # NEW: Clarity project ID (e.g., w49qfrxwu5)
GA4_PROPERTY_ID=
# ... rest of analytics env vars
```

### 3.2 Create Config Module
**File:** `src/lib/analytics/clarity/config.ts`

```typescript
/**
 * Microsoft Clarity configuration
 * Uses NEXT_PUBLIC_ prefix for build-time env vars
 */

export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

/**
 * Check if Clarity tracking is enabled
 */
export function isClarityEnabled(): boolean {
  return typeof CLARITY_PROJECT_ID === 'string' && 
         CLARITY_PROJECT_ID.length > 0;
}

/**
 * Get the configured project ID
 * Throws if not configured and strict mode enabled
 */
export function getProjectId(strict = false): string | null {
  if (!CLARITY_PROJECT_ID && strict) {
    throw new Error('NEXT_PUBLIC_CLARITY_PROJECT_ID is not configured');
  }
  return CLARITY_PROJECT_ID ?? null;
}

/**
 * Data export configuration (server-side)
 * These should NOT use NEXT_PUBLIC_ prefix
 */
export const CLARITY_DATA_EXPORT_CONFIG = {
  token: process.env.CLARITY_DATA_EXPORT_TOKEN,  // Server-side only
  baseUrl: 'https://clarity.microsoft.com/api/export',
} as const;

/**
 * Check if data export API is configured
 */
export function isDataExportEnabled(): boolean {
  return !!CLARITY_DATA_EXPORT_CONFIG.token;
}
```

### 3.3 Update Config Export
**File:** `src/lib/analytics/clarity/index.ts`

Add config exports:

```typescript
export * from './types';
export * from './config';  // NEW
export { loadClarity, isClarityLoaded, setClarityConsent } from './loader';
```

## Security Notes

- `NEXT_PUBLIC_CLARITY_PROJECT_ID` is safe to expose (required for client-side)
- `CLARITY_DATA_EXPORT_TOKEN` should NEVER use `NEXT_PUBLIC_` prefix
- Server-side data export token stored in env only

## Acceptance Criteria

- [x] `.env.example` includes `NEXT_PUBLIC_CLARITY_PROJECT_ID` with comment
- [x] `isClarityEnabled()` returns `false` when env var is empty
- [x] `isClarityEnabled()` returns `true` when env var has value
- [x] `getProjectId()` returns string or null based on config
- [x] `isDataExportEnabled()` correctly checks for server token
- [x] Config module has no `NEXT_PUBLIC_` leakage for sensitive data

## Testing Notes

```typescript
// Test isClarityEnabled
process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = '';
expect(isClarityEnabled()).toBe(false);

process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = 'w49qfrxwu5';
expect(isClarityEnabled()).toBe(true);

// Test getProjectId strict mode
expect(() => getProjectId(true)).toThrow();
```
