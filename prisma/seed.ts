import "dotenv/config";
import {
  AgeGroup,
  BlogPostStatus,
  BlogPostType,
  Prisma,
  PrismaClient,
  TrackCode,
  PlanCode,
  SubscriptionStatus,
  OfferingKind,
} from "@prisma/client";
import { addDays } from "date-fns";
import { hashSync } from "bcryptjs";
import type { ActivitySpec } from "../src/modules/content/activity-types";
import { SEED_OFFERINGS } from "../src/modules/entitlement/offering-types";

const prisma = new PrismaClient();
const shouldSeedBlogDemoContent = process.env.SEED_BLOG_DEMO_CONTENT === "true";

function toActivitySpecJson(spec: ActivitySpec): Prisma.InputJsonValue {
  return spec as unknown as Prisma.InputJsonValue;
}

function readingTimeFromMarkdown(markdown: string) {
  const words = markdown
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return Math.max(1, Math.ceil(words / 200));
}

async function seedAdminSecuritySettings() {
  const defaultRateLimitPolicies: Prisma.InputJsonValue = {};
  const defaultSecurityControls: Prisma.InputJsonValue = {
    ddosMode: "normal",
    globalLimitMultiplier: 1,
    blockedIpCidrs: [],
    readinessAllowlistCidrs: [],
    parentEmailVerificationRequired: true,
    parentEmailVerificationTokenTtlMinutes: 15,
  };

  await prisma.adminSecuritySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      rateLimitPolicies: defaultRateLimitPolicies,
      securityControls: defaultSecurityControls,
      updatedByActorId: "prisma-seed",
    },
  });
}

async function seedContent() {
  type LessonSeed = {
    orderNo: number;
    slug: string;
    title: string;
    objective: string;
    estimatedMinutes: number;
    trialEnabled: boolean;
    activity: {
      prompt: string;
      spec: ActivitySpec;
    };
  };

  type UnitSeed = {
    orderNo: number;
    title: string;
    lessons: LessonSeed[];
  };

  type TrackSeed = {
    code: TrackCode;
    title: string;
    level: {
      orderNo: number;
      title: string;
      units: UnitSeed[];
    };
  };

  const englishUnits: UnitSeed[] = [
    {
      orderNo: 1,
      title: "Greetings & Family",
      lessons: [
        {
          orderNo: 1,
          slug: "english-l1-u1-hello-bye-bye",
          title: "Hello & Bye Bye",
          objective: "Children recognize greetings and goodbyes in English in familiar contexts.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Choose the appropriate greeting",
            spec: {
              type: "MULTIPLE_CHOICE",
              question: "Listen and choose correctly: What do we say when we meet a friend?",
              options: ["Hello!", "Goodbye!", "Thank you!", "Sorry!"],
              correctIndex: 0,
              explanation: '"Hello" means "Hello" - used when meeting a friend!',
            },
          },
        },
        {
          orderNo: 2,
          slug: "english-l1-u1-mum-dad-baby",
          title: "Mum, Dad, Baby",
          objective: "The child correctly calls close family members using basic English words.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Match the English word with the Vietnamese meaning",
            spec: {
              type: "MATCH_PAIRS",
              pairs: [
                { left: "Mum", right: "Mom" },
                { left: "Dad", right: "Dad" },
                { left: "Baby", right: "Baby" },
              ],
            },
          },
        },
        {
          orderNo: 3,
          slug: "english-l1-u1-how-are-you",
          title: "How Are You?",
          objective: "The child initially uses a simple question form in communication.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Fill in the missing word in the question",
            spec: {
              type: "FILL_BLANK",
              sentence: "How ___ you?",
              answer: "are",
              hint: "Fill in the blanks to complete the question!",
            },
          },
        },
      ],
    },
    {
      orderNo: 2,
      title: "Color & Shape",
      lessons: [
        {
          orderNo: 1,
          slug: "english-l1-u2-red-blue-yellow",
          title: "Red, Blue, Yellow",
          objective: "Baby recognizes three basic colors in daily activities.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Choose the correct color",
            spec: {
              type: "MULTIPLE_CHOICE",
              question: "What color is the sky?",
              options: ["Red", "Blue", "Yellow", "Green"],
              correctIndex: 1,
              explanation: 'The sky is blue - "Blue" means blue!',
            },
          },
        },
        {
          orderNo: 2,
          slug: "english-l1-u2-circle-and-square",
          title: "Circle and Square",
          objective: "Children distinguish between two basic shapes: circle and square.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Match the shape name with the shape",
            spec: {
              type: "MATCH_PAIRS",
              pairs: [
                { left: "Circle", right: "Circle" },
                { left: "Square", right: "Square" },
                { left: "Triangle", right: "Triangle" },
              ],
            },
          },
        },
        {
          orderNo: 3,
          slug: "english-l1-u2-big-and-small",
          title: "Big and Small",
          objective: "The child understands and can use pairs of words indicating large - small sizes.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Right or wrong about size",
            spec: {
              type: "TRUE_FALSE",
              statement: '"Big" means "big/large".',
              isTrue: true,
              explanation: "Correct! Big is used to describe large sized objects.",
            },
          },
        },
      ],
    },
  ];

  const mathUnits: UnitSeed[] = [
    {
      orderNo: 1,
      title: "Count 1-5",
      lessons: [
        {
          orderNo: 1,
          slug: "math-l1-u1-count-to-3",
          title: "Count to 3",
          objective: "The child arranges the numbers from 1 to 3 in the correct order.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Arrange the numbers in the correct order",
            spec: {
              type: "SORT_ORDER",
              items: ["Ba", "One", "Hai"],
              correctOrder: [1, 2, 0],
            },
          },
        },
        {
          orderNo: 2,
          slug: "math-l1-u1-count-to-5",
          title: "Count to 5",
          objective: "Children count and arrange the correct number sequence from 1 to 5.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Arrange numbers 1 to 5",
            spec: {
              type: "SORT_ORDER",
              items: ["Five", "Hai", "Four", "One", "Ba"],
              correctOrder: [3, 1, 4, 2, 0],
            },
          },
        },
        {
          orderNo: 3,
          slug: "math-l1-u1-which-is-more",
          title: "Which is More?",
          objective: "Children compare quantities and recognize concepts more.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "True or false about comparing quantities",
            spec: {
              type: "TRUE_FALSE",
              statement: "5 is more than 3",
              isTrue: true,
              explanation: "Yes! 5 > 3. Five candies is more than three candies!",
            },
          },
        },
      ],
    },
    {
      orderNo: 2,
      title: "Shapes & Space",
      lessons: [
        {
          orderNo: 1,
          slug: "math-l1-u2-hinh-tron-va-hinh-vuong",
          title: "Circle & Square",
          objective: "Baby recognizes basic shapes in the surrounding environment.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Match the picture name with a real-life example",
            spec: {
              type: "MATCH_PAIRS",
              pairs: [
                { left: "Circle", right: "Ball" },
                { left: "Square", right: "Window box" },
                { left: "Rectangle", right: "The book" },
              ],
            },
          },
        },
        {
          orderNo: 2,
          slug: "math-l1-u2-lon-hon-va-nho-hon",
          title: "Bigger & Smaller",
          objective: "Children compare the size of objects using the concept pair big - small.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Choose a larger object",
            spec: {
              type: "MULTIPLE_CHOICE",
              question: "Of the following two objects, which is larger?",
              options: ["Marbles", "Ball", "Eraser", "Sticker"],
              correctIndex: 1,
              explanation: "Balls are bigger than marbles, erasers, and stickers.",
            },
          },
        },
        {
          orderNo: 3,
          slug: "math-l1-u2-cao-hon-va-ngan-hon",
          title: "Taller & Shorter",
          objective: "Children recognize simple height and length comparisons.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "True or false about height comparison",
            spec: {
              type: "TRUE_FALSE",
              statement: "The tree is taller than a pencil",
              isTrue: true,
              explanation: "Yes! Trees are usually much taller than pencils.",
            },
          },
        },
      ],
    },
  ];

  const tracks: TrackSeed[] = [
    {
      code: TrackCode.ENGLISH,
      title: "English Journey",
      level: {
        orderNo: 1,
        title: "First Word Discovery",
        units: englishUnits,
      },
    },
    {
      code: TrackCode.MATH,
      title: "Math Journey",
      level: {
        orderNo: 1,
        title: "Magic Numbers",
        units: mathUnits,
      },
    },
  ];

  for (const trackSeed of tracks) {
    const track = await prisma.track.upsert({
      where: { code: trackSeed.code },
      update: { title: trackSeed.title, isTrialEnabled: true },
      create: { code: trackSeed.code, title: trackSeed.title, isTrialEnabled: true },
    });

    const level = await prisma.level.upsert({
      where: { trackId_orderNo: { trackId: track.id, orderNo: trackSeed.level.orderNo } },
      update: { title: trackSeed.level.title },
      create: {
        trackId: track.id,
        orderNo: trackSeed.level.orderNo,
        title: trackSeed.level.title,
      },
    });

    for (const unitSeed of trackSeed.level.units) {
      const unit = await prisma.unit.upsert({
        where: { levelId_orderNo: { levelId: level.id, orderNo: unitSeed.orderNo } },
        update: { title: unitSeed.title },
        create: {
          levelId: level.id,
          orderNo: unitSeed.orderNo,
          title: unitSeed.title,
        },
      });

      for (const lessonSeed of unitSeed.lessons) {
        const offlineCardMarkdown = [
          `## ${lessonSeed.title}`,
          "",
          `**Goal:**${lessonSeed.objective}`,
          "",
          "**Offline activities:**",
          "- Use picture cards or real objects",
          "- Repeat 3 times with your child",
          "- Praise your child when they answer correctly",
        ].join("\n");

        const parentScriptMarkdown = [
          "## Instructions for Parents",
          "",
          "1. Sit with your child, turn off the TV/phone",
          `2. Watch the video article${lessonSeed.title}with my child`,
          '3. Ask again: "What did you just learn?"',
          "4. Do offline activities with your child",
        ].join("\n");

        const lesson = await prisma.lesson.upsert({
          where: {
            unitId_orderNo: {
              unitId: unit.id,
              orderNo: lessonSeed.orderNo,
            },
          },
          update: {
            slug: lessonSeed.slug,
            title: lessonSeed.title,
            objective: lessonSeed.objective,
            estimatedMinutes: lessonSeed.estimatedMinutes,
            trialEnabled: lessonSeed.trialEnabled,
            offlineCardMarkdown,
            parentScriptMarkdown,
          },
          create: {
            unitId: unit.id,
            orderNo: lessonSeed.orderNo,
            slug: lessonSeed.slug,
            title: lessonSeed.title,
            objective: lessonSeed.objective,
            estimatedMinutes: lessonSeed.estimatedMinutes,
            trialEnabled: lessonSeed.trialEnabled,
            offlineCardMarkdown,
            parentScriptMarkdown,
          },
        });

        const activityId = `activity-${trackSeed.code.toLowerCase()}-l1-u${unitSeed.orderNo}-lesson-${lessonSeed.orderNo}`;

        await prisma.activity.upsert({
          where: { id: activityId },
          update: {
            lessonId: lesson.id,
            type: lessonSeed.activity.spec.type,
            prompt: lessonSeed.activity.prompt,
            spec: toActivitySpecJson(lessonSeed.activity.spec),
            passCriteria: 80,
          },
          create: {
            id: activityId,
            lessonId: lesson.id,
            type: lessonSeed.activity.spec.type,
            prompt: lessonSeed.activity.prompt,
            spec: toActivitySpecJson(lessonSeed.activity.spec),
            passCriteria: 80,
          },
        });
      }
    }
  }
}

async function seedDemoParent() {
  const email = (process.env.SEED_PARENT_EMAIL ?? "demo.parent@tinygeniushubvn.tech").toLowerCase();
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
}

async function seedBlog() {
  console.log("Seeding blog data...");

  const categories = [
    { slug: "phat-trien-tre", nameVi: "Child Development", emoji: "🌱", color: "#10b981", orderNo: 1 },
    { slug: "phuong-phap-hoc", nameVi: "Learning Methods", emoji: "📚", color: "#3b82f6", orderNo: 2 },
    { slug: "tieng-anh-som", nameVi: "English for Children", emoji: "🌏", color: "#8b5cf6", orderNo: 3 },
    { slug: "toan-tu-duy", nameVi: "Math Thinking", emoji: "🔢", color: "#f59e0b", orderNo: 4 },
    { slug: "dinh-huong-phu-huynh", nameVi: "Parental Instructions", emoji: "👪", color: "#ef4444", orderNo: 5 },
    { slug: "cong-nghe-giao-duc", nameVi: "Educational Technology", emoji: "💻", color: "#06b6d4", orderNo: 6 },
    { slug: "suc-khoe-tam-than", nameVi: "Health and Balance", emoji: "💙", color: "#ec4899", orderNo: 7 },
    { slug: "thanh-tich-hoc-tap", nameVi: "Success Story", emoji: "⭐", color: "#84cc16", orderNo: 8 },
  ];

  for (const cat of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: { ...cat, active: true },
    });
  }

  await prisma.blogAuthor.upsert({
    where: { slug: "ban-bien-tap" },
    update: {
      displayName: "Editorial Board",
      role: "TinyGenius Hub Editor",
      active: true,
    },
    create: {
      slug: "ban-bien-tap",
      displayName: "Editorial Board",
      role: "TinyGenius Hub Editor",
      active: true,
    },
  });

  await prisma.blogAuthor.upsert({
    where: { slug: "chuyen-gia-giao-duc" },
    update: {
      displayName: "Education Expert",
      role: "Educational Psychologist",
      active: true,
    },
    create: {
      slug: "chuyen-gia-giao-duc",
      displayName: "Education Expert",
      role: "Educational Psychologist",
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

  if (!shouldSeedBlogDemoContent) {
    console.log("Blog taxonomy seeded. Demo blog posts disabled (set SEED_BLOG_DEMO_CONTENT=true to enable).");
    return;
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
      titleVi: "5 tips for learning English at home for 3-5 year olds",
      excerptVi:
        "Short 5-10 minute activities help children become familiar with English naturally every day.",
      contentMarkdown: `## Start with small habits

Take the first 5 minutes of the day to listen and repeat 3 new words.

## Learn through songs

Turn on an English children's song and let your baby move to the rhythm.

## Attach words to objects

Label vocabulary on household familiar items.

## Tell a comic story

Read short stories with illustrations and ask simple questions.

## Praise at the right time

Recognize your child's efforts to maintain learning motivation.`,
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
      titleVi: "How children develop mathematical thinking",
      excerptVi:
        "Mathematical thinking is not only about quick calculations but also about solving problems in everyday life.",
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
      titleVi: "The most effective early education method for children in 2026",
      excerptVi:
        "Montessori, STEAM or Waldorf? What approach do educational experts recommend that is most suitable for Vietnamese children in 2026?",
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
      update: {
        ...post,
        contentHtml: null,
        readingTimeMin: readingTimeFromMarkdown(post.contentMarkdown),
      },
      create: {
        ...post,
        contentHtml: null,
        readingTimeMin: readingTimeFromMarkdown(post.contentMarkdown),
      },
    });
  }

  console.log("Blog seed completed: 8 categories, 2 authors, 10 tags, 3 posts.");
}

async function seedOfferings() {
  const recurringPriceId =
    process.env.STRIPE_PRICE_ID_YEARLY || process.env.STRIPE_PRICE_ID_MONTHLY || null;

  for (const offering of SEED_OFFERINGS) {
    const stripePriceId = offering.kind === "RECURRING" ? recurringPriceId : null;
    await prisma.offering.upsert({
      where: { code: offering.code },
      update: {
        kind: offering.kind as OfferingKind,
        catalogKey: offering.catalogKey,
        active: true,
        ...(stripePriceId ? { stripePriceId } : {}),
      },
      create: {
        code: offering.code,
        kind: offering.kind as OfferingKind,
        catalogKey: offering.catalogKey,
        active: true,
        stripePriceId,
      },
    });
  }
}

async function main() {
  await seedAdminSecuritySettings();
  await seedOfferings();
  await seedContent();
  await seedDemoParent();
  await seedBlog();
  await seedBlogArticles();
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


async function seedBlogArticles() {
  if (!shouldSeedBlogDemoContent) {
    console.log("seedBlogArticles skipped (SEED_BLOG_DEMO_CONTENT=false).");
    return;
  }

  console.log("Seeding 10 SEO blog articles...");

  // Resolve categories and author
  const catTiengAnh = await prisma.blogCategory.findUnique({ where: { slug: "tieng-anh-som" } });
  const catToanTuDuy = await prisma.blogCategory.findUnique({ where: { slug: "toan-tu-duy" } });
  const catCongNghe = await prisma.blogCategory.findUnique({ where: { slug: "cong-nghe-giao-duc" } });
  const catPhatTrien = await prisma.blogCategory.findUnique({ where: { slug: "phat-trien-tre" } });
  const author = await prisma.blogAuthor.findUnique({ where: { slug: "ban-bien-tap" } });

  if (!catTiengAnh || !catToanTuDuy || !catCongNghe || !catPhatTrien || !author) {
    console.warn("Required categories or author not found. Run seedBlog() first.");
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");

  const articlesDir = path.join(
    __dirname,
    "../plans/_archive/260225-1017-product-marketing-roadmap/research/blog-articles"
  );

  function readArticle(filename: string): string {
    return fs.readFileSync(path.join(articlesDir, filename), "utf-8");
  }

  /**
   * Extract first H1 title from markdown (# Title line)
   */
  function extractTitle(md: string): string {
    const match = md.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : "";
  }

  /**
   * Extract first real paragraph after the metadata block (after ---)
   */
  function extractExcerpt(md: string, maxLen = 200): string {
    // Skip metadata lines (lines starting with ** or empty) until we find prose
    const lines = md.split("\n");
    let afterMeta = false;
    const paraLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!afterMeta) {
        if (trimmed === "---") { afterMeta = true; }
        continue;
      }
      if (trimmed.startsWith("#") || trimmed.startsWith("**") || trimmed === "") {
        if (paraLines.length > 0) break;
        continue;
      }
      paraLines.push(trimmed);
    }
    const text = paraLines.join(" ");
    return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
  }

  type ArticleDef = {
    slug: string;
    filename: string;
    categoryId: string;
  };

  const articles: ArticleDef[] = [
    // Early English (01, 02, 03)
    { slug: "top-7-app-tieng-anh-cho-be", filename: "01-top-7-app-tieng-anh.md", categoryId: catTiengAnh.id },
    { slug: "day-tieng-anh-cho-be-tai-nha", filename: "02-day-tieng-anh-tai-nha.md", categoryId: catTiengAnh.id },
    { slug: "bai-hat-tieng-anh-cho-be", filename: "03-bai-hat-tieng-anh-cho-be.md", categoryId: catTiengAnh.id },
    // Mental Math (04, 05, 06)
    { slug: "day-toan-cho-tre-3-tuoi", filename: "04-day-toan-cho-tre-3-tuoi.md", categoryId: catToanTuDuy.id },
    { slug: "tro-choi-hoc-toan-cho-be", filename: "05-tro-choi-hoc-toan-cho-be.md", categoryId: catToanTuDuy.id },
    { slug: "app-hoc-toan-cho-be", filename: "06-app-hoc-toan-cho-be.md", categoryId: catToanTuDuy.id },
    // Educational Technology (07, 08)
    { slug: "ung-dung-giao-duc-cho-be", filename: "07-ung-dung-giao-duc-cho-be.md", categoryId: catCongNghe.id },
    { slug: "app-hoc-cho-be-3-tuoi", filename: "08-app-hoc-cho-be-3-tuoi.md", categoryId: catCongNghe.id },
    // Youth development (09, 10)
    { slug: "giao-duc-som-cho-tre", filename: "09-giao-duc-som-cho-tre.md", categoryId: catPhatTrien.id },
    { slug: "phuong-phap-giao-duc-som", filename: "10-phuong-phap-giao-duc-som.md", categoryId: catPhatTrien.id },
  ];

  for (const art of articles) {
    const contentMarkdown = readArticle(art.filename);
    const titleVi = extractTitle(contentMarkdown);
    const excerptVi = extractExcerpt(contentMarkdown);

    await prisma.blogPost.upsert({
      where: { slug: art.slug },
      update: {
        titleVi,
        excerptVi,
        contentMarkdown,
        contentHtml: null,
        type: BlogPostType.ARTICLE,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: art.categoryId,
        ageGroup: AgeGroup.AGE_3_5,
        readingTimeMin: readingTimeFromMarkdown(contentMarkdown),
        isIndexed: true,
        isFeatured: false,
        metaTitleVi: titleVi,
        metaDescVi: excerptVi,
      },
      create: {
        slug: art.slug,
        titleVi,
        excerptVi,
        contentMarkdown,
        contentHtml: null,
        type: BlogPostType.ARTICLE,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: art.categoryId,
        ageGroup: AgeGroup.AGE_3_5,
        readingTimeMin: readingTimeFromMarkdown(contentMarkdown),
        isIndexed: true,
        isFeatured: false,
        isPinned: false,
        coAuthorIds: [],
        metaTitleVi: titleVi,
        metaDescVi: excerptVi,
      },
    });

    console.log(`  + ${art.slug}`);
  }

  console.log("seedBlogArticles: 10 articles upserted.");
}
