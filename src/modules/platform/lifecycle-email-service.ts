import { LifecycleEmailType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import { buildLifecycleEmailContent } from "@/modules/platform/lifecycle-email-copy-builder";
import { createMarketingEmailUnsubscribeToken } from "@/modules/platform/marketing-email-unsubscribe-token";

const RENEWAL_ELIGIBLE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE_STANDARD,
  SubscriptionStatus.ACTIVE_FAMILYPLUS,
  SubscriptionStatus.GRACE,
  SubscriptionStatus.CANCELED_AT_PERIOD_END,
];

const WINBACK_ELIGIBLE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE_STANDARD,
  SubscriptionStatus.ACTIVE_FAMILYPLUS,
  SubscriptionStatus.GRACE,
  SubscriptionStatus.CANCELED_AT_PERIOD_END,
];

async function sendEmail(to: string, subject: string, text: string) {
  return sendTransactionalEmail({
    to,
    subject,
    text,
    tags: [{ name: "feature", value: "lifecycle" }],
  });
}

function buildMarketingUnsubscribeUrl(parentId: string, email: string) {
  const token = createMarketingEmailUnsubscribeToken({
    parentId,
    parentEmail: email,
  });
  return `${resolveEmailPublicBaseUrl()}/api/email/marketing/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function sendLifecycleEmail(parentId: string, type: LifecycleEmailType) {
  const parent = await prisma.parentAccount.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      email: true,
      displayName: true,
      preferences: {
        select: {
          marketingEmailOptIn: true,
        },
      },
    },
  });

  if (!parent) return false;
  if (parent.preferences && !parent.preferences.marketingEmailOptIn) return false;

  const existing = await prisma.lifecycleEmailLog.findUnique({
    where: { parentId_type: { parentId, type } },
  });
  if (existing) return false;

  const renewalEndDate =
    type === LifecycleEmailType.RENEWAL_14D
      ? (
          await prisma.subscription.findUnique({
            where: { parentId },
            select: { currentPeriodEnd: true },
          })
        )?.currentPeriodEnd
      : null;

  const { subject, text } = buildLifecycleEmailContent(type, {
    displayName: parent.displayName,
    renewalEndDate,
  });
  const unsubscribeUrl = buildMarketingUnsubscribeUrl(parent.id, parent.email);
  const finalText = [
    text,
    "",
    "Nếu bạn không muốn nhận email marketing từ Cùng Con Tự Học, hủy đăng ký tại đây:",
    unsubscribeUrl,
  ].join("\n");

  const delivery = await sendEmail(parent.email, subject, finalText);
  if (!delivery.sent) {
    return false;
  }

  await prisma.lifecycleEmailLog.create({
    data: { parentId, type },
  });

  return true;
}

export async function dispatchPendingLifecycleEmails() {
  const now = new Date();

  const d1Start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const d1End = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  const d3Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const d3End = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const d5Start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const d5End = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const d7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const d7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const winbackStart = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
  const winbackEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const renewalStart = new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000);
  const renewalEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [d1Candidates, d3Candidates, d5Candidates, d7Candidates, winbackCandidates, renewalCandidates] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: { gte: d1Start, lt: d1End },
        parent: { lifecycleEmails: { none: { type: LifecycleEmailType.TRIAL_D1 } } },
      },
      select: { parentId: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: { gte: d3Start, lt: d3End },
        parent: { lifecycleEmails: { none: { type: LifecycleEmailType.TRIAL_D3 } } },
      },
      select: { parentId: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: { gte: d5Start, lt: d5End },
        parent: { lifecycleEmails: { none: { type: LifecycleEmailType.TRIAL_D5 } } },
      },
      select: { parentId: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: { gte: d7Start, lt: d7End },
        parent: { lifecycleEmails: { none: { type: LifecycleEmailType.TRIAL_D7 } } },
      },
      select: { parentId: true },
    }),
    prisma.parentAccount.findMany({
      where: {
        lastActiveAt: { gte: winbackStart, lt: winbackEnd },
        subscription: {
          is: {
            status: { in: WINBACK_ELIGIBLE_STATUSES },
          },
        },
        lifecycleEmails: {
          none: { type: LifecycleEmailType.WINBACK_D30 },
        },
      },
      select: { id: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: { in: RENEWAL_ELIGIBLE_STATUSES },
        currentPeriodEnd: { gte: renewalStart, lt: renewalEnd },
        parent: {
          lifecycleEmails: {
            none: { type: LifecycleEmailType.RENEWAL_14D },
          },
        },
      },
      select: { parentId: true },
    }),
  ]);

  let sent = 0;
  let failed = 0;

  for (const sub of d1Candidates) {
    try {
      const delivered = await sendLifecycleEmail(sub.parentId, LifecycleEmailType.TRIAL_D1);
      if (delivered) sent++;
    } catch {
      failed++;
    }
  }

  for (const sub of d3Candidates) {
    try {
      const delivered = await sendLifecycleEmail(sub.parentId, LifecycleEmailType.TRIAL_D3);
      if (delivered) sent++;
    } catch {
      failed++;
    }
  }

  for (const sub of d5Candidates) {
    try {
      const delivered = await sendLifecycleEmail(sub.parentId, LifecycleEmailType.TRIAL_D5);
      if (delivered) sent++;
    } catch {
      failed++;
    }
  }

  for (const sub of d7Candidates) {
    try {
      const delivered = await sendLifecycleEmail(sub.parentId, LifecycleEmailType.TRIAL_D7);
      if (delivered) sent++;
    } catch {
      failed++;
    }
  }

  for (const parent of winbackCandidates) {
    try {
      const delivered = await sendLifecycleEmail(parent.id, LifecycleEmailType.WINBACK_D30);
      if (delivered) sent++;
    } catch {
      failed++;
    }
  }

  for (const sub of renewalCandidates) {
    try {
      const delivered = await sendLifecycleEmail(sub.parentId, LifecycleEmailType.RENEWAL_14D);
      if (delivered) sent++;
    } catch {
      failed++;
    }
  }

  return {
    d1: d1Candidates.length,
    d3: d3Candidates.length,
    d5: d5Candidates.length,
    d7: d7Candidates.length,
    winback: winbackCandidates.length,
    renewal: renewalCandidates.length,
    sent,
    failed,
  };
}
