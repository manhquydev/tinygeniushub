"use client";

/**
 * InteractivePreview - Fullscreen interactive CloudWorldMap section
 * 
 * Features:
 * - Scroll-locked when reached (Apple pattern) using useScrollLock hook
 * - Lazy loaded CloudWorldMap component (reduce initial bundle)
 * - Preview mode: Only "Today" zone unlocked, others locked
 * - SpeechBubble mascot guidance
 * - Locked zone click → Sign-up modal
 * - Footer CTA: "Đăng ký ngay để con học thử"
 * 
 * Conversion funnel: Try zone → See "locked" → Sign up
 */

import { lazy, Suspense, useState } from "react";
import { useScrollLock } from "@/lib/useScrollLock";
import { SignUpModal } from "@/components/try-garden/sign-up-modal";
import { GardenZone } from "@/components/cloud-garden/world-map/CloudZone";

// Lazy load CloudWorldMap to reduce initial bundle size
const CloudWorldMap = lazy(() => 
  import("@/components/cloud-garden/world-map/CloudWorldMap").then(mod => ({
    default: mod.CloudWorldMap
  }))
);

export function InteractivePreview() {
  const sectionRef = useScrollLock(); // Scroll-lock at 50% visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<GardenZone | null>(null);

  const handleZoneSelect = (zone: GardenZone) => {
    if (zone === "today") {
      // Today zone is unlocked - could open demo lesson modal in future
      console.log("Today zone clicked - demo lesson coming soon");
    } else {
      // Other zones locked - show sign-up modal
      setSelectedZone(zone);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <section 
        ref={sectionRef}
        className="cgh-interactive-preview"
        style={{
          position: "relative",
          minHeight: "100vh",
          backgroundColor: "#f0f9ff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem 1rem",
        }}
      >
        {/* SpeechBubble mascot guidance */}
        <div
          className="mascot-guidance"
          style={{
            position: "absolute",
            top: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fff",
            padding: "0.8rem 1.2rem",
            borderRadius: "999px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--cgh-ink)",
            zIndex: 10,
            maxWidth: "90%",
            textAlign: "center",
          }}
        >
          👋 Chào con! Chọn vùng mây để khám phá
        </div>

        {/* CloudWorldMap preview */}
        <div
          className="map-container"
          style={{
            width: "100%",
            maxWidth: "1200px",
            height: "min(600px, 70vh)",
            position: "relative",
          }}
        >
          <Suspense 
            fallback={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  fontSize: "1.2rem",
                  color: "var(--cgh-teal)",
                }}
              >
                Đang tải khu vườn...
              </div>
            }
          >
            <CloudWorldMap
              hourOfDay={new Date().getHours()}
              progressTotal={5}
              progressFilled={1}
              onZoneSelect={handleZoneSelect}
              // Preview mode will be implemented when integrating with actual CloudWorldMap
            />
          </Suspense>
        </div>

        {/* Footer CTA */}
        <div
          className="preview-footer"
          style={{
            marginTop: "2rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--cgh-ink)",
              opacity: 0.8,
              marginBottom: "1rem",
            }}
          >
            ☝️ Đây là giao diện con bạn sẽ thấy mỗi ngày
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
            }}
          >
            Đăng ký ngay để con học thử
          </a>
        </div>
      </section>

      {/* Sign-up modal for locked zones */}
      <SignUpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        zoneName={selectedZone}
        source="homepage"
      />
    </>
  );
}
