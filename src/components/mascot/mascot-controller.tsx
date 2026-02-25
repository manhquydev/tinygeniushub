"use client";

import { Mascot } from "@/components/mascot";
import type { MascotProps } from "@/components/mascot/types";

// Flip to true when Rive .riv file is ready
const RIVE_READY = false;

export function MascotController(props: MascotProps) {
  if (RIVE_READY) {
    // Future: return <RiveMascot {...props} />;
    return null;
  }
  return <Mascot {...props} />;
}
