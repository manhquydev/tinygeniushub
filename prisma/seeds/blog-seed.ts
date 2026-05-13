import { AgeGroup, BlogPostStatus, BlogPostType, PrismaClient } from "@prisma/client";

type BlogSeedSummary = {
  categories: { created: number; updated: number };
  tags: { created: number; updated: number };
  authors: { created: number; updated: number };
  posts: { created: number; updated: number; total: number };
};

type BlogPostSeed = {
  slug: string;
  titleVi: string;
  excerptVi: string;
  contentMarkdown: string;
  type: BlogPostType;
  categorySlug: string;
  ageGroup: AgeGroup;
  tagSlugs: string[];
  publishedAt: Date;
};

function readingTimeFromMarkdown(markdown: string): number {
  const words = markdown
    .replace(/[#_*`\-\[\]\(\)]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

const BLOG_CATEGORIES = [
  { slug: "phat-trien-tre", nameVi: "Child Development", emoji: "🌱", color: "#10b981", orderNo: 1 },
  { slug: "phuong-phap-hoc", nameVi: "Learning Methods", emoji: "📚", color: "#3b82f6", orderNo: 2 },
  { slug: "tieng-anh-som", nameVi: "English for Children", emoji: "🌏", color: "#8b5cf6", orderNo: 3 },
  { slug: "toan-tu-duy", nameVi: "Math Thinking", emoji: "🔢", color: "#f59e0b", orderNo: 4 },
  { slug: "dinh-huong-phu-huynh", nameVi: "Parental Instructions", emoji: "👪", color: "#ef4444", orderNo: 5 },
] as const;

const BLOG_TAGS = [
  { slug: "hoc-tieng-anh-lop-1", nameVi: "Learn English grade 1" },
  { slug: "phonics-cho-be", nameVi: "Phonics for babies" },
  { slug: "toan-lop-1", nameVi: "Grade 1 Math" },
  { slug: "toan-lop-2", nameVi: "Grade 2 Math" },
  { slug: "hoc-15-phut-moi-ngay", nameVi: "Study 15 minutes every day" },
  { slug: "bao-cao-tien-do", nameVi: "Progress report" },
  { slug: "seo-edtech", nameVi: "SEO EdTech" },
  { slug: "phu-huynh-dong-hanh", nameVi: "Parents accompany" },
] as const;

const NOW = new Date();

const BLOG_POSTS: BlogPostSeed[] = [
  {
    slug: "5-dau-hieu-be-san-sang-hoc-tieng-anh-3-5-tuoi",
    titleVi: "5 signs your baby is ready to learn English (3-5 years old)",
    excerptVi:
      "Early recognition of 5 important signs helps parents choose the right time to start English for 3-5 year old children.",
    contentMarkdown: `# 5 dau hieu be san sang hoc tieng Anh (3-5 tuoi)

Tu khoa chinh: **be san sang hoc tieng Anh 3-5 tuoi**

Nhieu phu huynh hoi: “Khi nao nen cho con bat dau tieng Anh?” Cau tra loi khong nam o mot moc tuoi co dinh, ma nam o **muc san sang** cua tung be. Neu bat dau qua som khi be chua co hung thu, viec hoc de tro thanh ap luc. Neu bat dau dung thoi diem, be tiep thu tu nhien va tu tin hon rat nhieu.

## Dau hieu 1: Be hung thu voi am thanh va bai hat
The baby often repeats melodies and likes to imitate character sounds or sayings in children's videos. This is a very good foundation to get acquainted with English pronunciation.

## Dau hieu 2: Be co the tap trung 7-10 phut
At the age of 3-5, short attention span is normal. As long as your child can follow an activity for 7-10 minutes, it is enough to start mini-lessons.

## Dau hieu 3: Be thich goi ten do vat xung quanh
When your baby actively names objects in the house or asks the question "what is this?", this is a sign that language is developing strongly.

## Dau hieu 4: Be phan hoi tot voi tro choi tuong tac
Activities such as choosing answers, filling in simple words or listening and pointing to the correct picture help children learn while still having fun.

## Dau hieu 5: Phu huynh co the dong hanh ngan moi ngay
Just 15 minutes/day, regularly 5-6 days/week, the effectiveness will be much higher than studying on weekends.

## Conclusion
Prioritize "being at your baby's pace" instead of chasing comparison. When there are 3-4 signs above, parents can begin the foundational English path gently and sustainably.`,
    type: BlogPostType.GUIDE,
    categorySlug: "tieng-anh-som",
    ageGroup: AgeGroup.AGE_3_5,
    tagSlugs: ["hoc-tieng-anh-lop-1", "phonics-cho-be", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "so-sanh-app-hoc-tieng-anh-cho-be-2026",
    titleVi: "Comparing English learning apps for children 2026: what do parents need to look at?",
    excerptVi:
      "Important criteria when comparing English learning apps for children in 2026: roadmap, level of interaction, progress reports and safety.",
    contentMarkdown: `# So sanh app hoc tieng Anh cho be 2026: phu huynh can nhin vao gi?

Tu khoa chinh: **so sanh app hoc tieng Anh cho be 2026**

When looking for an English learning app for their children, parents are often attracted by eye-catching interfaces or "quick learning" ads. But to choose the right platform for children 3-8 years old, it is necessary to evaluate according to clear criteria.

## 1) Co lo trinh theo do tuoi khong?
A good app must clearly divide levels, goals and learning progress. If the content is fragmentary, children can easily learn and forget quickly.

## 2) Bai hoc co tuong tac that hay chi xem video?
Simply watching videos does not create enough language reflexes. Prioritize apps that have activities like choosing answers, filling in words, and listening to recognize sounds.

## 3) Co bao cao tien do cho phu huynh?
Parents need to know what their children learn, what their strengths and weaknesses are in order to adjust. If there is no weekly report, it is very difficult to accompany long-term.

## 4) Noi dung co an toan cho tre nho?
Apps for children should limit external advertising, avoid distracting links and give parents control.

## 5) Nhip hoc co phu hop lich gia dinh?
The 15 minutes/day model helps maintain habits, especially for busy families. The key is regularity.

## Conclusion
Don't choose an app just because of "many features". Choose an app that helps your child learn regularly, parents can track progress, and have an appropriate incremental roadmap for each stage.`,
    type: BlogPostType.ARTICLE,
    categorySlug: "tieng-anh-som",
    ageGroup: AgeGroup.AGE_3_5,
    tagSlugs: ["seo-edtech", "phonics-cho-be", "bao-cao-tien-do"],
    publishedAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "be-hoc-15-phut-moi-ngay-khong-chan",
    titleVi: "How to make your child study 15 minutes a day without getting bored?",
    excerptVi:
      "The 15-minute/day strategy helps children maintain sustainable study habits without getting tired: small goals, fixed rhythm and timely praise.",
    contentMarkdown: `# How to make your child study 15 minutes a day without getting bored?

Tu khoa chinh: **be hoc 15 phut moi ngay**

15 phut nghe co ve it, nhung neu lam dung, day la “diem vang” cho tre 3-8 tuoi: du ngan de khong qua tai, du dai de co ket qua.

## Divide 15 minutes into 3 stages
- 5 phut khoi dong: bai hat hoac cau hoi nhanh.
- 7 phut lam bai chinh: tap trung mot ky nang.
- 3 phut tong ket: nhac lai dieu be vua lam duoc.

## Use a fixed schedule
Hoc cung mot khung gio giup be hinh thanh thoi quen. Vi du: sau an toi 20 phut la “gio hoc cung con”.

## Alternate forms of operation
One session chooses the answer, the next session listens to identify, the next session arranges. Change reduces boredom.

## Praise effort, not just results
Instead of “you are right”, say “you concentrated very well”. This way of praising helps your child be more persistent.

## Track progress weekly
When parents see the number of lessons they have learned and their strengths, their encouragement will be more specific.

## Conclusion
If you want your child to learn regularly, design a gentle and consistent learning rhythm. 15 minutes/day for 8 weeks brings better results than studying in 2-3 long sessions.`,
    type: BlogPostType.TIP,
    categorySlug: "phuong-phap-hoc",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["hoc-15-phut-moi-ngay", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "bao-cao-tien-do-con-theo-tuan",
    titleVi: "Weekly child progress report: why do parents need to monitor?",
    excerptVi:
      "Weekly progress reports help parents clearly understand the skills their children have achieved, the gaps that need to be filled, and the next week's learning plan.",
    contentMarkdown: `# Progress report con theo tuan: vi sao phu huynh can theo doi?

Tu khoa chinh: **bao cao tien do con theo tuan**

Nhieu gia dinh cho con hoc deu nhung van lo lang: “Con that su tien bo chua?” Bao cao tuan giup tra loi cau hoi nay bang du lieu cu the.

## What should be in the weekly report?
- Number of completed articles.
- Exercise scores and stability level.
- ​​A series of consecutive school days.
- Outstanding skills and skills that need more practice.

## Loi ich 1: Tranh hoc cam tinh
No more judging by feeling. Parents know clearly where their children are strong.

## Loi ich 2: Ra quyet dinh hoc tuan toi
If your child is weak in listening, next week increase listening activities. If your child is good at reading, you can increase the difficulty level.

## Loi ich 3: Tang dong luc cho be
When your child sees results week by week, it's easier for him or her to maintain the habit.

## Loi ich 4: Giam ap luc kem con
Parents do not need to sit next to them for too long, but they still stay focused.

## Conclusion
Weekly reports are not just for "checking out", but are a tool to help parents make effective learning decisions and save time.`,
    type: BlogPostType.GUIDE,
    categorySlug: "dinh-huong-phu-huynh",
    ageGroup: AgeGroup.ALL_AGES,
    tagSlugs: ["bao-cao-tien-do", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "toan-lop-1-tai-nha-7-hoat-dong",
    titleVi: "Grade 1 math at home: 7 activities to help children understand numbers faster",
    excerptVi:
      "7 grade 1 math activities at home using familiar objects to help children understand numbers, basic addition and subtraction, and logical thinking.",
    contentMarkdown: `# Grade 1 Math tai nha: 7 hoat dong giup be hieu so nhanh hon

Tu khoa chinh: **toan lop 1 tai nha**

Without the need for expensive learning materials, parents can still help their children learn 1st grade math effectively right at home.

## 1) Dem do vat that
Use bottle caps, pencils, and fruit for your child to count and group.

## 2) Tro choi “so nao mat tich”
Write the number sequence 1-20, leave one number blank for your child to fill in.

## 3) Cong tru bang que tinh
Let your child practice with their hands before working on paper.

## 4) So sanh lon hon - nho hon
Use symbols >, < with familiar numbers.

## 5) Ghep phep tinh voi ket qua
Create calculation cards and result cards for children to match.

## 6) Bai toan tinh huong
Vi du: “Co 8 cai banh, an 3 cai con may cai?”

## 7) So thanh tich cuoi tuan
Every week write down 3 things your child does well to increase confidence.

## Conclusion
Grade 1 math needs visualization and enough repetition. 15 minutes a day with short activities helps your baby make clear progress.`,
    type: BlogPostType.GUIDE,
    categorySlug: "toan-tu-duy",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-1", "hoc-15-phut-moi-ngay"],
    publishedAt: new Date(NOW.getTime() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "bang-nhan-lop-2-qua-tro-choi",
    titleVi: "Grade 2 multiplication tables through games: how to learn and remember for a long time without pressure",
    excerptVi:
      "Turn the 2nd grade multiplication table into a game for your child to remember for a long time, have fun learning and be more confident when doing math problems with words.",
    contentMarkdown: `# Bang nhan lop 2 qua tro choi: cach hoc nho lau khong ap luc

Tu khoa chinh: **bang nhan lop 2**

Many 2nd graders are afraid of the multiplication table because they memorize it mechanically. A more effective way is to learn through games and real-life situations.

## Tro choi 1: Bingo bang nhan
Each cell is a result. Parents read the multiplication equation, and children check the correct box.

## Tro choi 2: The ghep cap
One card is the calculation, the other card is the result. Children match correctly as quickly as possible.

## Tro choi 3: “Ai nhanh hon”
Divide into 2 small teams indoors, each team answers 5 multiplication problems.

## Tro choi 4: Mua hang gia lap
For example, 3 packages of cakes, each package has 4 pieces, how much is the total?

## Long-lasting memory tips
- Hoc theo cum (2-5 truoc, roi 6-9).
- ​​Review 10 spells every day, don't study cumulatively.
- ​​Combine reading aloud and short writing.

## Conclusion
When learning the multiplication table through games, children understand the nature of "multiplication is repeated addition" and reduce the pressure of memorization.`,
    type: BlogPostType.TIP,
    categorySlug: "toan-tu-duy",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-2", "hoc-15-phut-moi-ngay"],
    publishedAt: new Date(NOW.getTime() - 11 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "phonics-lop-1-lo-trinh-8-tuan",
    titleVi: "Grade 1 Phonics: 8-week roadmap for beginner parents",
    excerptVi:
      "Grade 1 phonics roadmap in 8 weeks: from letter sounds, from CVC to reading short sentences, suitable for new parents to accompany their children.",
    contentMarkdown: `# Phonics lop 1: lo trinh 8 tuan cho phu huynh moi bat dau

Tu khoa chinh: **phonics lop 1**

Phonics helps children read sounds correctly and combine words faster. For grade 1 children, parents can follow the 8-week schedule.

## Tuan 1-2: Am chu cai co ban
Focus on common sounds, practice listening and repeating.

## Tuan 3-4: Tu CVC am ngan
Vi du: cat, bed, sit. Ket hop dien tu va chon dap an.

## Tuan 5-6: Digraph co ban
Get familiar with sh, ch, th through simple words.

## Tuan 7: Sight words dau tien
Learn words that appear frequently in short sentences.

## Tuan 8: Ghep tu thanh cau
Start with 3-4 word sentences, prioritize familiar everyday sentences.

## Note for parents
- 15 minutes per session is enough.
- Don't correct mistakes too quickly, give your child time to realize it themselves.
- Record 1-2 words your child reads well every day.

## Conclusion
With a clear roadmap, grade 1 phonics becomes easier and your child will be confident when entering basic reading comprehension.`,
    type: BlogPostType.GUIDE,
    categorySlug: "tieng-anh-som",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["phonics-cho-be", "hoc-tieng-anh-lop-1"],
    publishedAt: new Date(NOW.getTime() - 13 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "checklist-ky-nang-lop-1-toan-tieng-anh",
    titleVi: "Checklist of grade 1 skills: Math and English that parents should follow",
    excerptVi:
      "Grade 1 skills list for Math and English helps parents check their children's learning progress by month.",
    contentMarkdown: `# Checklist ky nang lop 1: Toan va Tieng Anh phu huynh nen theo doi

Tu khoa chinh: **checklist ky nang lop 1**

Checklist helps parents monitor learning progress instead of just looking at scores.

## Grade 1 Math skill group
- Count the numbers and fill in the missing numbers.
- Add and subtract within 20.
- Compare larger and smaller numbers.
- Basic 2D shape recognition.

## Grade 1 English skills group
- Recognize letter sounds.
- Read short CVC words.
- Listen and choose the correct word.
- Combine words into short, simple sentences.

## How to use checklist by month
1. Each week mark the skills learned.
2. Coloring weak skills.
3. Choose 2 priority skills for next week.

## Common mistakes
- Set too many goals in 1 week.
- Only practice the part you are good at.
- Missing weekend summary.

## Conclusion
A good checklist must be clear, measurable and have an action plan for the following week.`,
    type: BlogPostType.ARTICLE,
    categorySlug: "dinh-huong-phu-huynh",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-1", "hoc-tieng-anh-lop-1", "bao-cao-tien-do"],
    publishedAt: new Date(NOW.getTime() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "cach-doc-bao-cao-hoc-tap-hang-tuan-cho-con",
    titleVi: "How to read weekly study reports to tutor your child without pressure",
    excerptVi:
      "Guide parents to read the weekly learning report in 3 steps: look at trends, choose a focus and design a short lesson.",
    contentMarkdown: `# How to read weekly study reports to tutor your child without pressure

Tu khoa chinh: **cach doc bao cao hoc tap tuan**

Weekly reports are only truly useful when parents know how to read and turn data into action.

## Buoc 1: Nhin xu huong thay vi mot con so
Don't just look at how high or low this week's score is. Compare the last 2-3 weeks to see the trend.

## Buoc 2: Chon 1 trong tam cho tuan moi
Vi du: neu con sai nhieu phan nghe, tuan moi uu tien 3 buoi luyen nghe ngan.

## Buoc 3: Thiet ke lich hoc nhe
Create a fixed schedule of 15 minutes/day, 5 days/week. Keeping pace is more important than studying.

## Realistic goal setting template
- Muc tieu ky nang: “Dung 8/10 cau phan am /sh/”.
- Muc tieu thoi quen: “Hoc du 5 buoi”.

## How to respond to your child
Let's start with strengths, then say what needs improvement.

## Conclusion
The weekly report is an action map for parents. Reading correctly will help your child progress while the family still maintains comfort.`,
    type: BlogPostType.GUIDE,
    categorySlug: "dinh-huong-phu-huynh",
    ageGroup: AgeGroup.ALL_AGES,
    tagSlugs: ["bao-cao-tien-do", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 17 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "12-tro-choi-hoc-tap-cuoi-tuan-cho-be-6-8-tuoi",
    titleVi: "12 weekend learning games for 6-8 year olds",
    excerptVi:
      "Suggested 12 weekend games to help 6-8 year olds learn Math and English naturally, reducing passive screen time.",
    contentMarkdown: `# 12 weekend learning games for 6-8 year olds

Tu khoa chinh: **tro choi hoc tap cho be 6-8 tuoi**

Weekend is a good time to review knowledge in a fun and family-bonding way.

## Math game group
1. Number hunting indoors.
2. Match the calculation with the result.
3. Mini simulated trading market.
4. Measure the length of objects with a ruler.
5. Multiplication table quiz.
6. Arrange chronological order of the day.

## English game group
7. Vocabulary Bingo.
8. Listen to the sound and guess the word.
9. Match pictures with words.
10. Arrange words into sentences.
11. Search for objects using English keywords.
12. Tell a story in 3 sentences with new words.

## How to organize for children to cooperate
- Play in short turns of 5-7 minutes.
- Alternate movement activities and study desks.
- Ends with a spiritual reward.

## Conclusion
Learning games help make the weekend both fun and useful. It's important to choose a game that matches your child's current ability.`,
    type: BlogPostType.TIP,
    categorySlug: "phat-trien-tre",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-2", "hoc-tieng-anh-lop-1", "hoc-15-phut-moi-ngay"],
    publishedAt: new Date(NOW.getTime() - 19 * 24 * 60 * 60 * 1000),
  },
];

const OBSOLETE_SEED_POST_SLUGS = ["ke-hoach-4-tuan-cung-con-hoc-toan-va-phonics"];

export async function seedBlogContent(prisma: PrismaClient): Promise<BlogSeedSummary> {
  const summary: BlogSeedSummary = {
    categories: { created: 0, updated: 0 },
    tags: { created: 0, updated: 0 },
    authors: { created: 0, updated: 0 },
    posts: { created: 0, updated: 0, total: BLOG_POSTS.length },
  };

  for (const categorySeed of BLOG_CATEGORIES) {
    const existing = await prisma.blogCategory.findUnique({ where: { slug: categorySeed.slug }, select: { id: true } });
    await prisma.blogCategory.upsert({
      where: { slug: categorySeed.slug },
      update: categorySeed,
      create: { ...categorySeed, active: true },
    });
    if (existing) summary.categories.updated += 1;
    else summary.categories.created += 1;
  }

  for (const tagSeed of BLOG_TAGS) {
    const existing = await prisma.blogTag.findUnique({ where: { slug: tagSeed.slug }, select: { id: true } });
    await prisma.blogTag.upsert({
      where: { slug: tagSeed.slug },
      update: { nameVi: tagSeed.nameVi },
      create: { slug: tagSeed.slug, nameVi: tagSeed.nameVi },
    });
    if (existing) summary.tags.updated += 1;
    else summary.tags.created += 1;
  }

  const authorSlug = "ban-bien-tap-seo";
  const existingAuthor = await prisma.blogAuthor.findUnique({ where: { slug: authorSlug }, select: { id: true } });
  const author = await prisma.blogAuthor.upsert({
    where: { slug: authorSlug },
    update: {
      displayName: "SEO Editorial Board",
      role: "Editing early education content",
      active: true,
    },
    create: {
      slug: authorSlug,
      displayName: "SEO Editorial Board",
      role: "Editing early education content",
      active: true,
    },
  });
  if (existingAuthor) summary.authors.updated += 1;
  else summary.authors.created += 1;

  const categories = await prisma.blogCategory.findMany({
    where: { slug: { in: BLOG_CATEGORIES.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((item) => [item.slug, item.id]));

  const tags = await prisma.blogTag.findMany({
    where: { slug: { in: BLOG_TAGS.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const tagBySlug = new Map(tags.map((item) => [item.slug, item.id]));

  if (OBSOLETE_SEED_POST_SLUGS.length > 0) {
    await prisma.blogPost.deleteMany({
      where: { slug: { in: OBSOLETE_SEED_POST_SLUGS } },
    });
  }

  for (const postSeed of BLOG_POSTS) {
    const categoryId = categoryBySlug.get(postSeed.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category slug: ${postSeed.categorySlug}`);
    }

    const existingPost = await prisma.blogPost.findUnique({ where: { slug: postSeed.slug }, select: { id: true } });
    const post = await prisma.blogPost.upsert({
      where: { slug: postSeed.slug },
      update: {
        type: postSeed.type,
        status: BlogPostStatus.PUBLISHED,
        titleVi: postSeed.titleVi,
        excerptVi: postSeed.excerptVi,
        contentMarkdown: postSeed.contentMarkdown,
        contentHtml: null,
        categoryId,
        ageGroup: postSeed.ageGroup,
        authorId: author.id,
        readingTimeMin: readingTimeFromMarkdown(postSeed.contentMarkdown),
        publishedAt: postSeed.publishedAt,
        isIndexed: true,
        isFeatured: false,
        metaTitleVi: postSeed.titleVi,
        metaDescVi: postSeed.excerptVi,
      },
      create: {
        slug: postSeed.slug,
        type: postSeed.type,
        status: BlogPostStatus.PUBLISHED,
        titleVi: postSeed.titleVi,
        excerptVi: postSeed.excerptVi,
        contentMarkdown: postSeed.contentMarkdown,
        contentHtml: null,
        categoryId,
        ageGroup: postSeed.ageGroup,
        authorId: author.id,
        coAuthorIds: [],
        readingTimeMin: readingTimeFromMarkdown(postSeed.contentMarkdown),
        publishedAt: postSeed.publishedAt,
        isIndexed: true,
        isFeatured: false,
        isPinned: false,
        metaTitleVi: postSeed.titleVi,
        metaDescVi: postSeed.excerptVi,
      },
    });
    if (existingPost) summary.posts.updated += 1;
    else summary.posts.created += 1;

    await prisma.blogPostTag.deleteMany({ where: { postId: post.id } });
    const tagRows = postSeed.tagSlugs
      .map((slug) => tagBySlug.get(slug))
      .filter((tagId): tagId is string => Boolean(tagId))
      .map((tagId) => ({ postId: post.id, tagId }));
    if (tagRows.length > 0) {
      await prisma.blogPostTag.createMany({
        data: tagRows,
        skipDuplicates: true,
      });
    }
  }

  return summary;
}
