"use client";

/**
 * TryGardenClient - Client component for /try-garden
 * 
 * Renders fullscreen CloudWorldMap in preview mode.
 * Handles locked zone clicks → triggers sign-up modal.
 * Shows social share buttons.
 * Tracks analytics events.
 */

import { CloudWorldMap } from "@/components/cloud-garden/world-map/CloudWorldMap";
import { SignUpModal } from "@/components/try-garden/sign-up-modal";
import { ShareButtons } from "@/components/try-garden/share-buttons";
import { GardenZone } from "@/components/cloud-garden/world-map/CloudZone";
import { useState } from "react";

export function TryGardenClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedZone, setClickedZone] = useState<GardenZone | null>(null);

  const handleZoneSelect = (zone: GardenZone) => {
    // Track zone click event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "zone_click", {
        event_category: "try_garden",
        event_label: zone,
      });
    }

    // Check if zone is locked (in preview: only "today" and "math" unlocked)
    const unlockedZones: GardenZone[] = ["today", "math"];
    const isLocked = !unlockedZones.includes(zone);

    // If zone is locked, show sign-up modal
    if (isLocked) {
      setClickedZone(zone);
      setIsModalOpen(true);

      // Track modal open event
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "modal_open", {
          event_category: "try_garden",
          event_label: zone,
        });
      }
    } else {
      // For unlocked zones, could navigate to lesson preview
      // For now, just log it
      console.log(`Zone ${zone} clicked (unlocked)`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);

    // Track modal close event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "modal_close", {
        event_category: "try_garden",
        event_label: clickedZone,
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-sky-100 via-white to-sky-50">
      {/* Share buttons - floating bottom-right */}
      <ShareButtons />

      {/* Fullscreen CloudWorldMap */}
      <div className="h-screen w-full">
        <CloudWorldMap
          hourOfDay={new Date().getHours()}
          progressTotal={5}
          progressFilled={0}
          onZoneSelect={handleZoneSelect}
        />
      </div>

      {/* Sign-up modal for locked zones */}
      <SignUpModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        zoneName={clickedZone}
        source="try_garden"
      />
    </div>
  );
}
