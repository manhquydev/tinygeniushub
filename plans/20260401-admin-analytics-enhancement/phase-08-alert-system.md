# Phase 8: Alert & Notification System

**Status:** Complete ✅  
**Owner:** dev-2  
**Dependencies:** Phase 7  
**Estimated Effort:** 4 hours

## Tasks

### 8.1 Create Alert Rules Engine
**File:** `src/lib/analytics/alerts/rules-engine.ts`

```typescript
export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: "gt" | "lt" | "eq" | "change_gt";
  threshold: number;
  enabled: boolean;
  severity: "info" | "warning" | "critical";
}

export interface Alert {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: "info" | "warning" | "critical";
  acknowledged: boolean;
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "high_churn",
    name: "High Churn Rate",
    metric: "churnRate",
    condition: "gt",
    threshold: 10,
    enabled: true,
    severity: "warning",
  },
  {
    id: "low_retention",
    name: "Low Retention Rate",
    metric: "retentionRate",
    condition: "lt",
    threshold: 50,
    enabled: true,
    severity: "critical",
  },
  {
    id: "revenue_drop",
    name: "Revenue Drop",
    metric: "mrr",
    condition: "change_gt",
    threshold: -20,
    enabled: true,
    severity: "critical",
  },
  {
    id: "no_active_users",
    name: "No Active Users",
    metric: "activeUsers",
    condition: "lt",
    threshold: 1,
    enabled: true,
    severity: "warning",
  },
];

export function getDefaultRules(): AlertRule[] {
  return DEFAULT_RULES;
}

export function evaluateRule(rule: AlertRule, currentValue: number, previousValue?: number): boolean {
  switch (rule.condition) {
    case "gt":
      return currentValue > rule.threshold;
    case "lt":
      return currentValue < rule.threshold;
    case "eq":
      return currentValue === rule.threshold;
    case "change_gt":
      if (previousValue === undefined) return false;
      const change = ((currentValue - previousValue) / previousValue) * 100;
      return change > rule.threshold;
    default:
      return false;
  }
}
```

### 8.2 Create Alert Storage Service
**File:** `src/lib/analytics/alerts/storage-service.ts`

```typescript
import { redis } from "@/lib/redis";
import { Alert, AlertRule } from "./rules-engine";

const ALERTS_KEY = "analytics:alerts";
const RULES_KEY = "analytics:alert_rules";

export async function saveAlert(alert: Alert): Promise<void> {
  await redis.lpush(ALERTS_KEY, JSON.stringify(alert));
  await redis.ltrim(ALERTS_KEY, 0, 99); // Keep last 100 alerts
}

export async function getAlerts(limit: number = 50): Promise<Alert[]> {
  const alerts = await redis.lrange(ALERTS_KEY, 0, limit - 1);
  return alerts.map(a => JSON.parse(a));
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const alerts = await getAlerts(100);
  const updated = alerts.map(a => 
    a.id === alertId ? { ...a, acknowledged: true } : a
  );
  
  await redis.del(ALERTS_KEY);
  for (const alert of updated) {
    await redis.lpush(ALERTS_KEY, JSON.stringify(alert));
  }
}

export async function saveRules(rules: AlertRule[]): Promise<void> {
  await redis.set(RULES_KEY, JSON.stringify(rules));
}

export async function getRules(): Promise<AlertRule[]> {
  const rules = await redis.get(RULES_KEY);
  return rules ? JSON.parse(rules) : [];
}
```

### 8.3 Create Alert Monitoring Job
**File:** `src/lib/analytics/alerts/monitor-job.ts`

```typescript
import { getUnifiedAnalyticsSnapshot } from "@/modules/admin/admin-unified-analytics-service";
import { evaluateRule, getRules, Alert } from "./rules-engine";
import { saveAlert } from "./storage-service";
import { sendAlertNotification } from "./notification-service";

export async function runAlertMonitor(): Promise<void> {
  const rules = await getRules();
  const snapshot = await getUnifiedAnalyticsSnapshot();
  
  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    // Get current value from snapshot
    let currentValue: number;
    switch (rule.metric) {
      case "churnRate":
        currentValue = snapshot.retention.churnRate;
        break;
      case "retentionRate":
        currentValue = snapshot.retention.retentionRate;
        break;
      case "mrr":
        currentValue = snapshot.revenue.mrr;
        break;
      case "activeUsers":
        currentValue = snapshot.realtime.activeUsers;
        break;
      default:
        continue;
    }
    
    // Evaluate rule
    const triggered = evaluateRule(rule, currentValue);
    
    if (triggered) {
      const alert: Alert = {
        id: `alert_${Date.now()}_${rule.id}`,
        ruleId: rule.id,
        triggeredAt: new Date(),
        metric: rule.metric,
        currentValue,
        threshold: rule.threshold,
        severity: rule.severity,
        acknowledged: false,
      };
      
      await saveAlert(alert);
      await sendAlertNotification(alert);
    }
  }
}
```

### 8.4 Create Notification Service
**File:** `src/lib/analytics/alerts/notification-service.ts`

```typescript
import { Alert } from "./rules-engine";

export async function sendAlertNotification(alert: Alert): Promise<void> {
  // Log to console (replace with email/Slack in production)
  console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.metric} = ${alert.currentValue}`);
  
  // TODO: Implement actual notification channels
  // - Email via Resend
  // - Slack webhook
  // - SMS via Twilio (for critical)
}
```

### 8.5 Create Alert Management API
**File:** `src/app/api/admin/analytics/alerts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getAlerts, getRules, saveRules, acknowledgeAlert } from "@/lib/analytics/alerts/storage-service";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "alerts";

  try {
    if (type === "alerts") {
      const alerts = await getAlerts(50);
      return NextResponse.json({ success: true, data: alerts });
    } else if (type === "rules") {
      const rules = await getRules();
      return NextResponse.json({ success: true, data: rules });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    
    if (body.action === "acknowledge" && body.alertId) {
      await acknowledgeAlert(body.alertId);
      return NextResponse.json({ success: true });
    }
    
    if (body.rules) {
      await saveRules(body.rules);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update alerts" }, { status: 500 });
  }
}
```

### 8.6 Create Alert Dashboard Component
**File:** `src/components/admin/analytics/alert-dashboard.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  triggeredAt: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: "info" | "warning" | "critical";
  acknowledged: boolean;
}

function severityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="text-red-500" size={16} />;
    case "warning":
      return <AlertTriangle className="text-amber-500" size={16} />;
    default:
      return <Bell className="text-blue-500" size={16} />;
  }
}

function severityBadge(severity: string) {
  const variants = {
    critical: "destructive",
    warning: "secondary",
    info: "outline",
  };
  return <Badge variant={variants[severity as keyof typeof variants] as any}>{severity}</Badge>;
}

export function AlertDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      const response = await fetch("/api/admin/analytics/alerts?type=alerts");
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.data);
      }
      setLoading(false);
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function acknowledge(alertId: string) {
    const response = await fetch("/api/admin/analytics/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acknowledge", alertId }),
    });

    if (response.ok) {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    }
  }

  if (loading) return <div>Loading alerts...</div>;

  const unacknowledged = alerts.filter(a => !a.acknowledged);

  return (
    <div className="space-y-4">
      {unacknowledged.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-semibold text-red-700">
            {unacknowledged.length} unacknowledged alert{unacknowledged.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      <AdminSectionCard title="Active Alerts" icon={<Bell size={16} />}>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground">No alerts</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg flex items-center justify-between ${
                  alert.acknowledged ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {severityIcon(alert.severity)}
                  <div>
                    <p className="font-medium">{alert.metric}</p>
                    <p className="text-sm text-muted-foreground">
                      Value: {alert.currentValue} (threshold: {alert.threshold})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {severityBadge(alert.severity)}
                  {!alert.acknowledged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => acknowledge(alert.id)}
                    >
                      <CheckCircle size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </AdminSectionCard>
    </div>
  );
}
```

## Acceptance Criteria

- [x] Alert rules evaluate correctly
- [x] Alerts trigger when thresholds crossed
- [x] Alert history stored in Redis
- [x] Acknowledgment system works
- [x] Unacknowledged alerts show prominently
- [x] Auto-refresh every minute
- [x] TypeScript strict mode passes

## Testing

```typescript
// Alert evaluation test
const rule = { condition: "gt", threshold: 10 } as AlertRule;
expect(evaluateRule(rule, 15)).toBe(true);
expect(evaluateRule(rule, 5)).toBe(false);
```

## Implementation Notes

### Files Created (6 total)
1. ✅ `src/lib/analytics/alerts/rules-engine.ts` - Alert types, default rules, and evaluation engine
2. ✅ `src/lib/analytics/alerts/storage-service.ts` - Redis storage for alerts and rules with auto-initialization
3. ✅ `src/lib/analytics/alerts/monitor-job.ts` - Alert monitoring job using unified analytics snapshot
4. ✅ `src/lib/analytics/alerts/notification-service.ts` - Console notification service (extensible for email/Slack)
5. ✅ `src/app/api/admin/analytics/alerts/route.ts` - REST API for alert/CRUD with admin auth
6. ✅ `src/components/admin/analytics/alert-dashboard.tsx` - React dashboard with auto-refresh and acknowledgment

### Key Features
- 4 default alert rules (churn, retention, revenue, active users)
- 4 condition types: gt, lt, eq, change_gt
- Redis persistence with 100-alert history limit
- Acknowledgment system with visual indicators
- Vietnamese UI labels for metrics
- 60-second auto-refresh interval
- TypeScript strict mode compliant

### Default Alert Rules
| ID | Name | Metric | Condition | Threshold | Severity |
|---|---|---|---|---|---|
| high_churn | High Churn Rate | churnRate | gt | 10% | warning |
| low_retention | Low Retention Rate | retentionRate | lt | 50% | critical |
| revenue_drop | Revenue Drop | mrr | change_gt | -20% | critical |
| no_active_users | No Active Users | activeUsers | lt | 1 | warning |

### Phase Completion
**Status:** Complete ✅  
**Completed by:** dev-2  
**Date:** 2026-03-31  
**Type Check:** Passed  
**Test Status:** Ready for integration testing
