---
phase: H
title: "AI Pipeline (TTS, Backgrounds, Music)"
status: pending
priority: P2
effort: 8h
dependencies: [G]
---

# Phase H: AI Pipeline Setup

## Overview

Integrate Gemini API for TTS voiceover (Vietnamese), Veo 3.1 for background generation, and Lyria for music. FFmpeg post-processing to combine all assets.

## Architecture

```
Script (markdown) → Gemini TTS → voiceover.wav
                  → Veo 3.1    → background.mp4
                  → Lyria      → music.mp3
                  → Remotion   → mascot-animation.mp4

FFmpeg: mascot-animation + background + voiceover + music → final.mp4
```

## Files to Create

- `scripts/video-pipeline/generate-voiceover.ts` -- Gemini TTS script
- `scripts/video-pipeline/generate-background.ts` -- Veo 3.1 background
- `scripts/video-pipeline/generate-music.ts` -- Lyria music
- `scripts/video-pipeline/compose-video.ts` -- FFmpeg composition
- `scripts/video-pipeline/pipeline-config.ts` -- shared config
- `.env.example` -- add GEMINI_API_KEY placeholder

## Implementation Steps

### Step 1: Setup Gemini API

```ts
// pipeline-config.ts
export const PIPELINE_CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  tts: {
    language: "vi-VN",
    voice: "vi-VN-Standard-A", // female Vietnamese
    speakingRate: 0.9,         // slightly slower for children
  },
  video: {
    fps: 30,
    width: 1920,
    height: 1080,
  },
};
```

### Step 2: TTS voiceover generation

```ts
// generate-voiceover.ts
import { GoogleGenAI } from "@google/genai";

export async function generateVoiceover(script: string, outputPath: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // Use Gemini's TTS capability
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ text: `Generate Vietnamese TTS audio for: ${script}` }],
    // TTS-specific config
  });
  // Write audio buffer to outputPath
}
```

### Step 3: Background generation with Veo

```ts
// generate-background.ts
export async function generateBackground(
  prompt: string,
  style: "classroom" | "outdoor" | "space" | "forest",
  outputPath: string,
) {
  // Use Veo 3.1 API for video background
  // Prompt template: "Children's educational cartoon background, {style}, soft colors, no characters"
  // Output: 10-30s looping background video
}
```

### Step 4: Music generation with Lyria

```ts
// generate-music.ts
export async function generateMusic(
  mood: "happy" | "calm" | "exciting" | "curious",
  durationSeconds: number,
  outputPath: string,
) {
  // Use Lyria API for background music
  // Prompt: "Children's educational music, {mood}, instrumental, looping"
}
```

### Step 5: FFmpeg composition

```ts
// compose-video.ts
import { execSync } from "child_process";

export function composeVideo(opts: {
  mascotVideo: string;    // from Remotion
  background: string;     // from Veo
  voiceover: string;      // from Gemini TTS
  music: string;          // from Lyria
  output: string;
}) {
  // Layer: background (bottom) → mascot (overlay, chroma key or alpha) → audio
  execSync(`ffmpeg -i ${opts.background} -i ${opts.mascotVideo} \
    -i ${opts.voiceover} -i ${opts.music} \
    -filter_complex "[0:v][1:v]overlay=0:0[v]; \
    [2:a][3:a]amix=inputs=2:duration=longest[a]" \
    -map "[v]" -map "[a]" \
    -c:v libx264 -preset fast -crf 23 \
    ${opts.output}`);
}
```

### Step 6: Add npm scripts

```json
{
  "scripts": {
    "video:voiceover": "tsx scripts/video-pipeline/generate-voiceover.ts",
    "video:background": "tsx scripts/video-pipeline/generate-background.ts",
    "video:music": "tsx scripts/video-pipeline/generate-music.ts",
    "video:compose": "tsx scripts/video-pipeline/compose-video.ts",
    "video:full": "npm run remotion:render && npm run video:compose"
  }
}
```

## Todo

- [ ] Create scripts/video-pipeline/ directory
- [ ] Create pipeline-config.ts
- [ ] Add GEMINI_API_KEY to .env.example
- [ ] Implement generate-voiceover.ts
- [ ] Implement generate-background.ts
- [ ] Implement generate-music.ts
- [ ] Implement compose-video.ts (FFmpeg)
- [ ] Add npm scripts
- [ ] Test TTS with sample Vietnamese script
- [ ] Test background generation
- [ ] Test full pipeline: script → rendered video
- [ ] Document pipeline usage

## Success Criteria

- TTS generates clear Vietnamese voiceover
- Background video matches educational cartoon style
- Music appropriate for children's content
- FFmpeg composes all layers into single MP4
- Full pipeline runnable with single command

## Unresolved Questions

- Gemini TTS API availability for Vietnamese -- need to verify
- Veo 3.1 API access -- may need waitlist approval
- Lyria API access -- same concern
- Fallback: use pre-recorded voiceover + stock backgrounds if AI APIs unavailable
