import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(flag: string) {
  const argv = process.argv;
  const index = argv.findIndex((item) => item === flag || item.startsWith(`${flag}=`));
  if (index === -1) return null;
  if (argv[index]?.includes("=")) {
    return argv[index]?.split("=", 2)[1] ?? null;
  }
  return argv[index + 1] ?? null;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function main() {
  const childId = (getArg("--childId") ?? "").trim();
  const courseSlug = (getArg("--courseSlug") ?? "").trim();
  const dryRun = hasFlag("--dry-run");

  if (!childId || !courseSlug) {
    throw new Error(
      "Missing required args. Usage: pnpm tsx scripts/reset-child-course-progress.ts --childId=<id> --courseSlug=<slug> [--dry-run]",
    );
  }

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: {
      id: true,
      title: true,
      lessons: { select: { lessonId: true } },
    },
  });

  if (!course) {
    throw new Error(`Course not found: ${courseSlug}`);
  }

  const lessonIds = course.lessons.map((item) => item.lessonId);
  if (lessonIds.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun,
          childId,
          courseSlug,
          courseTitle: course.title,
          message: "No lessons in this course.",
        },
        null,
        2,
      ),
    );
    return;
  }

  const where = {
    childId,
    lessonId: { in: lessonIds },
  } as const;

  const before = {
    lessonCompletion: await prisma.lessonCompletion.count({ where }),
    lessonProgress: await prisma.lessonProgress.count({ where }),
    rewardGrant: await prisma.rewardGrant.count({ where }),
    evidence: await prisma.evidence.count({ where }),
  };

  let deleted = {
    lessonCompletionDeleted: 0,
    lessonProgressDeleted: 0,
    rewardGrantDeleted: 0,
    evidenceDeleted: 0,
  };

  if (!dryRun) {
    deleted = await prisma.$transaction(async (tx) => {
      const evidence = await tx.evidence.deleteMany({ where });
      const rewardGrant = await tx.rewardGrant.deleteMany({ where });
      const lessonProgress = await tx.lessonProgress.deleteMany({ where });
      const lessonCompletion = await tx.lessonCompletion.deleteMany({ where });

      return {
        lessonCompletionDeleted: lessonCompletion.count,
        lessonProgressDeleted: lessonProgress.count,
        rewardGrantDeleted: rewardGrant.count,
        evidenceDeleted: evidence.count,
      };
    });
  }

  const after = {
    lessonCompletion: await prisma.lessonCompletion.count({ where }),
    lessonProgress: await prisma.lessonProgress.count({ where }),
    rewardGrant: await prisma.rewardGrant.count({ where }),
    evidence: await prisma.evidence.count({ where }),
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        childId,
        courseSlug,
        courseTitle: course.title,
        before,
        deleted,
        after,
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
