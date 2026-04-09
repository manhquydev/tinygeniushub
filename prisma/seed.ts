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
} from "@prisma/client";
import { addDays } from "date-fns";
import { hashSync } from "bcryptjs";
import type { ActivitySpec } from "../src/modules/content/activity-types";

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
      title: "Lời Chào & Gia Đình",
      lessons: [
        {
          orderNo: 1,
          slug: "english-l1-u1-hello-bye-bye",
          title: "Hello & Bye Bye",
          objective: "Bé nhận biết lời chào và tạm biệt bằng tiếng Anh trong ngữ cảnh quen thuộc.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Chọn câu chào phù hợp",
            spec: {
              type: "MULTIPLE_CHOICE",
              question: "Nghe và chọn đúng: Khi gặp bạn ta nói gì?",
              options: ["Hello!", "Goodbye!", "Thank you!", "Sorry!"],
              correctIndex: 0,
              explanation: '"Hello" có nghĩa là "Xin chào" - dùng khi gặp bạn!',
            },
          },
        },
        {
          orderNo: 2,
          slug: "english-l1-u1-mum-dad-baby",
          title: "Mum, Dad, Baby",
          objective: "Bé gọi đúng các thành viên gia đình gần gũi bằng từ tiếng Anh cơ bản.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Nối từ tiếng Anh với nghĩa tiếng Việt",
            spec: {
              type: "MATCH_PAIRS",
              pairs: [
                { left: "Mum", right: "Mẹ" },
                { left: "Dad", right: "Bố" },
                { left: "Baby", right: "Em bé" },
              ],
            },
          },
        },
        {
          orderNo: 3,
          slug: "english-l1-u1-how-are-you",
          title: "How Are You?",
          objective: "Bé bước đầu sử dụng mẫu câu hỏi thăm đơn giản trong giao tiếp.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Điền từ còn thiếu trong câu hỏi",
            spec: {
              type: "FILL_BLANK",
              sentence: "How ___ you?",
              answer: "are",
              hint: "Điền vào chỗ trống để hoàn thành câu hỏi!",
            },
          },
        },
      ],
    },
    {
      orderNo: 2,
      title: "Màu Sắc & Hình Dạng",
      lessons: [
        {
          orderNo: 1,
          slug: "english-l1-u2-red-blue-yellow",
          title: "Red, Blue, Yellow",
          objective: "Bé nhận diện ba màu cơ bản trong sinh hoạt hằng ngày.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Chọn màu đúng",
            spec: {
              type: "MULTIPLE_CHOICE",
              question: "Màu của bầu trời là màu gì?",
              options: ["Red", "Blue", "Yellow", "Green"],
              correctIndex: 1,
              explanation: 'Bầu trời màu xanh - "Blue" nghĩa là màu xanh dương!',
            },
          },
        },
        {
          orderNo: 2,
          slug: "english-l1-u2-circle-and-square",
          title: "Circle and Square",
          objective: "Bé phân biệt hai hình dạng cơ bản: hình tròn và hình vuông.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Nối tên hình với hình dạng",
            spec: {
              type: "MATCH_PAIRS",
              pairs: [
                { left: "Circle", right: "Hình tròn" },
                { left: "Square", right: "Hình vuông" },
                { left: "Triangle", right: "Hình tam giác" },
              ],
            },
          },
        },
        {
          orderNo: 3,
          slug: "english-l1-u2-big-and-small",
          title: "Big and Small",
          objective: "Bé hiểu và dùng được cặp từ chỉ kích thước lớn - nhỏ.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Đúng hay sai về kích thước",
            spec: {
              type: "TRUE_FALSE",
              statement: '"Big" nghĩa là "to/lớn".',
              isTrue: true,
              explanation: "Đúng! Big dùng để mô tả đồ vật có kích thước lớn.",
            },
          },
        },
      ],
    },
  ];

  const mathUnits: UnitSeed[] = [
    {
      orderNo: 1,
      title: "Đếm 1-5",
      lessons: [
        {
          orderNo: 1,
          slug: "math-l1-u1-count-to-3",
          title: "Count to 3",
          objective: "Bé sắp xếp đúng thứ tự số từ 1 đến 3.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Sắp xếp số theo thứ tự đúng",
            spec: {
              type: "SORT_ORDER",
              items: ["Ba", "Một", "Hai"],
              correctOrder: [1, 2, 0],
            },
          },
        },
        {
          orderNo: 2,
          slug: "math-l1-u1-count-to-5",
          title: "Count to 5",
          objective: "Bé đếm và sắp xếp đúng dãy số từ 1 đến 5.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Sắp xếp dãy số 1 đến 5",
            spec: {
              type: "SORT_ORDER",
              items: ["Năm", "Hai", "Bốn", "Một", "Ba"],
              correctOrder: [3, 1, 4, 2, 0],
            },
          },
        },
        {
          orderNo: 3,
          slug: "math-l1-u1-which-is-more",
          title: "Which is More?",
          objective: "Bé so sánh số lượng và nhận biết khái niệm nhiều hơn.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Đúng hay sai về so sánh số lượng",
            spec: {
              type: "TRUE_FALSE",
              statement: "5 nhiều hơn 3",
              isTrue: true,
              explanation: "Đúng! 5 > 3. Năm kẹo nhiều hơn ba kẹo!",
            },
          },
        },
      ],
    },
    {
      orderNo: 2,
      title: "Hình Khối & Không Gian",
      lessons: [
        {
          orderNo: 1,
          slug: "math-l1-u2-hinh-tron-va-hinh-vuong",
          title: "Hình tròn & Hình vuông",
          objective: "Bé nhận diện các hình cơ bản trong môi trường xung quanh.",
          estimatedMinutes: 15,
          trialEnabled: true,
          activity: {
            prompt: "Nối tên hình với ví dụ thực tế",
            spec: {
              type: "MATCH_PAIRS",
              pairs: [
                { left: "Hình tròn", right: "Quả bóng" },
                { left: "Hình vuông", right: "Ô cửa sổ" },
                { left: "Hình chữ nhật", right: "Cuốn sách" },
              ],
            },
          },
        },
        {
          orderNo: 2,
          slug: "math-l1-u2-lon-hon-va-nho-hon",
          title: "Lớn hơn & Nhỏ hơn",
          objective: "Bé so sánh kích thước đồ vật bằng cặp khái niệm lớn - nhỏ.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Chọn vật lớn hơn",
            spec: {
              type: "MULTIPLE_CHOICE",
              question: "Trong hai vật sau, vật nào lớn hơn?",
              options: ["Viên bi", "Quả bóng", "Cục tẩy", "Nhãn dán"],
              correctIndex: 1,
              explanation: "Quả bóng lớn hơn viên bi, cục tẩy và nhãn dán.",
            },
          },
        },
        {
          orderNo: 3,
          slug: "math-l1-u2-cao-hon-va-ngan-hon",
          title: "Cao hơn & Ngắn hơn",
          objective: "Bé nhận biết so sánh chiều cao và độ dài đơn giản.",
          estimatedMinutes: 15,
          trialEnabled: false,
          activity: {
            prompt: "Đúng hay sai về so sánh chiều cao",
            spec: {
              type: "TRUE_FALSE",
              statement: "Cây cao hơn bút chì",
              isTrue: true,
              explanation: "Đúng! Cây thường cao hơn rất nhiều so với bút chì.",
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
        title: "Khám Phá Từ Đầu Tiên",
        units: englishUnits,
      },
    },
    {
      code: TrackCode.MATH,
      title: "Math Journey",
      level: {
        orderNo: 1,
        title: "Những Con Số Kỳ Diệu",
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
          `**Mục tiêu:** ${lessonSeed.objective}`,
          "",
          "**Hoạt động offline:**",
          "- Dùng thẻ hình ảnh hoặc đồ vật thật",
          "- Lặp lại 3 lần cùng con",
          "- Khen khi con trả lời đúng",
        ].join("\n");

        const parentScriptMarkdown = [
          "## Hướng Dẫn Ba Mẹ",
          "",
          "1. Ngồi cùng con, tắt TV/điện thoại",
          `2. Xem video bài ${lessonSeed.title} cùng con`,
          '3. Hỏi lại: "Con vừa học được gì?"',
          "4. Làm hoạt động offline với con",
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
  const email = (process.env.SEED_PARENT_EMAIL ?? "demo.parent@cungcontuhoc.io.vn").toLowerCase();
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
    { slug: "phat-trien-tre", nameVi: "Phát Triển Trẻ Em", emoji: "🌱", color: "#10b981", orderNo: 1 },
    { slug: "phuong-phap-hoc", nameVi: "Phương Pháp Học Tập", emoji: "📚", color: "#3b82f6", orderNo: 2 },
    { slug: "tieng-anh-som", nameVi: "Tiếng Anh Cho Trẻ", emoji: "🌏", color: "#8b5cf6", orderNo: 3 },
    { slug: "toan-tu-duy", nameVi: "Toán Tư Duy", emoji: "🔢", color: "#f59e0b", orderNo: 4 },
    { slug: "dinh-huong-phu-huynh", nameVi: "Hướng Dẫn Phụ Huynh", emoji: "👪", color: "#ef4444", orderNo: 5 },
    { slug: "cong-nghe-giao-duc", nameVi: "Công Nghệ Giáo Dục", emoji: "💻", color: "#06b6d4", orderNo: 6 },
    { slug: "suc-khoe-tam-than", nameVi: "Sức Khỏe và Cân Bằng", emoji: "💙", color: "#ec4899", orderNo: 7 },
    { slug: "thanh-tich-hoc-tap", nameVi: "Câu Chuyện Thành Công", emoji: "⭐", color: "#84cc16", orderNo: 8 },
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
      displayName: "Ban Biên Tập",
      role: "Biên tập viên Cùng Con Tự Học",
      active: true,
    },
    create: {
      slug: "ban-bien-tap",
      displayName: "Ban Biên Tập",
      role: "Biên tập viên Cùng Con Tự Học",
      active: true,
    },
  });

  await prisma.blogAuthor.upsert({
    where: { slug: "chuyen-gia-giao-duc" },
    update: {
      displayName: "Chuyên Gia Giáo Dục",
      role: "Chuyên gia Tâm lý Giáo dục",
      active: true,
    },
    create: {
      slug: "chuyen-gia-giao-duc",
      displayName: "Chuyên Gia Giáo Dục",
      role: "Chuyên gia Tâm lý Giáo dục",
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
      titleVi: "5 mẹo học tiếng Anh tại nhà cho bé 3-5 tuổi",
      excerptVi:
        "Các hoạt động ngắn 5-10 phút giúp bé làm quen tiếng Anh tự nhiên mỗi ngày.",
      contentMarkdown: `## Bắt đầu từ thói quen nhỏ

Hãy dành 5 phút đầu ngày để nghe và lặp lại 3 từ mới.

## Học qua bài hát

Bật bài hát thiếu nhi tiếng Anh và cho bé vận động theo nhịp.

## Gắn từ vào đồ vật

Dán nhãn từ vựng lên đồ dùng quen thuộc trong nhà.

## Kể chuyện tranh

Đọc truyện ngắn có hình minh họa và đặt câu hỏi đơn giản.

## Khen ngợi đúng lúc

Ghi nhận nỗ lực của bé để duy trì động lực học tập.
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
      titleVi: "Trẻ em phát triển tư duy toán học như thế nào",
      excerptVi:
        "Tư duy toán học không chỉ là tính toán nhanh mà còn là cách giải quyết vấn đề trong đời sống hằng ngày.",
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
      titleVi: "Phương pháp giáo dục sớm hiệu quả nhất cho trẻ năm 2026",
      excerptVi:
        "Montessori, STEAM hay Waldorf? Chuyên gia giáo dục khuyến nghị cách tiếp cận nào phù hợp nhất cho trẻ em Việt Nam năm 2026?",
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

async function main() {
  await seedAdminSecuritySettings();
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
    // Tiếng Anh sớm (01, 02, 03)
    { slug: "top-7-app-tieng-anh-cho-be", filename: "01-top-7-app-tieng-anh.md", categoryId: catTiengAnh.id },
    { slug: "day-tieng-anh-cho-be-tai-nha", filename: "02-day-tieng-anh-tai-nha.md", categoryId: catTiengAnh.id },
    { slug: "bai-hat-tieng-anh-cho-be", filename: "03-bai-hat-tieng-anh-cho-be.md", categoryId: catTiengAnh.id },
    // Toán tư duy (04, 05, 06)
    { slug: "day-toan-cho-tre-3-tuoi", filename: "04-day-toan-cho-tre-3-tuoi.md", categoryId: catToanTuDuy.id },
    { slug: "tro-choi-hoc-toan-cho-be", filename: "05-tro-choi-hoc-toan-cho-be.md", categoryId: catToanTuDuy.id },
    { slug: "app-hoc-toan-cho-be", filename: "06-app-hoc-toan-cho-be.md", categoryId: catToanTuDuy.id },
    // Công nghệ giáo dục (07, 08)
    { slug: "ung-dung-giao-duc-cho-be", filename: "07-ung-dung-giao-duc-cho-be.md", categoryId: catCongNghe.id },
    { slug: "app-hoc-cho-be-3-tuoi", filename: "08-app-hoc-cho-be-3-tuoi.md", categoryId: catCongNghe.id },
    // Phát triển trẻ (09, 10)
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
