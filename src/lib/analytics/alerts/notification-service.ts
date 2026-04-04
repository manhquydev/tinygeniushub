import { Alert } from "./rules-engine";

export async function sendAlertNotification(alert: Alert): Promise<void> {
  // Log to console (replace with email/Slack in production)
  console.log(
    `🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.metric} = ${alert.currentValue}`
  );

  // TODO: Implement actual notification channels
  // - Email via Resend
  // - Slack webhook
  // - SMS via Twilio (for critical)
}
