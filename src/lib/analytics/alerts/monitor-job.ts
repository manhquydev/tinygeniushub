import { getUnifiedAnalyticsSnapshot } from "@/modules/admin/admin-unified-analytics-service";
import { evaluateRule, Alert } from "./rules-engine";
import { saveAlert, getRules } from "./storage-service";
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
        currentValue = snapshot.revenue.churnRate;
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
