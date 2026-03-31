# Phase 1: Core Types & Loader

**Status:** Completed ✅  
**Owner:** dev-1  
**Dependencies:** None  
**Estimated Effort:** 2 hours  
**Completed:** 2026-03-31

## Tasks

### 1.1 Create Type Definitions
**File:** `src/lib/analytics/clarity/types.ts`

Create comprehensive TypeScript types for Microsoft Clarity:

```typescript
// Window augmentation for Clarity
export interface ClarityWindow extends Window {
  clarity?: ClarityAPI;
  __ccthClarityLoaded?: boolean;
}

// Main Clarity API interface
export interface ClarityAPI {
  // Event tracking
  event: (name: string, options?: Record<string, unknown>) => void;
  // Session identification
  identify: (userId: string, sessionId?: string) => void;
  // Custom tags
  setTag: (key: string, value: string) => void;
  // Upgrade session
  upgrade: (reason: string) => void;
  // Consent management
  consent: (consent: boolean) => void;
}

// Configuration options
export interface ClarityConfig {
  projectId: string;
  uploadInterval?: number;
  delayDom?: boolean;
}

// Data export types
export interface ClarityExportParams {
  startDate: string;  // ISO 8601
  endDate: string;
  format?: 'json' | 'csv';
}

export interface ClaritySession {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime: string;
  pageViews: number;
  // ... other fields
}
```

### 1.2 Create Script Loader
**File:** `src/lib/analytics/clarity/loader.ts`

Implement consent-aware script loading:

```typescript
import { ClarityConfig, ClarityWindow } from './types';

const CLARITY_SCRIPT_BASE = 'https://www.clarity.ms/tag/';

export function loadClarity(config: ClarityConfig): boolean {
  const win = window as ClarityWindow;
  
  // Prevent double loading
  if (win.__ccthClarityLoaded || win.clarity) {
    return false;
  }

  // Inject script
  const script = document.createElement('script');
  script.async = true;
  script.id = 'ccth-clarity-src';
  script.src = `${CLARITY_SCRIPT_BASE}${encodeURIComponent(config.projectId)}`;
  
  document.head.appendChild(script);
  win.__ccthClarityLoaded = true;
  
  return true;
}

export function isClarityLoaded(): boolean {
  const win = window as ClarityWindow;
  return !!win.clarity || !!win.__ccthClarityLoaded;
}

export function setClarityConsent(consent: boolean): void {
  const win = window as ClarityWindow;
  if (win.clarity) {
    win.clarity.consent(consent);
  }
}
```

### 1.3 Create Main Index Export
**File:** `src/lib/analytics/clarity/index.ts`

```typescript
export * from './types';
export { loadClarity, isClarityLoaded, setClarityConsent } from './loader';
```

### 1.4 Create Config Module
**File:** `src/lib/analytics/clarity/config.ts`

```typescript
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export function isClarityEnabled(): boolean {
  return !!CLARITY_PROJECT_ID && CLARITY_PROJECT_ID.length > 0;
}
```

## Acceptance Criteria

- [x] All TypeScript types compile without errors
- [x] `loadClarity()` successfully injects script tag
- [x] Double-load protection works (`__ccthClarityLoaded` flag)
- [x] Script URL correctly encodes project ID
- [x] Module exports are tree-shakeable

## Testing Notes

Test with:
```typescript
// Unit test
const result = loadClarity({ projectId: 'test-id' });
expect(result).toBe(true);
expect(document.getElementById('ccth-clarity-src')).toBeTruthy();
```
