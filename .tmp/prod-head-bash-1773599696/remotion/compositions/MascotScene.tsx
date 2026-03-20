import { useCurrentFrame, useVideoConfig } from "remotion";
import { Mascot } from "../../src/components/mascot/Mascot";
import type { MascotVariant, MascotSequenceStep } from "../../src/components/mascot/types";

interface MascotSceneProps {
  sequence: MascotSequenceStep[];
  variant: MascotVariant;
  size?: number;
}

// Bridge between Remotion frame-based rendering and mascot components.
// Resolves which sequence step is active based on the current frame time.
export function MascotScene({ sequence, variant, size = 300 }: MascotSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  let accumulated = 0;
  let currentStep = sequence[0];
  for (const step of sequence) {
    if (currentTimeMs < accumulated + step.duration) {
      currentStep = step;
      break;
    }
    accumulated += step.duration;
  }

  if (!currentStep) return null;

  return (
    <Mascot
      variant={variant}
      state={currentStep.state}
      gesture={currentStep.gesture}
      actionProp={currentStep.actionProp}
      animationMode="once"
      size={size}
      motionLevel="full"
    />
  );
}
