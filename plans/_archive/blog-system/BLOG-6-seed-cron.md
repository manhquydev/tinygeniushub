TASK: Blog System — Phase 6: Seed Data & Cron Integration

PREREQUISITE: Phases 1-5 complete. pnpm type-check passes.

=== PART 1: Blog Seed Data ===

Open prisma/seed.ts (or the main seed file). Add a seedBlog() function at the bottom. Call it from the main seed function AFTER existing seed logic.

The seedBlog() function must use upsert (not create) so it's idempotent:

async function seedBlog() {
  // 1. Upsert 8 categories
  const categories = [
    { slug: 'phat-trien-tre', nameVi: 'Phat Trien Tre Em', emoji: '🌱', color: '#10b981', orderNo: 1 },
    { slug: 'phuong-phap-hoc', nameVi: 'Phuong Phap Hoc Tap', emoji: '📚', color: '#3b82f6', orderNo: 2 },
    { slug: 'tieng-anh-som', nameVi: 'Tieng Anh Cho Tre', emoji: '🌏', color: '#8b5cf6', orderNo: 3 },
    { slug: 'toan-tu-duy', nameVi: 'Toan Tu Duy', emoji: '🔢', color: '#f59e0b', orderNo: 4 },
    { slug: 'dinh-huong-phu-huynh', nameVi: 'Huong Dan Phu Huynh', emoji: '👪', color: '#ef4444', orderNo: 5 },
    { slug: 'cong-nghe-giao-duc', nameVi: 'Cong Nghe Giao Duc', emoji: '💻', color: '#06b6d4', orderNo: 6 },
    { slug: 'suc-khoe-tam-than', nameVi: 'Suc Khoe va Can Bang', emoji: '💙', color: '#ec4899', orderNo: 7 },
    { slug: 'thanh-tich-hoc-tap', nameVi: 'Cau Chuyen Thanh Cong', emoji: '⭐', color: '#84cc16', orderNo: 8 },
  ]
  for (const cat of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, active: true },
    })
  }

  // 2. Upsert 2 authors
  const authors = [
    { slug: 'ban-bien-tap', displayName: 'Ban Bien Tap', role: 'Bien tap vien CungConTuHoc', active: true },
    { slug: 'chuyen-gia-giao-duc', displayName: 'Chuyen Gia Giao Duc', role: 'Chuyen gia Tam ly Giao duc', active: true },
  ]
  for (const author of authors) {
    await prisma.blogAuthor.upsert({
      where: { slug: author.slug },
      update: {},
      create: author,
    })
  }

  // 3. Upsert 10 tags
  const tags = [
    'tieng-anh', 'toan-hoc', 'phat-trien-ngon-ngu', 'ky-nang-song', 'am-nhac',
    'doc-sach', 'nuoi-day-con', 'stem', 'hoc-qua-choi', 'tu-duy-sang-tao'
  ]
  for (const slug of tags) {
    await prisma.blogTag.upsert({
      where: { slug },
      update: {},
      create: { slug, nameVi: slug.replace(/-/g, ' ') },
    })
  }

  // 4. Upsert 3 sample blog posts (need to look up category and author IDs first)
  const tiengAnhCat = await prisma.blogCategory.findUnique({ where: { slug: 'tieng-anh-som' } })
  const toanCat = await prisma.blogCategory.findUnique({ where: { slug: 'toan-tu-duy' } })
  const phuongPhapCat = await prisma.blogCategory.findUnique({ where: { slug: 'phuong-phap-hoc' } })
  const banBienTap = await prisma.blogAuthor.findUnique({ where: { slug: 'ban-bien-tap' } })

  if (tiengAnhCat && toanCat && phuongPhapCat && banBienTap) {
    const samplePosts = [
      {
        slug: '5-meo-hoc-tieng-anh-tai-nha',
        type: 'TIP' as const,
        status: 'PUBLISHED' as const,
        titleVi: '5 Meo Giup Con Hoc Tieng Anh Tai Nha Hieu Qua',
        excerptVi: 'Phu huynh khong can la giao vien de giup con yeu tieng Anh. Kham pha 5 phuong phap don gian ma bat ky gia dinh nao cung co the ap dung.',
        contentMarkdown: `# 5 Tips to Help Children Learn English at Home

## 1. Create an English Environment
Surround your child with English through songs, cartoons, and books.

## 2. Daily Practice
Even 10-15 minutes of English practice daily makes a big difference.

## 3. Make It Fun
Use games, songs, and interactive activities instead of traditional study methods.

## 4. Use Technology Wisely
Educational apps like CungConTuHoc can supplement home learning effectively.

## 5. Be Patient and Consistent
Language learning takes time. Celebrate small victories and stay consistent.

Learning a second language early gives children significant cognitive advantages. Start today!`,
        categoryId: tiengAnhCat.id,
        ageGroup: 'AGE_6_8' as const,
        readingTimeMin: 5,
        isFeatured: true,
        isIndexed: true,
        isPinned: false,
        authorId: banBienTap.id,
        coAuthorIds: [],
        publishedAt: new Date(),
      },
      {
        slug: 'tre-hoc-toan-tu-duy-nhu-the-nao',
        type: 'GUIDE' as const,
        status: 'PUBLISHED' as const,
        titleVi: 'Tre Em Hoc Toan Tu Duy Nhu The Nao',
        excerptVi: 'Toan tu duy khong phai chi la tinh toan nhanh. Day la cach giup tre phat trien kha nang giai quyet van de tu nhien nhat.',
        contentMarkdown: `# How Children Learn Mathematical Thinking

Mathematical thinking goes beyond calculation. It's about problem-solving, pattern recognition, and logical reasoning.

## What is Mathematical Thinking?
Mathematical thinking involves:
- Finding patterns in everyday life
- Breaking complex problems into smaller parts
- Using logic to reach conclusions

## Age-Appropriate Activities
For 6-8 year olds, use tangible objects, games, and real-world problems to build intuitive math understanding.

## The Role of Play
Children learn math most effectively through play. Block building, sorting games, and puzzles all develop mathematical thinking.`,
        categoryId: toanCat.id,
        ageGroup: 'AGE_6_8' as const,
        readingTimeMin: 4,
        isFeatured: false,
        isIndexed: true,
        isPinned: false,
        authorId: banBienTap.id,
        coAuthorIds: [],
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        slug: 'phuong-phap-giao-duc-som-2026',
        type: 'ARTICLE' as const,
        status: 'PUBLISHED' as const,
        titleVi: 'Phuong Phap Giao Duc Som Hieu Qua Nhat 2026',
        excerptVi: 'Cac phuong phap giao duc som nhu Montessori, Waldorf va STEAM dang duoc ap dung the nao tai Viet Nam vao nam 2026?',
        contentMarkdown: `# Early Education Methods in 2026

Modern early childhood education combines the best of proven methods with new technology.

## Montessori Principles
Child-led learning, hands-on materials, and mixed-age groups remain highly effective.

## STEAM Integration
Science, Technology, Engineering, Art, and Math are now integrated from early childhood.

## Technology and Balance
Digital tools like CungConTuHoc provide structured learning while maintaining the critical importance of physical play and human interaction.

## What Works Best
The most effective early education balances structured learning with free play, involving parents actively in the child's learning journey.`,
        categoryId: phuongPhapCat.id,
        ageGroup: 'AGE_3_5' as const,
        readingTimeMin: 6,
        isFeatured: false,
        isIndexed: true,
        isPinned: false,
        authorId: banBienTap.id,
        coAuthorIds: [],
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ]

    for (const post of samplePosts) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: {},
        create: post,
      })
    }
  }

  console.log('Blog seed completed.')
}

=== PART 2: Cron Route ===

Create: src/app/api/cron/newsletter-weekly/route.ts

Study existing cron routes for auth pattern (e.g., src/app/api/cron/weekly-reports/ or src/app/api/cron/streak-alerts/).
Copy the CRON_SECRET verification pattern exactly.

Logic:
  1. Verify CRON_SECRET (return 401 if invalid)
  2. Find posts published in last 7 days: prisma.blogPost.findMany({ where: { status: 'PUBLISHED', publishedAt: { gte: new Date(Date.now() - 7*24*60*60*1000) } }, take: 10 })
  3. If no posts: return { dispatched: 0, posts: 0 }
  4. Get active subscribers: newsletterService.getActiveSubscribers()
  5. For each subscriber, enqueue a BullMQ job. Study src/worker/ for how to enqueue. Add to a queue named 'blog-newsletter' or reuse an existing queue.
  6. Return { dispatched: subscribers.length, posts: posts.length }

=== PART 3: vercel.json ===

Open vercel.json. Add to the crons array:
{ "path": "/api/cron/newsletter-weekly", "schedule": "0 4 * * 1" }
(Monday at 04:00 UTC = 11:00 Vietnam time)

=== PART 4: Worker Handler ===

Study src/worker/index.ts for existing job handler pattern.
Add a handler for job name 'send-newsletter':
  - data: { subscriberId: string, postIds: string[] }
  - Fetch subscriber by id
  - If not found or unsubscribedAt is set: skip (return)
  - Fetch posts by ids
  - Build simple HTML email with list of post titles + links
  - Send using the existing email adapter (look at how weekly-reports worker sends email)

AFTER ALL CHANGES:
  pnpm type-check
  pnpm db:seed (verify no errors)
  Check http://localhost:3000/blog has sample posts.
