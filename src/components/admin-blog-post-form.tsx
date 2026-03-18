"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { BlogEditorSplit } from "@/components/blog/blog-editor-split";
import { BlogImageUploadButton } from "@/components/blog/blog-image-upload-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BlogCategoryOption = {
  id: string;
  slug: string;
  nameVi: string;
};

type BlogAuthorOption = {
  id: string;
  slug: string;
  displayName: string;
};

type BlogPostFormValues = {
  slug: string;
  titleVi: string;
  excerptVi: string;
  type: "ARTICLE" | "TIP" | "NEWS" | "GUIDE" | "RESEARCH" | "STORY";
  ageGroup: "UNDER_3" | "AGE_3_5" | "AGE_6_8" | "AGE_9_12" | "ALL_AGES";
  categoryId: string;
  authorId: string;
  coverImageUrl: string;
  tagsInput: string;
  contentMarkdown: string;
  metaTitleVi: string;
  metaDescVi: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  scheduledAt: string;
};

type AdminBlogPostFormProps = {
  mode: "create" | "edit";
  submitUrl: string;
  postId?: string;
  viewSlug?: string;
  defaultValues?: Partial<BlogPostFormValues>;
};

function toDatetimeLocal(dateValue?: Date | string | null) {
  if (!dateValue) {
    return "";
  }
  const value = typeof dateValue === "string" ? dateValue : dateValue.toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function getPostTypeLabel(type: BlogPostFormValues["type"]) {
  switch (type) {
    case "ARTICLE":
      return "Bài viết";
    case "TIP":
      return "Mẹo ngắn";
    case "NEWS":
      return "Tin tức";
    case "GUIDE":
      return "Hướng dẫn";
    case "RESEARCH":
      return "Nghiên cứu";
    case "STORY":
      return "Câu chuyện";
    default:
      return type;
  }
}

function getAgeGroupLabel(ageGroup: BlogPostFormValues["ageGroup"]) {
  switch (ageGroup) {
    case "UNDER_3":
      return "Dưới 3 tuổi";
    case "AGE_3_5":
      return "3 - 5 tuổi";
    case "AGE_6_8":
      return "6 - 8 tuổi";
    case "AGE_9_12":
      return "9 - 12 tuổi";
    case "ALL_AGES":
      return "Mọi độ tuổi";
    default:
      return ageGroup;
  }
}

function getPostStatusLabel(status: BlogPostFormValues["status"]) {
  switch (status) {
    case "DRAFT":
      return "Nháp";
    case "REVIEW":
      return "Chờ duyệt";
    case "PUBLISHED":
      return "Đã xuất bản";
    case "SCHEDULED":
      return "Lên lịch";
    case "ARCHIVED":
      return "Lưu trữ";
    default:
      return status;
  }
}

export function AdminBlogPostForm({ mode, submitUrl, postId, viewSlug, defaultValues }: AdminBlogPostFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategoryOption[]>([]);
  const [authors, setAuthors] = useState<BlogAuthorOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [titleVi, setTitleVi] = useState(defaultValues?.titleVi ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [excerptVi, setExcerptVi] = useState(defaultValues?.excerptVi ?? "");
  const [type, setType] = useState<BlogPostFormValues["type"]>(defaultValues?.type ?? "ARTICLE");
  const [ageGroup, setAgeGroup] = useState<BlogPostFormValues["ageGroup"]>(defaultValues?.ageGroup ?? "ALL_AGES");
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "");
  const [authorId, setAuthorId] = useState(defaultValues?.authorId ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(defaultValues?.coverImageUrl ?? "");
  const [tagsInput, setTagsInput] = useState(defaultValues?.tagsInput ?? "");
  const [contentMarkdown, setContentMarkdown] = useState(defaultValues?.contentMarkdown ?? "");
  const [metaTitleVi, setMetaTitleVi] = useState(defaultValues?.metaTitleVi ?? "");
  const [metaDescVi, setMetaDescVi] = useState(defaultValues?.metaDescVi ?? "");
  const [status, setStatus] = useState<BlogPostFormValues["status"]>(defaultValues?.status ?? "DRAFT");
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(defaultValues?.scheduledAt));

  const excerptRemaining = useMemo(() => 160 - excerptVi.length, [excerptVi.length]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setFormError(null);

      try {
        const [categoriesResponse, authorsResponse] = await Promise.all([
          fetch("/api/admin/blog/categories"),
          fetch("/api/admin/blog/authors"),
        ]);

        if (!categoriesResponse.ok || !authorsResponse.ok) {
          throw new Error("LOAD_OPTIONS_FAILED");
        }

        const categoriesPayload = (await categoriesResponse.json()) as { categories: BlogCategoryOption[] };
        const authorsPayload = (await authorsResponse.json()) as { authors: BlogAuthorOption[] };

        if (!active) {
          return;
        }

        setCategories(categoriesPayload.categories);
        setAuthors(authorsPayload.authors);

        setCategoryId((current) => current || categoriesPayload.categories[0]?.id || "");
        setAuthorId((current) => current || authorsPayload.authors[0]?.id || "");
      } catch {
        if (active) {
          setFormError("Không thể tải danh mục hoặc tác giả.");
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  function handleTitleBlur() {
    setSlug(
      slugify(titleVi, {
        lower: true,
        locale: "vi",
      }),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setPublishMessage(null);

    try {
      const tagValues = tagsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      void tagValues;

      const formData = {
        slug: slug.trim(),
        titleVi: titleVi.trim(),
        excerptVi: excerptVi.trim(),
        type,
        ageGroup,
        categoryId,
        authorId,
        coverImageUrl: coverImageUrl.trim() || undefined,
        contentMarkdown: contentMarkdown.trim(),
        metaTitleVi: metaTitleVi.trim() || undefined,
        metaDescVi: metaDescVi.trim() || undefined,
        status,
        scheduledAt: status === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      };

      const payload = {
        ...formData,
        tagIds: [],
      };

      const response = await fetch(submitUrl, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("SAVE_FAILED");
      }

      router.push("/admin/blog/posts");
      router.refresh();
    } catch {
      setFormError("Không thể lưu bài viết. Vui lòng kiểm tra dữ liệu và thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function publishNow() {
    if (!postId) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setPublishMessage(null);

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}/publish`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("PUBLISH_FAILED");
      }

      setPublishMessage("Đã xuất bản bài viết.");
      router.refresh();
    } catch {
      setFormError("Không thể xuất bản ngay lúc này.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-5 shadow-sm sm:p-6">
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Thông tin cơ bản</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="post-title">Tiêu đề</Label>
            <Input id="post-title" value={titleVi} onChange={(e) => setTitleVi(e.target.value)} onBlur={handleTitleBlur} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="post-slug">Slug</Label>
            <Input id="post-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            <p className="text-xs text-[var(--admin-text-secondary)]">Tự tạo từ tiêu đề</p>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="post-excerpt">Mô tả ngắn</Label>
            <Textarea id="post-excerpt" value={excerptVi} onChange={(e) => setExcerptVi(e.target.value)} maxLength={160} required className="min-h-24" />
            <p className="text-xs text-[var(--admin-text-secondary)]">Còn lại: {excerptRemaining} ký tự</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="post-type">Loại bài viết</Label>
            <Select value={type} onValueChange={(v) => setType(v as BlogPostFormValues["type"])}>
              <SelectTrigger id="post-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["ARTICLE", "TIP", "NEWS", "GUIDE", "RESEARCH", "STORY"] as const).map((t) => (
                  <SelectItem key={t} value={t}>{getPostTypeLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="post-age">Độ tuổi</Label>
            <Select value={ageGroup} onValueChange={(v) => setAgeGroup(v as BlogPostFormValues["ageGroup"])}>
              <SelectTrigger id="post-age"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["UNDER_3", "AGE_3_5", "AGE_6_8", "AGE_9_12", "ALL_AGES"] as const).map((a) => (
                  <SelectItem key={a} value={a}>{getAgeGroupLabel(a)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Phân loại</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="post-category">Danh mục</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingOptions}>
              <SelectTrigger id="post-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameVi}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="post-author">Tác giả</Label>
            <Select value={authorId} onValueChange={setAuthorId} disabled={loadingOptions}>
              <SelectTrigger id="post-author"><SelectValue /></SelectTrigger>
              <SelectContent>
                {authors.map((a) => <SelectItem key={a.id} value={a.id}>{a.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="post-cover">URL ảnh bìa</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input id="post-cover" type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="URL ảnh bìa (tự nhập hoặc upload)" />
              <BlogImageUploadButton onUpload={(publicUrl) => setCoverImageUrl(publicUrl)} />
            </div>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="post-tags">Thẻ (phân tách bằng dấu phẩy)</Label>
            <Textarea id="post-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="min-h-20" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Nội dung</h2>
        <div className="space-y-1 text-sm font-semibold text-[var(--admin-text-secondary)]">
          <span>Markdown</span>
          <BlogEditorSplit value={contentMarkdown} onChange={setContentMarkdown} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">SEO</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="post-meta-title">Tiêu đề SEO</Label>
            <Input id="post-meta-title" value={metaTitleVi} onChange={(e) => setMetaTitleVi(e.target.value)} />
            <p className="text-xs text-[var(--admin-text-secondary)]">60 ký tự</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="post-meta-desc">Mô tả SEO</Label>
            <Textarea id="post-meta-desc" value={metaDescVi} onChange={(e) => setMetaDescVi(e.target.value)} className="min-h-20" />
            <p className="text-xs text-[var(--admin-text-secondary)]">160 ký tự</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Xuất bản</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="post-status">Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BlogPostFormValues["status"])}>
              <SelectTrigger id="post-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">{getPostStatusLabel("DRAFT")}</SelectItem>
                <SelectItem value="REVIEW">{getPostStatusLabel("REVIEW")}</SelectItem>
                <SelectItem value="PUBLISHED">{getPostStatusLabel("PUBLISHED")}</SelectItem>
                <SelectItem value="SCHEDULED">{getPostStatusLabel("SCHEDULED")}</SelectItem>
                {status === "ARCHIVED" ? <SelectItem value="ARCHIVED">{getPostStatusLabel("ARCHIVED")}</SelectItem> : null}
              </SelectContent>
            </Select>
          </div>
          {status === "SCHEDULED" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="post-scheduled">Thời gian đăng</Label>
              <Input id="post-scheduled" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          ) : null}
        </div>
      </section>

      {formError ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{formError}</p> : null}
      {publishMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{publishMessage}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting || loadingOptions} className="bg-teal-600 hover:bg-teal-700">
          {submitting ? "Đang lưu..." : mode === "create" ? "Tạo bài viết" : "Lưu thay đổi"}
        </Button>
        {mode === "edit" && postId ? (
          <Button type="button" variant="outline" onClick={publishNow} disabled={submitting}>Xuất bản ngay</Button>
        ) : null}
        {mode === "edit" && viewSlug ? (
          <Button asChild variant="outline"><Link href={`/blog/${viewSlug}`} target="_blank" rel="noreferrer">Xem bài viết</Link></Button>
        ) : null}
      </div>
    </form>
  );
}
