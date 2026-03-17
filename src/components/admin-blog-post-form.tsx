"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { BlogEditorSplit } from "@/components/blog/blog-editor-split";
import { BlogImageUploadButton } from "@/components/blog/blog-image-upload-button";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Tiêu đề
            <input
              type="text"
              value={titleVi}
              onChange={(event) => setTitleVi(event.target.value)}
              onBlur={handleTitleBlur}
              required
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Slug
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              required
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
            <p className="text-xs font-normal text-slate-500">Tự tạo từ tiêu đề</p>
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700 md:col-span-2">
            Mô tả ngắn
            <textarea
              value={excerptVi}
              onChange={(event) => setExcerptVi(event.target.value)}
              maxLength={160}
              required
              className="min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm"
            />
            <p className="text-xs font-normal text-slate-500">Còn lại: {excerptRemaining} ký tự</p>
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Loại bài viết
            <select
              value={type}
              onChange={(event) => setType(event.target.value as BlogPostFormValues["type"])}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            >
              <option value="ARTICLE">{getPostTypeLabel("ARTICLE")}</option>
              <option value="TIP">{getPostTypeLabel("TIP")}</option>
              <option value="NEWS">{getPostTypeLabel("NEWS")}</option>
              <option value="GUIDE">{getPostTypeLabel("GUIDE")}</option>
              <option value="RESEARCH">{getPostTypeLabel("RESEARCH")}</option>
              <option value="STORY">{getPostTypeLabel("STORY")}</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Độ tuổi
            <select
              value={ageGroup}
              onChange={(event) => setAgeGroup(event.target.value as BlogPostFormValues["ageGroup"])}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            >
              <option value="UNDER_3">{getAgeGroupLabel("UNDER_3")}</option>
              <option value="AGE_3_5">{getAgeGroupLabel("AGE_3_5")}</option>
              <option value="AGE_6_8">{getAgeGroupLabel("AGE_6_8")}</option>
              <option value="AGE_9_12">{getAgeGroupLabel("AGE_9_12")}</option>
              <option value="ALL_AGES">{getAgeGroupLabel("ALL_AGES")}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Phân loại</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Danh mục
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
              required
              disabled={loadingOptions}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameVi}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Tác giả
            <select
              value={authorId}
              onChange={(event) => setAuthorId(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
              required
              disabled={loadingOptions}
            >
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700 md:col-span-2">
            URL ảnh bìa
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="url"
                value={coverImageUrl}
                onChange={(event) => setCoverImageUrl(event.target.value)}
                placeholder="URL ảnh bìa (tự nhập hoặc upload)"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
              />
              <div className="flex items-center gap-2">
                <BlogImageUploadButton onUpload={(publicUrl) => setCoverImageUrl(publicUrl)} />
              </div>
            </div>
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700 md:col-span-2">
            Thẻ (phân tách bằng dấu phẩy)
            <textarea
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              className="min-h-20 w-full rounded-xl border border-slate-300 p-3 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Nội dung</h2>
        <div className="space-y-1 text-sm font-semibold text-slate-700">
          <span>Markdown</span>
          <BlogEditorSplit value={contentMarkdown} onChange={setContentMarkdown} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">SEO</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Tiêu đề SEO
            <input
              type="text"
              value={metaTitleVi}
              onChange={(event) => setMetaTitleVi(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
            <p className="text-xs font-normal text-slate-500">60 ký tự</p>
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Mô tả SEO
            <textarea
              value={metaDescVi}
              onChange={(event) => setMetaDescVi(event.target.value)}
              className="min-h-20 w-full rounded-xl border border-slate-300 p-3 text-sm"
            />
            <p className="text-xs font-normal text-slate-500">160 ký tự</p>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Xuất bản</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Trạng thái
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as BlogPostFormValues["status"])}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            >
              <option value="DRAFT">{getPostStatusLabel("DRAFT")}</option>
              <option value="REVIEW">{getPostStatusLabel("REVIEW")}</option>
              <option value="PUBLISHED">{getPostStatusLabel("PUBLISHED")}</option>
              <option value="SCHEDULED">{getPostStatusLabel("SCHEDULED")}</option>
              {status === "ARCHIVED" ? <option value="ARCHIVED">{getPostStatusLabel("ARCHIVED")}</option> : null}
            </select>
          </label>
          {status === "SCHEDULED" ? (
            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Thời gian đăng
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
              />
            </label>
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
