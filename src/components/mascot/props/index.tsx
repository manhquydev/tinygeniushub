"use client";

import { DrawingProp } from "@/components/mascot/props/DrawingProp";
import { FlashcardProp } from "@/components/mascot/props/FlashcardProp";
import { HeartProp } from "@/components/mascot/props/HeartProp";
import { MagicProp } from "@/components/mascot/props/MagicProp";
import { MagnifyingGlassProp } from "@/components/mascot/props/MagnifyingGlassProp";
import { MusicProp } from "@/components/mascot/props/MusicProp";
import { PointingStickProp } from "@/components/mascot/props/PointingStickProp";
import { ReadingProp } from "@/components/mascot/props/ReadingProp";
import { SpaceProp } from "@/components/mascot/props/SpaceProp";
import { TrophyProp } from "@/components/mascot/props/TrophyProp";
import { WritingProp } from "@/components/mascot/props/WritingProp";
import type { MascotActionProp } from "@/components/mascot/types";

export type ActionPropTarget = "big" | "small" | "dad" | "sister" | "baby";

interface ActionPropLayerProps {
  actionProp: MascotActionProp;
  target: ActionPropTarget;
  reducedMotion: boolean;
}

function resolveBaseTarget(target: ActionPropTarget): "big" | "small" {
  if (target === "dad" || target === "big") return "big";
  return "small";
}

const PROP_OFFSETS: Record<ActionPropTarget, { x: number; y: number; scale: number }> = {
  big:    { x: 0,   y: 0,    scale: 1 },
  small:  { x: 0,   y: 0,    scale: 1 },
  dad:    { x: -2,  y: -5,   scale: 1.15 },
  sister: { x: 3,   y: -4,   scale: 0.85 },
  baby:   { x: 5,   y: 2,    scale: 0.65 },
};

function renderProp(actionProp: MascotActionProp, baseTarget: "big" | "small", reducedMotion: boolean) {
  if (actionProp === "reading") return <ReadingProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "space") return <SpaceProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "heart") return <HeartProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "music") return <MusicProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "magic") return <MagicProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "writing") return <WritingProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "drawing") return <DrawingProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "flashcard") return <FlashcardProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "pointing-stick") return <PointingStickProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "trophy") return <TrophyProp target={baseTarget} reducedMotion={reducedMotion} />;
  if (actionProp === "magnifying-glass") return <MagnifyingGlassProp target={baseTarget} reducedMotion={reducedMotion} />;
  return null;
}

export function ActionPropLayer({ actionProp, target, reducedMotion }: ActionPropLayerProps) {
  if (actionProp === "none") return null;

  const baseTarget = resolveBaseTarget(target);
  const offset = PROP_OFFSETS[target];
  const needsTransform = offset.x !== 0 || offset.y !== 0 || offset.scale !== 1;

  const prop = renderProp(actionProp, baseTarget, reducedMotion);
  if (!prop) return null;

  if (!needsTransform) return prop;
  return (
    <g transform={`translate(${offset.x} ${offset.y}) scale(${offset.scale})`}>
      {prop}
    </g>
  );
}
