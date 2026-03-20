import { OrgRole, PlanCode, SubscriptionStatus } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { addMember } from "./organization-service";
import { enqueueLifecycleEmail } from "@/worker/queue";
import { LifecycleEmailType } from "@prisma/client";

export interface BulkEnrollRow {
  parent_name: string;
  parent_email: string;
  child_name: string;
  child_age: number;
}

export interface BulkEnrollResult {
  succeeded: number;
  failed: number;
  errors: string[];
}

/** Simple CSV parser — no external deps. Expects header row as first line. */
export function parseCsvRows(csvText: string): BulkEnrollRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: BulkEnrollRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });

    const age = parseInt(row["child_age"] ?? "", 10);
    if (!row["parent_email"] || isNaN(age)) continue;

    rows.push({
      parent_name: row["parent_name"] ?? "",
      parent_email: row["parent_email"].toLowerCase(),
      child_name: row["child_name"] ?? "",
      child_age: age,
    });
  }

  return rows;
}

async function processOneRow(orgId: string, row: BulkEnrollRow): Promise<void> {
  const now = new Date();
  const trialEnd = addDays(now, 30);
  const ageBand = `${row.child_age}-${row.child_age + 1}`;

  // 1. Upsert ParentAccount
  let parent = await prisma.parentAccount.findUnique({ where: { email: row.parent_email } });

  if (!parent) {
    const randomPassword = Math.random().toString(36).slice(-12);
    const passwordHash = hashSync(randomPassword, 10);

    parent = await prisma.$transaction(async (tx) => {
      const created = await tx.parentAccount.create({
        data: {
          email: row.parent_email,
          passwordHash,
          displayName: row.parent_name || undefined,
        },
      });
      await tx.parentPreferences.create({
        data: { parentId: created.id },
      });
      return created;
    });
  }

  // 2. Create ChildProfile if not exists
  const existingChild = await prisma.childProfile.findFirst({
    where: { parentId: parent.id, nickname: row.child_name },
  });
  if (!existingChild) {
    await prisma.childProfile.create({
      data: {
        parentId: parent.id,
        nickname: row.child_name,
        ageBand,
      },
    });
  }

  // 3. Ensure Subscription (TRIAL / TRIALING)
  const existingSub = await prisma.subscription.findUnique({ where: { parentId: parent.id } });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        parentId: parent.id,
        planCode: PlanCode.TRIAL,
        status: SubscriptionStatus.TRIALING,
        childProfileLimit: 3,
        caregiverLimit: 2,
        portfolioRetentionMaxDays: 90,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      },
    });
  }

  // 4. Add as STUDENT_PARENT
  await addMember(orgId, parent.id, OrgRole.STUDENT_PARENT);

  // 5. Enqueue welcome lifecycle email
  await enqueueLifecycleEmail(parent.id, LifecycleEmailType.TRIAL_WELCOME);
}

export async function processBulkEnrollRows(
  orgId: string,
  rows: BulkEnrollRow[],
): Promise<BulkEnrollResult> {
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      await processOneRow(orgId, row);
      succeeded++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${row.parent_email}: ${msg}`);
    }
  }

  return { succeeded, failed, errors };
}
