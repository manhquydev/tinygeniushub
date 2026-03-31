# Phase 4: Data Export API (Optional)

**Status:** Completed  
**Owner:** dev-1  
**Dependencies:** Phase 1 (types), Phase 3 (config)  
**Completed:** 2026-03-31

## Implementation Summary

All tasks completed successfully:

- ✅ `src/lib/analytics/clarity/api-client.ts` - API client with JWT Bearer auth
- ✅ `src/app/api/clarity/export/route.ts` - Admin-only API route with proper error handling
- ✅ `src/lib/auth/admin-guard.ts` - Admin authorization guard using Better Auth

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/analytics/clarity/api-client.ts` | 93 | ClarityExportClient class with JWT auth |
| `src/app/api/clarity/export/route.ts` | 109 | GET endpoint for session export |
| `src/lib/auth/admin-guard.ts` | 56 | Admin verification using env.ADMIN_EMAILS |

## API Endpoint

**GET** `/api/clarity/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

**Headers:** Session cookie (Better Auth)

**Response Format:**
```json
{
  "ok": true,
  "data": {
    "success": true,
    "data": [...],
    "meta": {
      "startDate": "2026-03-01",
      "endDate": "2026-03-31",
      "count": 42,
      "projectId": "w49qfrxwu5"
    }
  }
}
```

**Error Codes:**
- 400: Missing/invalid date parameters
- 401: Unauthorized (no session)
- 403: Forbidden (not admin)
- 502: Clarity API error
- 503: Export not configured

## Token Information

### 4.1 Create API Client
**File:** `src/lib/analytics/clarity/api-client.ts`

```typescript
import { CLARITY_DATA_EXPORT_CONFIG } from './config';
import type { ClarityExportParams, ClaritySession } from './types';

const BASE_URL = 'https://clarity.microsoft.com/api/export';

export class ClarityExportClient {
  private token: string;
  private projectId: string;

  constructor(token: string, projectId: string) {
    this.token = token;
    this.projectId = projectId;
  }

  /**
   * Export session data from Clarity
   */
  async exportSessions(params: ClarityExportParams): Promise<ClaritySession[]> {
    const url = new URL(`${BASE_URL}/sessions`);
    url.searchParams.set('projectId', this.projectId);
    url.searchParams.set('startDate', params.startDate);
    url.searchParams.set('endDate', params.endDate);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Clarity export failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Export heatmap data
   */
  async exportHeatmaps(url: string, device: 'desktop' | 'tablet' | 'mobile' = 'desktop') {
    const apiUrl = new URL(`${BASE_URL}/heatmaps`);
    apiUrl.searchParams.set('projectId', this.projectId);
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('device', device);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Heatmap export failed: ${response.status}`);
    }

    return response.json();
  }
}

/**
 * Factory function using environment config
 */
export function createExportClient(projectId: string): ClarityExportClient | null {
  const token = CLARITY_DATA_EXPORT_CONFIG.token;
  if (!token) {
    return null;
  }
  return new ClarityExportClient(token, projectId);
}
```

### 4.2 Create API Route
**File:** `src/app/api/clarity/export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createExportClient } from '@/lib/analytics/clarity/api-client';
import { requireAdmin } from '@/lib/auth/admin-guard';

/**
 * GET /api/clarity/export?startDate=...&endDate=...
 * Admin-only endpoint for exporting Clarity session data
 */
export async function GET(request: NextRequest) {
  // Admin authorization
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const projectId = process.env.CLARITY_PROJECT_ID || process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: startDate, endDate' },
      { status: 400 }
    );
  }

  if (!projectId) {
    return NextResponse.json(
      { error: 'Clarity project not configured' },
      { status: 500 }
    );
  }

  const client = createExportClient(projectId);
  if (!client) {
    return NextResponse.json(
      { error: 'Data export not configured' },
      { status: 503 }
    );
  }

  try {
    const sessions = await client.exportSessions({
      startDate,
      endDate,
      format: 'json',
    });

    return NextResponse.json({
      success: true,
      data: sessions,
      meta: {
        startDate,
        endDate,
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error('Clarity export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data from Clarity' },
      { status: 502 }
    );
  }
}
```

### 4.3 Add Admin Guard
**File:** `src/lib/auth/admin-guard.ts` (if not exists, or update existing)

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: /* ... */ });
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') ?? [];
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null; // No error, proceed
}
```

## Token Information

```
Project ID: w49qfrxwu5
Token Name: cungcontuhoc
Token Value: eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ4M0FCMDhFNUYwRDMxNjdEOTRFMTQ3M0FEQTk2RTcyRDkwRUYwRkYiLCJ0eXAiOiJKV1QifQ...
```

**⚠️ SECURITY WARNING:** Store this token in `.env` as `CLARITY_DATA_EXPORT_TOKEN` (NOT `NEXT_PUBLIC_`)

## Acceptance Criteria

- [x] API client correctly formats Bearer token auth
- [x] Export endpoint returns session data as JSON
- [x] Admin-only access enforced via `requireAdmin()`
- [x] Proper error handling for missing config (503)
- [x] Date parameters validated (400 for invalid format)
- [x] Response includes metadata (count, date range, projectId)
- [x] TypeScript strict mode compliance verified
- [x] All 296 existing tests pass

## Testing Notes

```bash
# Test endpoint (admin auth required)
curl "http://localhost:3000/api/clarity/export?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer <admin-token>"
```
