TASK: Blog System — Phase 7: SEO, Sitemap & Final Polish

PREREQUISITE: Phases 1-6 complete. All blog pages working.

=== 1. Sitemap ===

Check if src/app/sitemap.ts exists.
If it exists: add blog entries to the existing array.
If not: create it.

Pattern:
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'  // use project's prisma import path

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cungcontuhoc.vn'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: siteUrl + '/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]

  // Blog posts
  let postRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', isIndexed: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    })
    postRoutes = posts.map(p => ({
      url: siteUrl + '/blog/' + p.slug,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch { postRoutes = [] }

  // Category routes
  let categoryRoutes: MetadataRoute.Sitemap = []
  try {
    const cats = await prisma.blogCategory.findMany({ where: { active: true }, select: { slug: true } })
    categoryRoutes = cats.map(c => ({
      url: siteUrl + '/blog/category/' + c.slug,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch { categoryRoutes = [] }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes]
}

=== 2. robots.ts ===

Check if src/app/robots.ts exists. If not, create it.

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/blog/*'],
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: (process.env.NEXT_PUBLIC_SITE_URL || 'https://cungcontuhoc.vn') + '/sitemap.xml',
  }
}

=== 3. OpenGraph Image for Blog Posts ===

Create: src/app/(main)/blog/[slug]/opengraph-image.tsx

import { ImageResponse } from 'next/og'
import { blogService } from '@/modules/blog/blog-service'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: { slug: string } }) {
  const post = await blogService.getPostBySlug(params.slug)
  if (!post) return new ImageResponse(<div>CungConTuHoc Blog</div>, { ...size })

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 60, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 24 }}>
          {post.titleVi}
        </div>
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)' }}>
          {post.author.displayName} · CungConTuHoc Blog
        </div>
      </div>
    ),
    { ...size }
  )
}

=== 4. next.config.ts — Image Domains ===

Open next.config.ts. Add R2/S3 storage hostname to images remotePatterns.
Find the images config object and add:
  { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' }
  { protocol: 'https', hostname: '*.r2.dev' }

Also add any other CDN domains the project uses for images.

=== 5. Admin Navigation ===

Find the admin sidebar or nav component (check src/app/admin/layout.tsx or src/components/admin/sidebar.tsx or similar).
Add a "Blog" section to the nav items:
  - href: '/admin/blog', label: 'Blog Dashboard', icon: PenSquare (from lucide-react)
  - href: '/admin/blog/posts', label: 'Bai viet'
  - href: '/admin/blog/categories', label: 'Danh muc'  
  - href: '/admin/blog/newsletter', label: 'Newsletter'

=== 6. Public Navbar Blog Link ===

Find the main Navbar component (src/components/navbar.tsx or src/app/(main)/layout.tsx or similar).
Add a "Blog" navigation link to /blog.
Position after main nav items, before auth/login buttons.

=== 7. Prose Styles ===

Open src/app/globals.css.
If .prose class is not already defined, add basic prose styles:

.prose h1, .prose h2, .prose h3 { font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
.prose h1 { font-size: 2rem; }
.prose h2 { font-size: 1.5rem; }
.prose h3 { font-size: 1.25rem; }
.prose p { margin-bottom: 1rem; line-height: 1.75; }
.prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 1rem; }
.prose li { margin-bottom: 0.5rem; }
.prose code { background: rgba(0,0,0,0.05); padding: 0.1rem 0.3rem; border-radius: 3px; font-family: monospace; }
.prose pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; }
.prose blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #64748b; margin: 1rem 0; }
.prose a { color: #3b82f6; text-decoration: underline; }
.prose img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }

=== 8. FINAL VERIFICATION ===

Run all quality checks:
  pnpm type-check
  pnpm lint
  pnpm test

Manually verify these URLs work:
  http://localhost:3000/blog                           → Blog homepage with posts
  http://localhost:3000/blog/5-meo-hoc-tieng-anh-tai-nha → Article page
  http://localhost:3000/blog/category/tieng-anh-som        → Category page
  http://localhost:3000/sitemap.xml                    → Shows blog URLs
  http://localhost:3000/robots.txt                     → Shows rules
  http://localhost:3000/admin/blog                     → Admin dashboard
  http://localhost:3000/admin/blog/posts               → Post list
  http://localhost:3000/admin/blog/posts/new           → Create form
  http://localhost:3000/api/blog/posts                 → JSON list
  http://localhost:3000/api/blog/featured              → JSON featured

All must respond with 200 (or appropriate redirects). Fix any errors found.
