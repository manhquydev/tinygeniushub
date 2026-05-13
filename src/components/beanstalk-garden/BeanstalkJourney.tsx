"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AmbientParticles } from "./AmbientParticles";
import { MascotCompanion } from "./MascotCompanion";
import "./beanstalk.css";

export interface BeanstalkChildProfile {
  id: string;
  nickname: string;
}

export interface BeanstalkJourneySummary {
  id: string;
  courseSlug: string;
  courseTitle: string;
  status: "SEEDED" | "ACTIVE" | "PAUSED" | "COMPLETED";
  seedName: string;
  currentTierNo: number;
  currentTierProgress: number;
  totalTiers: number;
  completedTiers: number;
  totalLessons: number;
  completedLessons: number;
}

export interface BeanstalkJourneyTier {
  tierNo: number;
  title: string;
  lessonTotal: number;
  lessonCompleted: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface BeanstalkJourneyProps {
  childrenProfiles: BeanstalkChildProfile[];
  activeChildId: string;
  journeys: BeanstalkJourneySummary[];
  activeJourneyId: string | null;
  activeJourneyCourseSlug: string | null;
  activeJourneyCourseTitle: string | null;
  tiers: BeanstalkJourneyTier[];
}

function resolveNodePosition(index: number, total: number) {
  if (index === total - 1 && total > 2) {
    return "center";
  }
  return index % 2 === 0 ? "left" : "right";
}

function resolveStatusLabel(status: BeanstalkJourneySummary["status"]) {
  switch (status) {
    case "COMPLETED":
      return "Complete";
    case "PAUSED":
      return "Pause";
    case "ACTIVE":
      return "Studying";
    case "SEEDED":
    default:
      return "Just planted the seeds";
  }
}

function withQuery(pathname: string, search: string, patch: Record<string, string | null>) {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value.trim().length === 0) {
      params.delete(key);
      continue;
    }
    params.set(key, value);
  }

  const nextQuery = params.toString();
  return nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
}

export function BeanstalkJourney({
  childrenProfiles,
  activeChildId,
  journeys,
  activeJourneyId,
  activeJourneyCourseSlug,
  activeJourneyCourseTitle,
  tiers,
}: BeanstalkJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    containerRef.current.focus();
  }, [activeChildId, activeJourneyId]);

  const sceneHeight = useMemo(() => {
    const minimumHeight = 2600;
    const dynamicHeight = tiers.length * 620 + 900;
    return Math.max(minimumHeight, dynamicHeight);
  }, [tiers.length]);

  const selectedJourney =
    (activeJourneyId ? journeys.find((journey) => journey.id === activeJourneyId) : null)
    ?? journeys[0]
    ?? null;

  const currentTierNo = selectedJourney?.currentTierNo ?? 1;
  const totalTiers = selectedJourney?.totalTiers ?? tiers.length;

  const courseCtaHref = selectedJourney ? `/courses/${selectedJourney.courseSlug}/lessons` : null;

  return (
    <div className="bs-viewport" ref={containerRef} tabIndex={-1}>
      <div className="bs-hud">
        <div className="bs-hud-stack">
          <label className="bs-hud-pill">
            <span className="bs-hud-label">Baby learns</span>
            <select
              className="bs-hud-select"
              value={activeChildId}
              onChange={(event) => {
                const next = withQuery(pathname, searchParams.toString(), {
                  childId: event.target.value,
                  journeyId: null,
                });
                router.replace(next);
              }}
            >
              {childrenProfiles.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.nickname}
                </option>
              ))}
            </select>
          </label>

          <div className="bs-hud-pill">
            <span className="bs-hud-label">Progress</span>
            <strong>{`Floor${currentTierNo}/${Math.max(totalTiers, 1)}`}</strong>
          </div>
        </div>

        <div className="bs-hud-stack bs-hud-stack-right">
          {selectedJourney ? (
            <>
              <div className="bs-hud-pill">
                <span className="bs-hud-label">{selectedJourney.courseTitle}</span>
                <strong>{`${selectedJourney.completedLessons}/${selectedJourney.totalLessons}post`}</strong>
                <span className="bs-hud-status">{resolveStatusLabel(selectedJourney.status)}</span>
              </div>
              {courseCtaHref ? (
                <button
                  type="button"
                  className="bs-action-button"
                  onClick={() => {
                    router.push(courseCtaHref);
                  }}
                >
                  Go to school now
                </button>
              ) : null}
            </>
          ) : (
            <div className="bs-hud-pill">
              <span className="bs-hud-label">There are no trees yet</span>
              <strong>Buy the course to sow seeds</strong>
            </div>
          )}
        </div>
      </div>

      <div className="bs-journey-tabs">
        {journeys.length === 0 ? (
          <div className="bs-empty-banner">
            <p>There is no itinerary yet for this baby.</p>
            <button
              type="button"
              className="bs-action-button"
              onClick={() => {
                router.push("/courses");
              }}
            >
              Open the course list
            </button>
          </div>
        ) : (
          journeys.map((journey) => (
            <button
              key={journey.id}
              type="button"
              className={`bs-journey-tab ${journey.id === selectedJourney?.id ? "bs-journey-tab-active" : ""}`}
              onClick={() => {
                const next = withQuery(pathname, searchParams.toString(), {
                  childId: activeChildId,
                  journeyId: journey.id,
                });
                router.replace(next);
              }}
            >
              <span className="bs-journey-tab-title">{journey.courseTitle}</span>
              <span className="bs-journey-tab-meta">{`${journey.completedTiers}/${journey.totalTiers}floor`}</span>
            </button>
          ))
        )}
      </div>

      <MascotCompanion />

      <div className="bs-content-height" style={{ height: `${sceneHeight}px` }}>
        <AmbientParticles sceneHeight={sceneHeight} />

        <div className="bs-trunk" style={{ height: `${sceneHeight}px` }} />

        <div className="bs-ground">
          <img
            src="/assets/garden/ground.png"
            alt="Garden ground"
            className="bs-asset-raw"
            style={{ width: "100%", height: "auto" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#86efac]/20 to-transparent pointer-events-none" />
        </div>

        {tiers.map((tier, index) => {
          const side = resolveNodePosition(index, tiers.length);
          const yPos = 520 + index * 620;
          const absoluteX = side === "left" ? "35%" : side === "right" ? "65%" : "50%";
          const cloudOffset = side === "left" ? -60 : side === "right" ? -220 : -140;
          const nodeOffset = -40;

          const stateClass = tier.isCompleted
            ? "bs-node-completed"
            : tier.isUnlocked
              ? "bs-node-active"
              : "bs-node-locked";

          const canOpenCourse = tier.isUnlocked && Boolean(activeJourneyCourseSlug);
          const label = tier.isCompleted ? "✓" : tier.isUnlocked ? `${tier.tierNo}` : "🔒";

          return (
            <div
              key={tier.tierNo}
              style={{
                position: "absolute",
                bottom: `${yPos}px`,
                left: absoluteX,
              }}
            >
              <motion.div
                className="bs-cloud-platform"
                style={{ left: `${cloudOffset}px` }}
                animate={{
                  y: [0, -10, 0],
                  x: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 6 + (tier.tierNo % 3) * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <img
                  src="/assets/garden/cloud_platform.png"
                  alt={`Cloud layer${tier.tierNo}`}
                  className="bs-asset-raw"
                  style={{ width: "100%", height: "auto" }}
                />
              </motion.div>

              <button
                type="button"
                className={`bs-node ${stateClass}`}
                style={{ left: `${nodeOffset}px` }}
                onClick={() => {
                  if (!canOpenCourse || !activeJourneyCourseSlug) {
                    return;
                  }
                  router.push(`/courses/${activeJourneyCourseSlug}/lessons`);
                }}
                disabled={!canOpenCourse}
                aria-label={`Floor${tier.tierNo}: ${tier.title}`}
              >
                <span className="text-2xl">{label}</span>
              </button>

              <div className="bs-tier-meta" style={{ left: `${cloudOffset}px` }}>
                <strong>{tier.title}</strong>
                <span>{`${tier.lessonCompleted}/${tier.lessonTotal}post`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedJourney ? (
        <div className="bs-footer-note">
          <p>{`Trip:${selectedJourney.seedName}`}</p>
          {activeJourneyCourseTitle ? <p>{`Course:${activeJourneyCourseTitle}`}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
