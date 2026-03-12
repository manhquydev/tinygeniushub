"use client";

interface SeedPlantingCinematicProps {
  courseTitle: string;
  onFinish: () => void;
  prefersReducedMotion: boolean;
}

export function SeedPlantingCinematic({
  courseTitle,
  onFinish,
  prefersReducedMotion,
}: SeedPlantingCinematicProps) {
  return (
    <div className="ksg-seed-overlay" role="dialog" aria-modal="true" aria-label="Gieo hạt cho khóa học mới">
      <div className="ksg-seed-card">
        <p className="ksg-seed-kicker">Khóa học mới</p>
        <h2 className="ksg-seed-title">Gieo hạt đậu, mở hành trình trên mây</h2>
        <p className="ksg-seed-course">{courseTitle}</p>

        <div className={`ksg-seed-stage ${prefersReducedMotion ? "ksg-seed-stage-static" : ""}`} aria-hidden="true">
          <span className="ksg-seed-spark ksg-seed-spark-a" />
          <span className="ksg-seed-spark ksg-seed-spark-b" />
          <span className="ksg-seed-spark ksg-seed-spark-c" />

          <span className="ksg-seed-drop" />
          <span className="ksg-seed-soil" />
          <span className="ksg-seed-sprout">
            <span className="ksg-seed-leaf ksg-seed-leaf-left" />
            <span className="ksg-seed-leaf ksg-seed-leaf-right" />
          </span>
        </div>

        <div className="ksg-seed-actions">
          <button type="button" className="ksg-seed-cta" onClick={onFinish}>
            Bắt đầu leo mây
          </button>
          <button type="button" className="ksg-seed-skip" onClick={onFinish}>
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

