"use client";

import { useTranslations } from "next-intl";

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
  const t = useTranslations("kid.gardenHud.cinematic");

  return (
    <div className="ksg2-seed-overlay" role="dialog" aria-modal="true" aria-label={t("aria")}>
      <div className="ksg2-seed-card">
        <p className="ksg2-seed-kicker">{t("kicker")}</p>
        <h2 className="ksg2-seed-title">{t("title")}</h2>
        <p className="ksg2-seed-course">{courseTitle}</p>

        <div
          className={`ksg2-seed-stage ${prefersReducedMotion ? "ksg2-seed-stage-static" : ""}`}
          aria-hidden="true"
        >
          <span className="ksg2-seed-spark ksg2-seed-spark-a" />
          <span className="ksg2-seed-spark ksg2-seed-spark-b" />
          <span className="ksg2-seed-spark ksg2-seed-spark-c" />

          <span className="ksg2-seed-drop" />
          <span className="ksg2-seed-soil" />
          <span className="ksg2-seed-sprout">
            <span className="ksg2-seed-leaf ksg2-seed-leaf-left" />
            <span className="ksg2-seed-leaf ksg2-seed-leaf-right" />
          </span>
        </div>

        <div className="ksg2-seed-actions">
          <button type="button" className="ksg2-seed-cta" onClick={onFinish}>
            {t("startClimb")}
          </button>
          <button type="button" className="ksg2-seed-skip" onClick={onFinish}>
            {t("later")}
          </button>
        </div>
      </div>
    </div>
  );
}
