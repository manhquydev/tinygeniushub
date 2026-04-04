# Phase 2: Clarity Admin Integration

**Status:** Ready  
**Owner:** dev-2  
**Dependencies:** None  
**Estimated Effort:** 3 hours

## Tasks

### 2.1 Create Clarity Dashboard Service
**File:** `src/lib/analytics/clarity/dashboard-service.ts`

```typescript
import { createExportClient } from "./api-client";
import { env } from "@/lib/env";

export interface ClarityDashboardData {
  projectId: string;
  sessions24h: number;
  recordingsAvailable: boolean;
  heatmapsAvailable: boolean;
}

export async function getClarityDashboardData(): Promise<ClarityDashboardData | null> {
  const projectId = env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!projectId) return null;

  // Note: Clarity doesn't have a simple "stats" API, so we'll return config
  // Real data would need to be fetched from Clarity dashboard via iframe
  return {
    projectId,
    sessions24h: 0, // Would need to fetch from export API
    recordingsAvailable: true,
    heatmapsAvailable: true,
  };
}
```

### 2.2 Create Clarity API Routes
**File:** `src/app/api/admin/analytics/clarity/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getClarityDashboardData } from "@/lib/analytics/clarity/dashboard-service";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const data = await getClarityDashboardData();
  
  if (!data) {
    return NextResponse.json(
      { error: "Clarity not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  });
}
```

### 2.3 Create Clarity Dashboard Component
**File:** `src/components/admin/analytics/clarity-dashboard.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Video, MousePointer } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { Button } from "@/components/ui/button";

interface ClarityData {
  projectId: string;
  sessions24h: number;
  recordingsAvailable: boolean;
  heatmapsAvailable: boolean;
}

export function ClarityDashboard() {
  const [data, setData] = useState<ClarityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/clarity");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading Clarity data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div>Clarity not configured</div>;

  const clarityUrl = `https://clarity.microsoft.com/projects/view/${data.projectId}`;

  return (
    <div className="space-y-4">
      <AdminSectionCard title="Microsoft Clarity Integration" icon={<Video size={16} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Heatmaps</h4>
            <p className="text-sm text-muted-foreground mb-3">
              View click, scroll, and attention heatmaps
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href={`${clarityUrl}/heatmaps`} target="_blank" rel="noopener noreferrer">
                <MousePointer size={14} className="mr-2" />
                Open Heatmaps
              </a>
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Session Recordings</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Watch user sessions and interactions
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href={`${clarityUrl}/recordings`} target="_blank" rel="noopener noreferrer">
                <Video size={14} className="mr-2" />
                View Recordings
              </a>
            </Button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" asChild>
            <a href={clarityUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} className="mr-2" />
              Open Clarity Dashboard
            </a>
          </Button>
        </div>
      </AdminSectionCard>
    </div>
  );
}
```

### 2.4 Create Clarity Embed Component (Optional)
**File:** `src/components/admin/analytics/clarity-embed.tsx`

For embedding Clarity iframes (if supported):

```typescript
"use client";

interface ClarityEmbedProps {
  projectId: string;
  type: "heatmaps" | "recordings";
}

export function ClarityEmbed({ projectId, type }: ClarityEmbedProps) {
  const url = `https://clarity.microsoft.com/projects/view/${projectId}/${type}`;
  
  return (
    <iframe
      src={url}
      className="w-full h-[600px] border rounded-lg"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
```

### 2.5 Update Admin Navigation
**File:** Modify admin navigation to add Clarity link

Add to `src/components/admin/admin-module-catalog.ts`:
```typescript
{
  key: "clarity",
  label: "User Behavior",
  description: "Microsoft Clarity heatmaps & recordings",
  href: "/admin/analytics/clarity",
  icon: Video,
}
```

## Acceptance Criteria

- [x] Clarity dashboard component displays correctly
- [x] Links open Clarity dashboard in new tab
- [x] API returns 503 if not configured
- [x] Shows error state if API fails
- [x] Integrated into admin navigation

## Implementation Status

**Status:** Completed  
**Completed Date:** 2026-03-31  
**Developer:** dev-2

### Files Created
1. `src/lib/analytics/clarity/dashboard-service.ts` - Dashboard service linking to Clarity project
2. `src/app/api/admin/analytics/clarity/route.ts` - API endpoint returning Clarity status
3. `src/components/admin/analytics/clarity-dashboard.tsx` - Component with links to Clarity dashboard
4. `src/components/admin/analytics/clarity-embed.tsx` - Optional embed component

### Files Modified
- `src/components/admin/admin-module-catalog.ts` - Added Clarity to navigation with MousePointerClick icon

### Notes
- Used existing `requireAdminFromRequest` pattern from `@/lib/auth/admin` for consistency with other admin API routes
- API returns 503 when Clarity is not configured (no project ID)
- Navigation integrated into "Core Control" group alongside Analytics
- Component handles loading, error, and unconfigured states
