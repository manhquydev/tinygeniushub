# Phase 4: Funnel Analytics

**Status:** Ready  
**Owner:** dev-4  
**Dependencies:** None  
**Estimated Effort:** 4 hours

## Tasks

### 4.1 Create Funnel Definition Service
**File:** `src/modules/admin/admin-funnel-service.ts`

```typescript
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

export interface FunnelStep {
  name: string;
  eventType: string;
  count: number;
}

export interface FunnelData {
  name: string;
  period: string;
  steps: FunnelStep[];
  conversionRates: Record<string, number>; // step -> rate %
  totalConversionRate: number;
  dropOffRates: Record<string, number>; // step -> drop %
}

const FUNNEL_DEFINITIONS = {
  checkout: {
    name: "Course Checkout Funnel",
    steps: [
      { name: "View Course", eventType: "course_view" },
      { name: "Start Checkout", eventType: "course_checkout_started" },
      { name: "Complete Purchase", eventType: "course_purchase_succeeded" },
    ],
  },
  trial: {
    name: "Trial to Paid Funnel",
    steps: [
      { name: "Sign Up", eventType: "parent_signup" },
      { name: "Start Trial", eventType: "trial_started" },
      { name: "Complete First Lesson", eventType: "learning.lesson.video.watch.completed" },
      { name: "Convert to Paid", eventType: "subscription_activated" },
    ],
  },
  referral: {
    name: "Referral Funnel",
    steps: [
      { name: "Referral Link Shared", eventType: "referral_link_shared" },
      { name: "Friend Signs Up", eventType: "referral_signup" },
      { name: "Friend Purchases", eventType: "referral_purchase" },
    ],
  },
};

export async function getFunnelAnalytics(
  funnelType: keyof typeof FUNNEL_DEFINITIONS,
  days: number = 30
): Promise<FunnelData> {
  const definition = FUNNEL_DEFINITIONS[funnelType];
  const since = subDays(new Date(), days);
  
  const steps: FunnelStep[] = [];
  
  for (const step of definition.steps) {
    const count = await getEventCount(step.eventType, since);
    steps.push({
      name: step.name,
      eventType: step.eventType,
      count,
    });
  }
  
  // Calculate conversion rates
  const conversionRates: Record<string, number> = {};
  const dropOffRates: Record<string, number> = {};
  
  for (let i = 1; i < steps.length; i++) {
    const currentStep = steps[i];
    const previousStep = steps[i - 1];
    
    const conversionRate = previousStep.count > 0
      ? Number(((currentStep.count / previousStep.count) * 100).toFixed(1))
      : 0;
    
    const dropOffRate = previousStep.count > 0
      ? Number((((previousStep.count - currentStep.count) / previousStep.count) * 100).toFixed(1))
      : 0;
    
    conversionRates[currentStep.name] = conversionRate;
    dropOffRates[currentStep.name] = dropOffRate;
  }
  
  const totalConversionRate = steps[0].count > 0
    ? Number(((steps[steps.length - 1].count / steps[0].count) * 100).toFixed(1))
    : 0;
  
  return {
    name: definition.name,
    period: `${days}d`,
    steps,
    conversionRates,
    totalConversionRate,
    dropOffRates,
  };
}

async function getEventCount(eventType: string, since: Date): Promise<number> {
  // Try audit log first
  const auditCount = await prisma.auditLog.count({
    where: {
      action: eventType,
      createdAt: { gte: since },
    },
  });
  
  if (auditCount > 0) return auditCount;
  
  // Fallback to specific tables
  switch (eventType) {
    case "parent_signup":
      return prisma.parentAccount.count({
        where: { createdAt: { gte: since } },
      });
    case "subscription_activated":
      return prisma.subscription.count({
        where: {
          status: { in: ["ACTIVE_STANDARD", "ACTIVE_FAMILYPLUS"] },
          createdAt: { gte: since },
        },
      });
    default:
      return 0;
  }
}

export function getAvailableFunnels() {
  return Object.entries(FUNNEL_DEFINITIONS).map(([key, def]) => ({
    key,
    name: def.name,
    steps: def.steps.length,
  }));
}
```

### 4.2 Create Funnel API Route
**File:** `src/app/api/admin/analytics/funnels/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getFunnelAnalytics, getAvailableFunnels } from "@/modules/admin/admin-funnel-service";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const funnel = searchParams.get("funnel") as "checkout" | "trial" | "referral" | null;
  const days = parseInt(searchParams.get("days") || "30", 10);

  if (!funnel) {
    // Return available funnels
    return NextResponse.json({
      success: true,
      data: getAvailableFunnels(),
    });
  }

  try {
    const data = await getFunnelAnalytics(funnel, days);
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Funnel analytics error:", error);
    return NextResponse.json(
      { error: "Failed to generate funnel analytics" },
      { status: 500 }
    );
  }
}
```

### 4.3 Create Funnel Visualization Component
**File:** `src/components/admin/analytics/funnel-chart.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Funnel, TrendingDown, TrendingUp } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FunnelStep {
  name: string;
  count: number;
}

interface FunnelData {
  name: string;
  period: string;
  steps: FunnelStep[];
  conversionRates: Record<string, number>;
  totalConversionRate: number;
  dropOffRates: Record<string, number>;
}

export function FunnelChart() {
  const [funnelType, setFunnelType] = useState<"checkout" | "trial" | "referral">("checkout");
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`/api/admin/analytics/funnels?funnel=${funnelType}&days=30`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
      setLoading(false);
    }

    fetchData();
  }, [funnelType]);

  if (loading) return <div>Loading funnel data...</div>;
  if (!data) return <div>No funnel data available</div>;

  const maxCount = data.steps[0]?.count || 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button 
          variant={funnelType === "checkout" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFunnelType("checkout")}
        >
          Checkout
        </Button>
        <Button 
          variant={funnelType === "trial" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFunnelType("trial")}
        >
          Trial → Paid
        </Button>
        <Button 
          variant={funnelType === "referral" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFunnelType("referral")}
        >
          Referral
        </Button>
      </div>

      <AdminSectionCard title={data.name} icon={<Funnel size={16} />}>
        <div className="space-y-4">
          {data.steps.map((step, index) => {
            const prevStep = index > 0 ? data.steps[index - 1] : null;
            const conversionRate = prevStep ? data.conversionRates[step.name] : 100;
            const dropOffRate = prevStep ? data.dropOffRates[step.name] : 0;
            
            return (
              <div key={step.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.name}</span>
                    {index > 0 && (
                      <span className={`text-sm ${conversionRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                        {conversionRate >= 50 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {conversionRate}%
                      </span>
                    )}
                  </div>
                  <span className="font-bold">{step.count.toLocaleString()}</span>
                </div>
                <Progress value={(step.count / maxCount) * 100} className="h-2" />
                {index > 0 && dropOffRate > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {dropOffRate}% drop-off from previous step
                  </p>
                )}
              </div>
            );
          })}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Conversion Rate</span>
              <span className="text-2xl font-bold text-primary">
                {data.totalConversionRate}%
              </span>
            </div>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}
```

## Acceptance Criteria

- [ ] Funnel definitions configurable
- [ ] Conversion rates calculate correctly
- [ ] Drop-off rates accurate
- [ ] Multiple funnel types supported
- [ ] Visual funnel chart displays
- [ ] Color coding for conversion health

## Testing

```typescript
// Funnel calculation test
const funnel = await getFunnelAnalytics("checkout", 30);
expect(funnel.steps[0].count).toBeGreaterThanOrEqual(funnel.steps[1].count);
```
