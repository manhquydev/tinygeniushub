# Research: Motion.dev Scroll Animations + Next.js SEO + Lucide Icons

## 1. Motion.dev InView Scroll Animations

### Package: `motion` (v11+)
Import from `motion/react` (not `framer-motion`).

### whileInView Pattern (Preferred)
```tsx
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  viewport={{ once: true, amount: 0.2 }}
>
  Content fades up on scroll
</motion.div>
```

### Reusable ScrollReveal Wrapper
```tsx
"use client";
import { motion, type HTMLMotionProps } from "motion/react";

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  children: React.ReactNode;
}

export function ScrollReveal({ delay = 0, children, ...props }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

### Stagger Children Pattern
```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
      }}
    />
  ))}
</motion.div>
```

### Performance Notes
- Always use `viewport={{ once: true }}` to avoid re-triggering
- Prefer `y` transforms over `height`/`top` (GPU-composited)
- Respect `prefers-reduced-motion` via CSS media query already in globals.css

## 2. Next.js 16 Metadata API

### Static Metadata Export (for homepage)
```tsx
// src/app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cùng Con Tự Học — Learning Journey cho trẻ 2-6 tuổi",
  description: "Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ...",
  openGraph: {
    title: "Cùng Con Tự Học",
    description: "Learning Journey OS cho trẻ 2-6 tuổi",
    url: "https://cungcontuhoc.vn",
    siteName: "Cùng Con Tự Học",
    locale: "vi_VN",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "https://cungcontuhoc.vn" },
};
```

### JSON-LD Structured Data
```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cùng Con Tự Học",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "240000",
    priceCurrency: "VND",
    offerCount: "2",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "156",
  },
};

// Render in page component:
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

## 3. Lucide React Icons

### Install
```bash
pnpm add lucide-react
```

### Usage (tree-shakes automatically)
```tsx
import { BookOpen, Shield, Clock, Star } from "lucide-react";

<BookOpen size={24} strokeWidth={1.5} className="icon" />
```

### Style: outline, monochrome, 1.5px stroke on dark backgrounds
- Use `color="currentColor"` (default) — inherits from parent
- `strokeWidth={1.5}` for clean outline look
- Size 20-28px for inline, 32-48px for feature icons

## Unresolved Questions
- None.
