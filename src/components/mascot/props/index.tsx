"use client";

import { HeartProp } from "@/components/mascot/props/HeartProp";
import { MagicProp } from "@/components/mascot/props/MagicProp";
import { MusicProp } from "@/components/mascot/props/MusicProp";
import { ReadingProp } from "@/components/mascot/props/ReadingProp";
import { SpaceProp } from "@/components/mascot/props/SpaceProp";
import type { MascotActionProp } from "@/components/mascot/types";

interface ActionPropLayerProps {
  actionProp: MascotActionProp;
  target: "big" | "small";
  reducedMotion: boolean;
}

export function ActionPropLayer({ actionProp, target, reducedMotion }: ActionPropLayerProps) {
  if (actionProp === "none") return null;
  if (actionProp === "reading") return <ReadingProp target={target} reducedMotion={reducedMotion} />;
  if (actionProp === "space") return <SpaceProp target={target} reducedMotion={reducedMotion} />;
  if (actionProp === "heart") return <HeartProp target={target} reducedMotion={reducedMotion} />;
  if (actionProp === "music") return <MusicProp target={target} reducedMotion={reducedMotion} />;
  return <MagicProp target={target} reducedMotion={reducedMotion} />;
}
