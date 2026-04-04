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

export function evaluateRule(
  rule: AlertRule,
  currentValue: number,
  previousValue?: number
): boolean {
  switch (rule.condition) {
    case "gt":
      return currentValue > rule.threshold;
    case "lt":
      return currentValue < rule.threshold;
    case "eq":
      return currentValue === rule.threshold;
    case "change_gt":
      if (previousValue === undefined || previousValue === 0) return false;
      const change = ((currentValue - previousValue) / previousValue) * 100;
      return change > rule.threshold;
    default:
      return false;
  }
}
