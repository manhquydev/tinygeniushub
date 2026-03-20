"use client";

/**
 * JourneyPreviewSection - Beanstalk Journey demo section for homepage
 * 
 * Features:
 * - Shows BeanstalkJourneyDemo component (mock data, no auth required)
 * - Contained scroll experience (no overlay on other sections)
 * - Triggers sign-up modal on navigation attempts
 * - Positioned after SectionFeatures, before SectionPricing
 * 
 * Fix: Uses journey-preview.css to override fixed positioning
 * and prevent HUD/tabs from overlaying other sections
 */

import { lazy, Suspense, useState } from "react";
import { SignUpModal } from "@/components/try-garden/sign-up-modal";
import "./journey-preview.css"; // Scoped CSS overrides

// Lazy load BeanstalkJourneyDemo to reduce initial bundle size
const BeanstalkJourneyDemo = lazy(() => 
  import("@/components/beanstalk-garden/BeanstalkJourneyDemo").then(mod => ({
    default: mod.BeanstalkJourneyDemo
  }))
);

export function JourneyPreviewSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string>("");

  const handleNavigationAttempt = (url: string) => {
    console.log("[JourneyPreviewSection] Navigation attempt:", url);
    setTargetUrl(url);
    setIsModalOpen(true);
  };

  return (
    <>
      <section 
        className="cgh-journey-preview"
        style={{
          position: "relative",
          minHeight: "100vh",
          backgroundColor: "#fff",
          // Full-bleed section (no padding, Beanstalk handles its own layout)
        }}
      >
        {/* Header guidance */}
        <div
          style={{
            position: "absolute",
            top: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "0.6rem 1.2rem",
            borderRadius: "999px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#1e293b",
            maxWidth: "90%",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          🌱 Đây là hành trình học tập của con bạn
        </div>

        {/* BeanstalkJourney Demo */}
        <Suspense 
          fallback={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                fontSize: "1.2rem",
                color: "#0f9f86",
              }}
            >
              Đang tải hành trình...
            </div>
          }
        >
          <BeanstalkJourneyDemo 
            onNavigationAttempt={handleNavigationAttempt}
            initialChildId="demo-child-1"
            initialJourneyId="demo-journey-toan-1"
          />
        </Suspense>

        {/* Footer CTA - positioned absolute at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            textAlign: "center",
            width: "90%",
            maxWidth: "500px",
          }}
        >
          <p
            style={{
              fontSize: "0.9rem",
              color: "#fff",
              opacity: 0.9,
              marginBottom: "1rem",
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            ☝️ Con bạn sẽ leo lên từng tầng mây khi hoàn thành bài học
          </p>

          <a
            href="/auth/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.9rem 1.8rem",
              borderRadius: "999px",
              backgroundColor: "#0f9f86",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              minHeight: "44px",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => {
              e.preventDefault();
              setIsModalOpen(true);
            }}
          >
            Đăng ký để con bắt đầu hành trình
          </a>
        </div>
      </section>

      {/* Sign-up modal for navigation attempts */}
      <SignUpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        zoneName={null} // No specific zone, general sign-up
        source="homepage"
      />
    </>
  );
}
