import { EmailStatus, ParentPreferences, WeeklyEmailPreference } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import type { EnrichedSkillsSummary, SkillProgressByDomain } from "@/modules/adaptive/weekly-report-enricher";

const EMAIL_CLAIM_TTL_MS = 15 * 60 * 1000;
export const EMAIL_DELIVERY_PROVIDER = env.REPORT_EMAIL_PROVIDER;

type EmailEligibilityInput = {
  preferences: ParentPreferences | null;
  childOptIn: WeeklyEmailPreference | null;
};

export type WeeklyReportEmailPayload = {
  id: string;
  skillsSummary?: unknown;
  child: {
    nickname: string;
    parent: {
      email: string;
    };
  };
};

function formatDomainName(domain: string): string {
  if (domain === "MATH") return "Maths";
  if (domain === "ENGLISH_PHONICS") return "English Phonics";
  return domain;
}

function formatSkillProgressSection(progress: SkillProgressByDomain): string {
  const lines: string[] = [];
  lines.push(`  ${formatDomainName(progress.domain)}:`);
  lines.push(`Total skills:${progress.totalSkills}`);
  lines.push(`Proficiency:${progress.masteredCount}| Rather:${progress.proficientCount}| Currently studying:${progress.developingCount}`);
  lines.push(`General level:${Math.round(progress.overallMastery * 100)}%`);

  if (progress.topImprovements.length > 0) {
    lines.push("Outstanding progress:");
    for (const imp of progress.topImprovements) {
      lines.push(`      - ${imp.skillNameVi}: ${Math.round(imp.masteryBefore * 100)}% → ${Math.round(imp.masteryAfter * 100)}%`);
    }
  }

  if (progress.needsAttention.length > 0) {
    lines.push("It should be noted:");
    for (const att of progress.needsAttention) {
      lines.push(`      - ${att.skillNameVi} (${Math.round(att.mastery * 100)}%): ${att.reason}`);
    }
  }

  return lines.join("\n");
}

/** Build email text body including adaptive skill data when available. */
export function buildWeeklyReportEmailText(report: WeeklyReportEmailPayload): string {
  const lines: string[] = [
    `Weekly report is ready for your baby${report.child.nickname}.`,
    `Report code:${report.id}`,
  ];

  const summary = report.skillsSummary as Record<string, unknown> | null | undefined;
  const adaptive = summary?.adaptive as EnrichedSkillsSummary | undefined;

  if (adaptive && adaptive.skillsProgress?.length > 0) {
    lines.push("");
    lines.push("--- Skill progress ---");
    for (const progress of adaptive.skillsProgress) {
      lines.push(formatSkillProgressSection(progress));
    }

    if (adaptive.reviewStats) {
      const { scheduled, completed, accuracy } = adaptive.reviewStats;
      lines.push("");
      lines.push(`Review:${completed}/${scheduled}post | Accuracy:${Math.round(accuracy * 100)}%`);
    }
  }

  lines.push("");
  lines.push("Log in to the system to view detailed study progress.");

  return lines.join("\n");
}

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

async function sendWeeklyReportEmail(report: WeeklyReportEmailPayload) {
  const to = env.REPORT_EMAIL_TO_OVERRIDE ?? report.child.parent.email;
  const subject = `Weekly report of${report.child.nickname}`;
  const text = buildWeeklyReportEmailText(report);

  return sendTransactionalEmail({
    to,
    subject,
    text,
    tags: [
      { name: "feature", value: "weekly_report" },
      { name: "weekly_report_id", value: report.id },
    ],
  });
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
      const delivery = await sendWeeklyReportEmail(report);
      if (!delivery.sent) {
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
