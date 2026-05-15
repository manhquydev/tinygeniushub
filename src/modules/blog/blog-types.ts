export type BlogPostStatus = "DRAFT" | "REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export type BlogPostType = "ARTICLE" | "TIP" | "NEWS" | "GUIDE" | "RESEARCH" | "STORY";
export type AgeGroup = "UNDER_3" | "AGE_3_5" | "AGE_4_6" | "AGE_6_8" | "AGE_7_9" | "AGE_9_12" | "AGE_10_12" | "ALL_AGES";

export interface BlogAuthorSummary {
  displayName: string;
  avatarUrl: string | null;
  slug: string;
  role: string;
  bio?: string | null;
  linkedinUrl?: string | null;
}

export interface BlogCategorySummary {
  nameVi: string;
  nameEn: string | null;
  slug: string;
  emoji: string | null;
  color: string | null;
}

export interface BlogTagSummary {
  slug: string;
  nameVi: string;
}

export interface BlogPostCardDTO {
  id: string;
  slug: string;
  type: BlogPostType;
  status: BlogPostStatus;
  titleVi: string;
  excerptVi: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  readingTimeMin: number;
  viewCount: number;
  likeCount: number;
  ageGroup: AgeGroup;
  author: BlogAuthorSummary;
  category: BlogCategorySummary;
  tags: BlogTagSummary[];
}

export interface BlogPostFullDTO extends BlogPostCardDTO {
  contentMarkdown: string;
  contentHtml: string;
  metaTitleVi: string | null;
  metaDescVi: string | null;
  ogImageUrl: string | null;
  structuredData: unknown | null;
  isFeatured: boolean;
  isPinned: boolean;
  coAuthorIds: string[];
  relatedPosts: BlogPostCardDTO[];
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  ageGroup?: AgeGroup;
  type?: BlogPostType;
  featured?: boolean;
  sort?: "latest" | "popular" | "trending";
}

export interface BlogListResult {
  posts: BlogPostCardDTO[];
  total: number;
  totalPages: number;
  page: number;
}

export interface CreateBlogPostInput {
  slug: string;
  type: BlogPostType;
  titleVi: string;
  titleEn?: string;
  excerptVi: string;
  contentMarkdown: string;
  categoryId: string;
  authorId: string;
  ageGroup: AgeGroup;
  tagIds: string[];
  coverImageUrl?: string;
  metaTitleVi?: string;
  metaDescVi?: string;
  scheduledAt?: Date;
  status: BlogPostStatus;
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  id: string;
}

export interface BlogCategory {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string | null;
  description: string | null;
  emoji: string | null;
  color: string | null;
  parentId: string | null;
  orderNo: number;
  active: boolean;
  createdAt: Date;
}

export interface BlogTag {
  id: string;
  slug: string;
  nameVi: string;
  createdAt: Date;
}

export interface BlogAuthor {
  id: string;
  slug: string;
  displayName: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  email: string | null;
  active: boolean;
  createdAt: Date;
}

