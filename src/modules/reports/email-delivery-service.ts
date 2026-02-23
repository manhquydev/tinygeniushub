import { EmailStatus, ParentPreferences, WeeklyEmailPreference } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const EMAIL_CLAIM_TTL_MS = 15 * 60 * 1000;
export const EMAIL_DELIVERY_PROVIDER = env.REPORT_EMAIL_PROVIDER;

type EmailEligibilityInput = {
  preferences: ParentPreferences | null;
  childOptIn: WeeklyEmailPreference | null;
};

export function canSendWeeklyEmail(input: EmailEligibilityInput) {
  if (!input.preferences) {
    return true;
  }

  if (!input.preferences.weeklyReportEmailEnabled) {
    return false;
  }

  if (input.preferences.weeklyReportChannel === "IN_APP_ONLY") {
    return false;
  }

  if (input.childOptIn && !input.childOptIn.enabled) {
    return false;
  }

  return true;
}

async function sendWeeklyReportEmailMock(report: {
  id: string;
  child: {
    nickname: string;
    parent: {
      email: string;
    };
  };
}) {
  console.log(
    `[email] weekly report sent (mock): report=${report.id} child=${report.child.nickname} to=${report.child.parent.email}`,
  );
}

async function sendWeeklyReportEmailResend(report: {
  id: string;
  child: {
    nickname: string;
    parent: {
      email: string;
    };
  };
}) {
  const to = env.REPORT_EMAIL_TO_OVERRIDE ?? report.child.parent.email;
  const subject = `Báo cáo tuần của ${report.child.nickname}`;
  const text = [
    `Báo cáo tuần đã sẵn sàng cho bé ${report.child.nickname}.`,
    `Mã báo cáo: ${report.id}`,
    "Đăng nhập hệ thống để xem chi tiết tiến độ học tập.",
  ].join("\n");

  const payload = {
    from: env.REPORT_EMAIL_FROM,
    to: [to],
    subject,
    text,
    ...(env.REPORT_EMAIL_REPLY_TO ? { reply_to: env.REPORT_EMAIL_REPLY_TO } : {}),
    tags: [
      { name: "feature", value: "weekly_report" },
      { name: "environment", value: env.NODE_ENV },
    ],
  };

  const response = await fetch(`${env.REPORT_EMAIL_RESEND_API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.REPORT_EMAIL_RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Resend delivery failed: status=${response.status}`);
  }
}

async function sendWeeklyReportEmail(report: {
  id: string;
  child: {
    nickname: string;
    parent: {
      email: string;
    };
  };
}) {
  if (EMAIL_DELIVERY_PROVIDER === "mock_email") {
    await sendWeeklyReportEmailMock(report);
    return;
  }

  if (EMAIL_DELIVERY_PROVIDER === "resend") {
    await sendWeeklyReportEmailResend(report);
    return;
  }

  throw new Error(`Unsupported report email provider: ${EMAIL_DELIVERY_PROVIDER}`);
}

export async function deliverQueuedWeeklyReportEmails(limit = 100, parentId?: string) {
  const staleClaimCutoff = new Date(Date.now() - EMAIL_CLAIM_TTL_MS);
  const staleClaims = await prisma.weeklyReport.updateMany({
    where: {
      emailStatus: EmailStatus.PROCESSING,
      deliveredEmailAt: null,
      emailClaimedAt: {
        lt: staleClaimCutoff,
      },
    },
    data: {
      emailStatus: EmailStatus.QUEUED,
      emailClaimedAt: null,
    },
  });

  const queuedReports = await prisma.weeklyReport.findMany({
    where: {
      emailStatus: EmailStatus.QUEUED,
      deliveredEmailAt: null,
      ...(parentId
        ? {
            child: {
              parentId,
            },
          }
        : {}),
    },
    include: {
      child: {
        include: {
          parent: {
            include: {
              preferences: true,
              weeklyEmailOptIns: true,
            },
          },
        },
      },
    },
    orderBy: {
      generatedAt: "asc",
    },
    take: limit,
  });

  let sent = 0;
  let skipped = 0;
  let bounced = 0;
  let claimedByOtherWorker = 0;

  for (const report of queuedReports) {
    const claim = await prisma.weeklyReport.updateMany({
      where: {
        id: report.id,
        emailStatus: EmailStatus.QUEUED,
        deliveredEmailAt: null,
      },
      data: {
        emailStatus: EmailStatus.PROCESSING,
        emailClaimedAt: new Date(),
      },
    });

    if (claim.count === 0) {
      claimedByOtherWorker += 1;
      continue;
    }

    const childOptIn = report.child.parent.weeklyEmailOptIns.find(
      (optIn) => optIn.childId === report.childId,
    ) ?? null;

    if (!canSendWeeklyEmail({ preferences: report.child.parent.preferences, childOptIn })) {
      await prisma.weeklyReport.updateMany({
        where: {
          id: report.id,
          emailStatus: EmailStatus.PROCESSING,
        },
        data: {
          emailStatus: EmailStatus.BOUNCED,
          emailClaimedAt: null,
        },
      });

      skipped += 1;
      continue;
    }

    try {
      await sendWeeklyReportEmail(report);

      await prisma.weeklyReport.updateMany({
        where: {
          id: report.id,
          emailStatus: EmailStatus.PROCESSING,
        },
        data: {
          emailStatus: EmailStatus.SENT,
          deliveredEmailAt: new Date(),
          emailClaimedAt: null,
        },
      });

      sent += 1;
    } catch {
      await prisma.weeklyReport.updateMany({
        where: {
          id: report.id,
          emailStatus: EmailStatus.PROCESSING,
        },
        data: {
          emailStatus: EmailStatus.BOUNCED,
          emailClaimedAt: null,
        },
      });

      bounced += 1;
    }
  }

  return {
    provider: EMAIL_DELIVERY_PROVIDER,
    queued: queuedReports.length,
    sent,
    skipped,
    bounced,
    claimedByOtherWorker,
    requeuedStaleClaims: staleClaims.count,
  };
}
