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
    contentMarkdown: `# 5 signs your child is ready to learn English

Focus keyword: **child ready to learn English ages 3-5**

Many parents ask when a child should start English. The answer is not a fixed birthday; it depends on each child's readiness. When the timing is right, children learn more naturally and feel more confident.

## Sign 1: Interest in sounds and songs
Your child often repeats melodies or imitates character voices. This is a strong foundation for pronunciation.

## Sign 2: Can focus for 7-10 minutes
At the age of 3-5, short attention span is normal. As long as your child can follow an activity for 7-10 minutes, it is enough to start mini-lessons.

## Sign 3: Names objects around the house
When your child actively names objects or asks "what is this?", language development is active.

## Sign 4: Responds well to interactive games
Activities such as choosing answers, filling in simple words or listening and pointing to the correct picture help children learn while still having fun.

## Sign 5: Parents can join briefly every day
Just 15 minutes/day, regularly 5-6 days/week, the effectiveness will be much higher than studying on weekends.

## Conclusion
Prioritize your child's pace instead of comparison. When 3-4 signs are present, parents can start a gentle and sustainable English foundation.`,
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
    contentMarkdown: `# Comparing English learning apps for children in 2026

Focus keyword: **compare English learning apps for children 2026**

When looking for an English learning app for their children, parents are often attracted by eye-catching interfaces or "quick learning" ads. But to choose the right platform for children 3-8 years old, it is necessary to evaluate according to clear criteria.

## 1) Does it provide an age-based roadmap?
A good app must clearly divide levels, goals and learning progress. If the content is fragmentary, children can easily learn and forget quickly.

## 2) Are lessons truly interactive?
Simply watching videos does not create enough language reflexes. Prioritize apps that have activities like choosing answers, filling in words, and listening to recognize sounds.

## 3) Are progress reports available for parents?
Parents need to know what their children learn, what their strengths and weaknesses are in order to adjust. If there is no weekly report, it is very difficult to accompany long-term.

## 4) Is the content safe for young children?
Apps for children should limit external advertising, avoid distracting links and give parents control.

## 5) Does the learning rhythm fit family life?
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

Focus keyword: **child studies 15 minutes a day**

Fifteen minutes sounds short, but it is a strong rhythm for children ages 3-8: short enough to avoid overload, long enough to create progress.

## Divide 15 minutes into 3 stages
- 5 minutes warm-up: a song or quick question.
- 7 minutes main task: focus on one skill.
- 3 minutes recap: repeat what your child just learned.

## Use a fixed schedule
Studying at the same time helps children build a habit. For example, start 20 minutes after dinner.

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
    contentMarkdown: `# Weekly child progress report: why parents should monitor it

Focus keyword: **weekly child progress report**

Many families study consistently but still wonder whether their child is truly improving. A weekly report answers that question with concrete data.

## What should be in the weekly report?
- Number of completed lessons.
- Exercise scores and stability level.
- Consecutive learning days.
- Outstanding skills and skills that need more practice.

## Benefit 1: Avoid guessing
No more judging by feeling. Parents know clearly where their children are strong.

## Benefit 2: Decide next week's focus
If your child is weak in listening, next week increase listening activities. If your child is good at reading, you can increase the difficulty level.

## Benefit 3: Increase motivation
When your child sees results week by week, it's easier for him or her to maintain the habit.

## Benefit 4: Reduce pressure on parents
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
    contentMarkdown: `# Grade 1 math at home: 7 activities to build number sense

Focus keyword: **grade 1 math at home**

Without the need for expensive learning materials, parents can still help their children learn 1st grade math effectively right at home.

## 1) Count real objects
Use bottle caps, pencils, and fruit for your child to count and group.

## 2) Play the missing-number game
Write the number sequence 1-20, leave one number blank for your child to fill in.

## 3) Add and subtract with counting sticks
Let your child practice with their hands before working on paper.

## 4) Compare greater and smaller numbers
Use symbols >, < with familiar numbers.

## 5) Match equations with results
Create calculation cards and result cards for children to match.

## 6) Use everyday word problems
Example: "There are 8 cookies. If we eat 3, how many are left?"

## 7) Record weekly wins
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
    contentMarkdown: `# Grade 2 multiplication tables through games

Focus keyword: **grade 2 multiplication table**

Many 2nd graders are afraid of the multiplication table because they memorize it mechanically. A more effective way is to learn through games and real-life situations.

## Game 1: Multiplication bingo
Each cell is a result. Parents read the multiplication equation, and children check the correct box.

## Game 2: Matching cards
One card is the calculation, the other card is the result. Children match correctly as quickly as possible.

## Game 3: Who is faster?
Divide into 2 small teams indoors, each team answers 5 multiplication problems.

## Game 4: Pretend shopping
For example, 3 packages of cakes, each package has 4 pieces, how much is the total?

## Long-lasting memory tips
- Learn in groups: 2-5 first, then 6-9.
- Review 10 facts every day instead of cramming.
- Combine reading aloud and short written practice.

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
    contentMarkdown: `# Grade 1 phonics: an 8-week roadmap for beginner parents

Focus keyword: **grade 1 phonics roadmap**

Phonics helps children read sounds correctly and combine words faster. For grade 1 children, parents can follow the 8-week schedule.

## Weeks 1-2: Basic letter sounds
Focus on common sounds, practice listening and repeating.

## Weeks 3-4: Short-vowel CVC words
Examples: cat, bed, sit. Combine word completion and answer selection.

## Weeks 5-6: Basic digraphs
Get familiar with sh, ch, th through simple words.

## Week 7: First sight words
Learn words that appear frequently in short sentences.

## Week 8: Build words into sentences
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
    contentMarkdown: `# Grade 1 skills checklist for Math and English

Focus keyword: **grade 1 skills checklist**

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
    contentMarkdown: `# How to read weekly study reports without pressure

Focus keyword: **how to read weekly learning reports**

Weekly reports are only truly useful when parents know how to read and turn data into action.

## Step 1: Look at trends instead of one number
Don't just look at how high or low this week's score is. Compare the last 2-3 weeks to see the trend.

## Step 2: Choose one focus for the new week
For example, if listening accuracy is weak, prioritize three short listening sessions next week.

## Step 3: Design a light study schedule
Create a fixed schedule of 15 minutes/day, 5 days/week. Keeping pace is more important than studying.

## Realistic goal setting template
- Skill goal: "Answer 8/10 /sh/ sound questions correctly."
- Habit goal: "Complete 5 learning sessions."

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

Focus keyword: **learning games for children ages 6-8**

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
