import { redis } from "@/lib/redis";
import { Alert, AlertRule, getDefaultRules } from "./rules-engine";

const ALERTS_KEY = "analytics:alerts";
const RULES_KEY = "analytics:alert_rules";

export async function saveAlert(alert: Alert): Promise<void> {
  await redis.lpush(ALERTS_KEY, JSON.stringify(alert));
  await redis.ltrim(ALERTS_KEY, 0, 99); // Keep last 100 alerts
}

export async function getAlerts(limit: number = 50): Promise<Alert[]> {
  const alerts = await redis.lrange(ALERTS_KEY, 0, limit - 1);
  return alerts.map((a) => JSON.parse(a));
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const alerts = await getAlerts(100);
  const updated = alerts.map((a) =>
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
  if (!rules) {
    // Initialize with default rules if none exist
    const defaultRules = getDefaultRules();
    await saveRules(defaultRules);
    return defaultRules;
  }
  return JSON.parse(rules) as AlertRule[];
}
