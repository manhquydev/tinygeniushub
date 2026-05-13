"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  ruleId: string;
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
  return (
    <Badge variant={variants[severity as keyof typeof variants] as any}>
      {severity}
    </Badge>
  );
}

function formatMetricName(metric: string): string {
  const names: Record<string, string> = {
    churnRate: "Churn Rate",
    retentionRate: "Retention Rate",
    mrr: "Recurring Revenue (MRR)",
    activeUsers: "Active user",
  };
  return names[metric] || metric;
}

export function AlertDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await fetch("/api/admin/analytics/alerts?type=alerts");
        if (response.ok) {
          const result = await response.json();
          setAlerts(result.data || []);
        } else {
          setError("Unable to load alert");
        }
      } catch {
        setError("Connection error");
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function acknowledge(alertId: string) {
    try {
      const response = await fetch("/api/admin/analytics/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge", alertId }),
      });

      if (response.ok) {
        setAlerts(alerts.map((a) =>
          a.id === alertId ? { ...a, acknowledged: true } : a
        ));
      }
    } catch {
      // Silently fail - will refresh on next interval
    }
  }

  if (loading) return <div>Loading warning...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-4">
      {unacknowledged.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-semibold text-red-700">
            {unacknowledged.length} unacknowledged alerts
          </p>
        </div>
      )}

      <AdminSectionCard title="Active warning" icon={<Bell size={16} />}>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground">There are no warnings</p>
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
                    <p className="font-medium">{formatMetricName(alert.metric)}</p>
                    <p className="text-sm text-muted-foreground">
                      Current value: {alert.currentValue} (threshold: {alert.threshold})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.triggeredAt).toLocaleString("vi-VN")}
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
                      title="Confirm read"
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
