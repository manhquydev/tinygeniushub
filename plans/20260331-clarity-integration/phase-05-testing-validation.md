# Phase 5: Testing & Validation

**Status:** Blocked (depends on Phases 1-4)  
**Owner:** tester  
**Dependencies:** Phases 1, 2, 3, 4  
**Estimated Effort:** 2 hours

## Tasks

### 5.1 Unit Tests

**File:** `src/lib/analytics/clarity/__tests__/loader.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadClarity, isClarityLoaded } from '../loader';

describe('Clarity Loader', () => {
  beforeEach(() => {
    // Reset state
    document.head.innerHTML = '';
    delete (window as any).__ccthClarityLoaded;
    delete (window as any).clarity;
  });

  it('injects script tag correctly', () => {
    const result = loadClarity({ projectId: 'test-id' });
    
    expect(result).toBe(true);
    const script = document.getElementById('ccth-clarity-src');
    expect(script).toBeTruthy();
    expect(script?.getAttribute('src')).toContain('test-id');
  });

  it('prevents double loading', () => {
    loadClarity({ projectId: 'test-id' });
    const result = loadClarity({ projectId: 'test-id' });
    
    expect(result).toBe(false);
    expect(document.querySelectorAll('#ccth-clarity-src').length).toBe(1);
  });

  it('isClarityLoaded returns correct state', () => {
    expect(isClarityLoaded()).toBe(false);
    loadClarity({ projectId: 'test-id' });
    expect(isClarityLoaded()).toBe(true);
  });
});
```

**File:** `src/lib/analytics/clarity/__tests__/config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { isClarityEnabled, getProjectId } from '../config';

describe('Clarity Config', () => {
  it('returns false when project ID is empty', () => {
    // Mock empty env
    expect(isClarityEnabled()).toBe(false);
  });

  it('returns true when project ID is set', () => {
    // This test would need env var mocking
    // Simplified for documentation
  });

  it('throws in strict mode when not configured', () => {
    expect(() => getProjectId(true)).toThrow();
  });
});
```

### 5.2 E2E Tests

**File:** `tests/e2e/clarity-integration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Clarity Integration', () => {
  test('script loads after consent accepted', async ({ page }) => {
    await page.goto('/');
    
    // Initially no Clarity
    await expect(page.locator('script#ccth-clarity-src')).not.toBeAttached();
    
    // Accept cookies
    await page.click('[data-testid="accept-all-cookies"]');
    
    // Wait for script injection
    await page.waitForSelector('script#ccth-clarity-src');
  });

  test('script does not load when only necessary cookies accepted', async ({ page }) => {
    await page.goto('/');
    
    // Accept only necessary
    await page.click('[data-testid="accept-necessary-cookies"]');
    
    // Clarity should NOT be present
    await expect(page.locator('script#ccth-clarity-src')).not.toBeAttached();
  });

  test('clarity API available on window after load', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="accept-all-cookies"]');
    
    // Wait and check window.clarity
    await page.waitForFunction(() => (window as any).clarity !== undefined);
  });
});
```

### 5.3 Dashboard Validation Checklist

Manual verification in Microsoft Clarity dashboard:

- [ ] **Recordings Tab:** Sessions appearing within 5 minutes of test visits
- [ ] **Heatmaps:** Click/scroll data visible for key pages (`/`, `/courses`, `/lessons`)
- [ ] **Session Count:** Matches expected test traffic
- [ ] **Dead Clicks:** Detecting non-interactive element clicks
- [ ] **Rage Clicks:** Detecting repeated clicks (frustration indicator)
- [ ] **JavaScript Errors:** Any console errors from Clarity script

### 5.4 Performance Tests

Verify no impact on Core Web Vitals:

```bash
# Run lighthouse before and after
npx lighthouse http://localhost:3000 --output=json
```

**Metrics to watch:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

## Acceptance Criteria

- [ ] All unit tests pass (`pnpm test`)
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Clarity dashboard shows test sessions
- [ ] No console errors
- [ ] Cookie consent integration verified
- [ ] Performance impact < 5% on LCP

## Test Commands

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run E2E
pnpm test:e2e

# Run specific test file
pnpm test src/lib/analytics/clarity/__tests__/loader.test.ts
```
