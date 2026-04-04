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
