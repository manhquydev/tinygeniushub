import "dotenv/config";
import {
  AgeGroup,
  BlogPostStatus,
  BlogPostType,
  PrismaClient,
  TrackCode,
  PlanCode,
  SubscriptionStatus,
} from "@prisma/client";
import { addDays } from "date-fns";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

function readingTimeFromMarkdown(markdown: string) {
  const words = markdown
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return Math.max(1, Math.ceil(words / 200));
}

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

async function seedBlog() {
  console.log("Seeding blog data...");

  const categories = [
    { slug: "phat-trien-tre", nameVi: "Phat Trien Tre Em", emoji: "🌱", color: "#10b981", orderNo: 1 },
    { slug: "phuong-phap-hoc", nameVi: "Phuong Phap Hoc Tap", emoji: "📚", color: "#3b82f6", orderNo: 2 },
    { slug: "tieng-anh-som", nameVi: "Tieng Anh Cho Tre", emoji: "🌏", color: "#8b5cf6", orderNo: 3 },
    { slug: "toan-tu-duy", nameVi: "Toan Tu Duy", emoji: "🔢", color: "#f59e0b", orderNo: 4 },
    { slug: "dinh-huong-phu-huynh", nameVi: "Huong Dan Phu Huynh", emoji: "👪", color: "#ef4444", orderNo: 5 },
    { slug: "cong-nghe-giao-duc", nameVi: "Cong Nghe Giao Duc", emoji: "💻", color: "#06b6d4", orderNo: 6 },
    { slug: "suc-khoe-tam-than", nameVi: "Suc Khoe va Can Bang", emoji: "💙", color: "#ec4899", orderNo: 7 },
    { slug: "thanh-tich-hoc-tap", nameVi: "Cau Chuyen Thanh Cong", emoji: "⭐", color: "#84cc16", orderNo: 8 },
  ];

  for (const cat of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, active: true },
    });
  }

  await prisma.blogAuthor.upsert({
    where: { slug: "ban-bien-tap" },
    update: {},
    create: {
      slug: "ban-bien-tap",
      displayName: "Ban Bien Tap",
      role: "Bien tap vien CungConTuHoc",
      active: true,
    },
  });

  await prisma.blogAuthor.upsert({
    where: { slug: "chuyen-gia-giao-duc" },
    update: {},
    create: {
      slug: "chuyen-gia-giao-duc",
      displayName: "Chuyen Gia Giao Duc",
      role: "Chuyen gia Tam ly Giao duc",
      active: true,
    },
  });

  const tagSlugs = [
    "tieng-anh",
    "toan-hoc",
    "phat-trien-ngon-ngu",
    "ky-nang-song",
    "am-nhac",
    "doc-sach",
    "nuoi-day-con",
    "stem",
    "hoc-qua-choi",
    "tu-duy-sang-tao",
  ];

  for (const slug of tagSlugs) {
    await prisma.blogTag.upsert({
      where: { slug },
      update: {},
      create: { slug, nameVi: slug.replace(/-/g, " ") },
    });
  }

  const tiengAnh = await prisma.blogCategory.findUnique({ where: { slug: "tieng-anh-som" } });
  const toanTuDuy = await prisma.blogCategory.findUnique({ where: { slug: "toan-tu-duy" } });
  const phuongPhap = await prisma.blogCategory.findUnique({ where: { slug: "phuong-phap-hoc" } });
  const author = await prisma.blogAuthor.findUnique({ where: { slug: "ban-bien-tap" } });

  if (!tiengAnh || !toanTuDuy || !phuongPhap || !author) {
    console.warn("Blog categories or author not found, skipping post seed.");
    return;
  }

  const posts = [
    {
      slug: "5-meo-hoc-tieng-anh-tai-nha",
      type: "TIP" as const,
      status: "PUBLISHED" as const,
      titleVi: "5 Meo Giup Con Hoc Tieng Anh Tai Nha Hieu Qua",
      excerptVi:
        "Phu huynh khong can la giao vien de giup con yeu tieng Anh. Kham pha 5 phuong phap don gian ma bat ky gia dinh nao cung co the ap dung ngay hom nay.",
      contentMarkdown: `# 5 Tips to Help Children Learn English at Home

## 1. Create an English Environment
Surround your child with English through songs, cartoons, and picture books every day.

## 2. Daily Practice (10-15 minutes)
Consistency beats intensity. Even 10 minutes a day makes a huge difference over months.

## 3. Make It Fun
Use games, songs, and interactive activities. Children learn best when they are enjoying themselves.

## 4. Use Technology Wisely
Apps like CungConTuHoc provide structured, game-based learning that keeps children engaged.

## 5. Be Patient and Celebrate Progress
Language learning takes time. Celebrate every new word and every small step forward.
`,
      categoryId: tiengAnh.id,
      ageGroup: "AGE_6_8" as const,
      readingTimeMin: 5,
      isFeatured: true,
      isIndexed: true,
      isPinned: false,
      authorId: author.id,
      coAuthorIds: [] as string[],
      publishedAt: new Date(),
    },
    {
      slug: "tre-hoc-toan-tu-duy-nhu-the-nao",
      type: "GUIDE" as const,
      status: "PUBLISHED" as const,
      titleVi: "Tre Em Phat Trien Tu Duy Toan Hoc Nhu The Nao",
      excerptVi:
        "Tu duy toan hoc khong chi la tinh toan nhanh. Day la cach giup tre phat trien kha nang giai quyet van de tu nhien nhat thong qua cuoc song hang ngay.",
      contentMarkdown: `# How Children Develop Mathematical Thinking

Mathematical thinking is about logic, patterns, and problem-solving not just arithmetic.

## What is Mathematical Thinking?
- Recognizing patterns in everyday life
- Breaking problems into manageable steps
- Using logic to reach conclusions
- Estimating and checking results

## Age-Appropriate Activities for 6-8 Year Olds
Use physical objects, board games, and real-life scenarios. Cooking together (measuring), shopping (counting change), and building blocks all develop mathematical intuition naturally.

## The Role of Play
Children learn math most effectively through play. Puzzle games, strategy board games, and building activities all develop mathematical thinking without the pressure of formal study.
`,
      categoryId: toanTuDuy.id,
      ageGroup: "AGE_6_8" as const,
      readingTimeMin: 4,
      isFeatured: false,
      isIndexed: true,
      isPinned: false,
      authorId: author.id,
      coAuthorIds: [] as string[],
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      slug: "phuong-phap-giao-duc-som-hieu-qua-2026",
      type: "ARTICLE" as const,
      status: "PUBLISHED" as const,
      titleVi: "Phuong Phap Giao Duc Som Hieu Qua Nhat Cho Tre 2026",
      excerptVi:
        "Montessori, STEAM, hay Waldorf? Cac chuyen gia giao duc khuyen nghi phuong phap nao phu hop nhat cho tre em Viet Nam trong nam 2026?",
      contentMarkdown: `# Most Effective Early Education Methods in 2026

Modern early childhood education combines proven methods with new research on how children learn.

## Montessori Principles
Child-led learning, hands-on materials, and mixed-age groups remain highly effective. Key principle: follow the child's natural curiosity.

## STEAM Integration
Science, Technology, Engineering, Art, and Math integrated from early childhood builds the skills children need for the future.

## Technology and Balance
Digital tools like CungConTuHoc provide structured, adaptive learning while maintaining the critical importance of physical play and real human connection.

## What Research Shows Works Best
The most effective early education balances structured learning with free play, and actively involves parents in the child's learning journey exactly what CungConTuHoc aims to support.
`,
      categoryId: phuongPhap.id,
      ageGroup: "AGE_3_5" as const,
      readingTimeMin: 6,
      isFeatured: false,
      isIndexed: true,
      isPinned: false,
      authorId: author.id,
      coAuthorIds: [] as string[],
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }

  console.log("Blog seed completed: 8 categories, 2 authors, 10 tags, 3 posts.");
}

async function main() {
  await seedContent();
  await seedDemoParent();
  await seedBlog();
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

