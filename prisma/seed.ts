import "dotenv/config";
import {
  PrismaClient,
  TrackCode,
  PlanCode,
  SubscriptionStatus,
} from "@prisma/client";
import { addDays } from "date-fns";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function seedContent() {
  const englishTrack = await prisma.track.upsert({
    where: { code: TrackCode.ENGLISH },
    update: { title: "English Journey", isTrialEnabled: true },
    create: { code: TrackCode.ENGLISH, title: "English Journey", isTrialEnabled: true },
  });

  const mathTrack = await prisma.track.upsert({
    where: { code: TrackCode.MATH },
    update: { title: "Math Journey", isTrialEnabled: true },
    create: { code: TrackCode.MATH, title: "Math Journey", isTrialEnabled: true },
  });

  const englishLevel1 = await prisma.level.upsert({
    where: { trackId_orderNo: { trackId: englishTrack.id, orderNo: 1 } },
    update: { title: "English Level 1" },
    create: { trackId: englishTrack.id, orderNo: 1, title: "English Level 1" },
  });

  const mathLevel1 = await prisma.level.upsert({
    where: { trackId_orderNo: { trackId: mathTrack.id, orderNo: 1 } },
    update: { title: "Math Level 1" },
    create: { trackId: mathTrack.id, orderNo: 1, title: "Math Level 1" },
  });

  const englishUnit = await prisma.unit.upsert({
    where: { levelId_orderNo: { levelId: englishLevel1.id, orderNo: 1 } },
    update: { title: "Hello Words" },
    create: { levelId: englishLevel1.id, orderNo: 1, title: "Hello Words" },
  });

  const mathUnit = await prisma.unit.upsert({
    where: { levelId_orderNo: { levelId: mathLevel1.id, orderNo: 1 } },
    update: { title: "Numbers 1-5" },
    create: { levelId: mathLevel1.id, orderNo: 1, title: "Numbers 1-5" },
  });

  const lessons = [
    {
      unitId: englishUnit.id,
      orderNo: 1,
      slug: "english-l1-u1-lesson-1",
      title: "Hello and Bye",
      objective: "Child recognizes hello and bye",
      estimatedMinutes: 15,
      trialEnabled: true,
    },
    {
      unitId: englishUnit.id,
      orderNo: 2,
      slug: "english-l1-u1-lesson-2",
      title: "Family Words",
      objective: "Child says mom and dad",
      estimatedMinutes: 15,
      trialEnabled: true,
    },
    {
      unitId: mathUnit.id,
      orderNo: 1,
      slug: "math-l1-u1-lesson-1",
      title: "Count to 3",
      objective: "Child counts from one to three",
      estimatedMinutes: 15,
      trialEnabled: true,
    },
    {
      unitId: mathUnit.id,
      orderNo: 2,
      slug: "math-l1-u1-lesson-2",
      title: "Count to 5",
      objective: "Child counts from one to five",
      estimatedMinutes: 15,
      trialEnabled: true,
    },
  ];

  for (const lesson of lessons) {
    const savedLesson = await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      update: lesson,
      create: lesson,
    });

    await prisma.activity.upsert({
      where: { id: `activity-${savedLesson.slug}` },
      update: {
        prompt: "Tap the correct answer",
        spec: {
          attempts: 2,
          questions: 3,
          mode: "tap_choose",
        },
      },
      create: {
        id: `activity-${savedLesson.slug}`,
        lessonId: savedLesson.id,
        type: "tap_choose",
        prompt: "Tap the correct answer",
        spec: {
          attempts: 2,
          questions: 3,
          mode: "tap_choose",
        },
        passCriteria: 80,
      },
    });
  }
}

async function seedDemoParent() {
  const email = (process.env.SEED_PARENT_EMAIL ?? "demo.parent@cungcontuhoc.vn").toLowerCase();
  const password = process.env.SEED_PARENT_PASSWORD ?? "DemoPass123!";

  const parent = await prisma.parentAccount.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashSync(password, 12),
      displayName: "Demo Parent",
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

  await prisma.subscription.upsert({
    where: { parentId: parent.id },
    update: {
      planCode: PlanCode.TRIAL,
      status: SubscriptionStatus.TRIALING,
      childProfileLimit: 3,
      caregiverLimit: 2,
      portfolioRetentionMaxDays: 90,
    },
    create: {
      parentId: parent.id,
      planCode: PlanCode.TRIAL,
      status: SubscriptionStatus.TRIALING,
      childProfileLimit: 3,
      caregiverLimit: 2,
      portfolioRetentionMaxDays: 90,
      currentPeriodEnd: addDays(new Date(), 7),
      autoRenew: true,
    },
  });

  await prisma.user.upsert({
    where: { id: parent.id },
    update: {
      email,
      name: parent.displayName ?? email,
      parentId: parent.id,
    },
    create: {
      id: parent.id,
      email,
      name: parent.displayName ?? email,
      emailVerified: false,
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
}

async function main() {
  await seedContent();
  await seedDemoParent();
  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
