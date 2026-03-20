import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCourseBundles } from "@/modules/courses/course-bundle-service";

export const metadata: Metadata = {
  title: "Khóa học Premium — Cùng Con Tự Học",
  description:
    "Bộ 3 khóa học chính cho bé: Abeka, Little Fox English và Little Fox Chinese. Mua một lần mở trọn bộ.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/courses" },
};

export default async function CoursesPage() {
  const bundles = await getPublishedCourseBundles();

  return (
    <div className="page-stack">
      <section className="card">
        <h1 style={{ fontSize: "1.9rem", fontWeight: 800 }}>Khóa học Premium</h1>
        <p className="muted-text">3 bộ khóa học chính. Mua 1 bộ mở trọn bộ nội dung bên trong.</p>
      </section>

      {bundles.length === 0 ? (
        <section className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Sắp ra mắt</p>
          <p className="muted-text">Đăng ký nhận thông báo khi khóa học mới được phát hành.</p>
          <Link href="/waitlist" className="solid-button" style={{ marginTop: "0.5rem", width: "fit-content" }}>
            Đăng ký nhận thông báo
          </Link>
        </section>
      ) : (
        <section className="card-grid">
          {bundles.map((bundle) => (
            <article key={bundle.bundleSlug} className="card" style={{ display: "grid", gap: "0.75rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bundle.coverImageUrl}
                alt={bundle.title}
                style={{ borderRadius: 12, width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
              />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{bundle.title}</h2>
              <p className="muted-text" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                {bundle.description}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--brand-700)" }}>
                  {bundle.priceVnd.toLocaleString("vi-VN")}đ
                </span>
                <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                  {bundle.durationDays} ngày
                </span>
                <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                  {bundle.totalCourses} cấp độ
                </span>
                <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                  {bundle.totalLessons} bài
                </span>
              </div>
              <Link href={`/courses/${bundle.bundleSlug}`} className="solid-button" style={{ width: "fit-content" }}>
                Xem bộ khóa học
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
