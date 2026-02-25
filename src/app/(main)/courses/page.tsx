import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Khóa học Premium — Cùng Con Tự Học",
  description:
    "Học chuyên sâu theo lộ trình có cấu trúc. Toán tư duy, tiếng Anh Phonics và nhiều khóa học premium dành cho bé.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/courses" },
};

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceVnd: number;
  durationDays: number;
  coverImageUrl: string | null;
  isPublished: boolean;
};

async function fetchCourses(): Promise<Course[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/courses`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { ok: boolean; data: { courses: Course[] } };
    return json.ok ? json.data.courses : [];
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await fetchCourses();
  const published = courses.filter((c) => c.isPublished);

  return (
    <div className="page-stack">
      <section className="card">
        <h1 style={{ fontSize: "1.9rem", fontWeight: 800 }}>Khóa học Premium</h1>
        <p className="muted-text">Học chuyên sâu theo lộ trình có cấu trúc</p>
      </section>

      {published.length === 0 ? (
        <section className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Sắp ra mắt</p>
          <p className="muted-text">Đăng ký nhận thông báo khi khóa học mới được phát hành.</p>
          <Link href="/waitlist" className="solid-button" style={{ marginTop: "0.5rem", width: "fit-content" }}>
            Đăng ký nhận thông báo
          </Link>
        </section>
      ) : (
        <section className="card-grid">
          {published.map((course) => (
            <article key={course.id} className="card" style={{ display: "grid", gap: "0.75rem" }}>
              {course.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  style={{ borderRadius: 12, width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
                />
              )}
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{course.title}</h2>
              <p className="muted-text" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                {course.description}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--brand-700)" }}>
                  {course.priceVnd.toLocaleString("vi-VN")}đ
                </span>
                <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                  {course.durationDays} ngày
                </span>
              </div>
              <Link href={`/courses/${course.slug}`} className="solid-button" style={{ width: "fit-content" }}>
                Xem khóa học
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
