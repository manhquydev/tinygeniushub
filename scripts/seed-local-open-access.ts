import "dotenv/config";
import {
  PlanCode,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
  TrackCode,
} from "@prisma/client";
import { addDays } from "date-fns";
import { hashSync } from "bcryptjs";
import {
  grantCourseOfferingInTx,
  grantPlanOfferingInTx,
} from "../src/modules/entitlement/grant-from-billing";

const prisma = new PrismaClient();

async function upsertLocalParent(input: {
  email: string;
  password: string;
  displayName: string;
  nickname: string;
}) {
  const email = input.email.toLowerCase();
  const parent = await prisma.parentAccount.upsert({
    where: { email },
    update: {
      passwordHash: hashSync(input.password, 12),
      displayName: input.displayName,
    },
    create: {
      email,
      passwordHash: hashSync(input.password, 12),
      displayName: input.displayName,
    },
  });

  await prisma.parentPreferences.upsert({
    where: { parentId: parent.id },
    update: {},
    create: {
      parentId: parent.id,
      weeklyReportChannel: "IN_APP_AND_EMAIL",
      weeklyReportEmailEnabled: true,
      timezone: "Asia/Bangkok",
    },
  });

  const periodStart = new Date();
  const periodEnd = addDays(periodStart, 365);

  await prisma.subscription.upsert({
    where: { parentId: parent.id },
    update: {
      planCode: PlanCode.YEARLY_FAMILY_PLUS,
      status: SubscriptionStatus.ACTIVE_FAMILYPLUS,
      childProfileLimit: 5,
      caregiverLimit: 4,
      portfolioRetentionMaxDays: 365,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    create: {
      parentId: parent.id,
      planCode: PlanCode.YEARLY_FAMILY_PLUS,
      status: SubscriptionStatus.ACTIVE_FAMILYPLUS,
      childProfileLimit: 5,
      caregiverLimit: 4,
      portfolioRetentionMaxDays: 365,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      autoRenew: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await grantPlanOfferingInTx(tx, {
      parentId: parent.id,
      planCode: PlanCode.YEARLY_FAMILY_PLUS,
      validFrom: periodStart,
      validUntil: periodEnd,
    });
  });

  const existingChild = await prisma.childProfile.findFirst({
    where: { parentId: parent.id },
    select: { id: true },
  });
  if (!existingChild) {
    await prisma.childProfile.create({
      data: {
        parentId: parent.id,
        nickname: input.nickname,
        ageBand: "4-5",
      },
    });
  }

  await prisma.user.upsert({
    where: { id: parent.id },
    update: {
      email,
      name: parent.displayName ?? email,
      parentId: parent.id,
      emailVerified: true,
    },
    create: {
      id: parent.id,
      email,
      name: parent.displayName ?? email,
      emailVerified: true,
      parentId: parent.id,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: parent.id,
      },
    },
    update: {
      userId: parent.id,
      password: parent.passwordHash,
    },
    create: {
      id: `credential-${parent.id}`,
      providerId: "credential",
      accountId: parent.id,
      userId: parent.id,
      password: parent.passwordHash,
    },
  });

  return parent;
}

async function ensurePublishedTrackCourses() {
  const tracks = await prisma.track.findMany({
    where: { code: { in: [TrackCode.ENGLISH, TrackCode.MATH] } },
  });

  for (const track of tracks) {
    const slug = `seed-${track.code.toLowerCase()}`;
    const title = track.code === TrackCode.ENGLISH ? "English Track (free)" : "Math Track (free)";
    const course = await prisma.course.upsert({
      where: { slug },
      update: {
        title,
        description: `Local open-access ${track.code} course.`,
        priceVnd: 0,
        listPriceVnd: 0,
        salePriceVnd: 0,
        durationDays: 365,
        isPublished: true,
      },
      create: {
        slug,
        title,
        description: `Local open-access ${track.code} course.`,
        priceVnd: 0,
        listPriceVnd: 0,
        salePriceVnd: 0,
        durationDays: 365,
        isPublished: true,
      },
    });

    const lessons = await prisma.lesson.findMany({
      where: { unit: { level: { trackId: track.id } } },
      orderBy: { orderNo: "asc" },
      select: { id: true, orderNo: true },
    });
    for (const lesson of lessons) {
      await prisma.courseLesson.upsert({
        where: { courseId_lessonId: { courseId: course.id, lessonId: lesson.id } },
        update: { orderNo: lesson.orderNo },
        create: { courseId: course.id, lessonId: lesson.id, orderNo: lesson.orderNo },
      });
    }
  }
}

async function main() {
  const settings = await prisma.adminSecuritySettings.findUnique({ where: { id: "default" } });
  const controls = (settings?.securityControls ?? {}) as Record<string, unknown>;
  if (settings) {
    await prisma.adminSecuritySettings.update({
      where: { id: "default" },
      data: {
        securityControls: {
          ...controls,
          parentEmailVerificationRequired: false,
        } as Prisma.InputJsonValue,
      },
    });
  }

  await ensurePublishedTrackCourses();

  await prisma.course.updateMany({
    data: {
      priceVnd: 0,
      listPriceVnd: 0,
      salePriceVnd: 0,
      isPublished: true,
    },
  });

  const tester = await upsertLocalParent({
    email: process.env.SEED_TESTER_EMAIL ?? "tester@tinygeniushub.local",
    password: process.env.SEED_TESTER_PASSWORD ?? "TestPass123!",
    displayName: "Tester",
    nickname: "Bé Test",
  });

  const demoEmail = (process.env.SEED_PARENT_EMAIL ?? "demo.parent@tinygeniushubvn.tech").toLowerCase();
  const parents = await prisma.parentAccount.findMany({
    where: { email: { in: [tester.email, demoEmail] } },
    select: { id: true, email: true },
  });
  const courses = await prisma.course.findMany({ select: { id: true, slug: true, priceVnd: true, isPublished: true } });

  await prisma.$transaction(async (tx) => {
    for (const parent of parents) {
      for (const course of courses) {
        await grantCourseOfferingInTx(tx, { parentId: parent.id, courseId: course.id });
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        tester: tester.email,
        parents: parents.map((p) => p.email),
        courses: courses.map((c) => ({ slug: c.slug, priceVnd: c.priceVnd, isPublished: c.isPublished })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
