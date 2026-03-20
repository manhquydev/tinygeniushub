import { execSync } from "child_process";
import { existsSync } from "fs";
import { PIPELINE_CONFIG } from "./pipeline-config";

interface ComposeOptions {
  mascotVideo: string;
  background?: string;
  voiceover?: string;
  music?: string;
  output: string;
}

export function composeVideo(opts: ComposeOptions) {
  // Validate inputs
  if (!existsSync(opts.mascotVideo)) {
    console.error(`Mascot video not found: ${opts.mascotVideo}`);
    return;
  }

  const inputs: string[] = [];
  const filterParts: string[] = [];
  let inputIndex = 0;

  // Always have mascot video
  inputs.push(`-i "${opts.mascotVideo}"`);
  const mascotIdx = inputIndex++;

  // Optional background
  if (opts.background && existsSync(opts.background)) {
    inputs.push(`-i "${opts.background}"`);
    const bgIdx = inputIndex++;
    filterParts.push(`[${bgIdx}:v]scale=${PIPELINE_CONFIG.video.width}:${PIPELINE_CONFIG.video.height}[bg]`);
    filterParts.push(`[bg][${mascotIdx}:v]overlay=(W-w)/2:(H-h)/2[v]`);
  } else {
    filterParts.push(`[${mascotIdx}:v]scale=${PIPELINE_CONFIG.video.width}:${PIPELINE_CONFIG.video.height}[v]`);
  }

  // Audio mixing
  const audioInputs: string[] = [];
  if (opts.voiceover && existsSync(opts.voiceover)) {
    inputs.push(`-i "${opts.voiceover}"`);
    audioInputs.push(`[${inputIndex++}:a]`);
  }
  if (opts.music && existsSync(opts.music)) {
    inputs.push(`-i "${opts.music}"`);
    audioInputs.push(`[${inputIndex++}:a]`);
  }

  let audioFilter = "";
  if (audioInputs.length > 1) {
    audioFilter = `; ${audioInputs.join("")}amix=inputs=${audioInputs.length}:duration=longest[a]`;
  } else if (audioInputs.length === 1) {
    audioFilter = `; ${audioInputs[0]}acopy[a]`;
  }

  const filterComplex = filterParts.join("; ") + audioFilter;
  const maps = ['-map "[v]"'];
  if (audioInputs.length > 0) maps.push('-map "[a]"');

  const cmd = [
    "ffmpeg -y",
    ...inputs,
    `-filter_complex "${filterComplex}"`,
    ...maps,
    "-c:v libx264 -preset fast -crf 23",
    audioInputs.length > 0 ? "-c:a aac -b:a 128k" : "",
    `"${opts.output}"`,
  ].filter(Boolean).join(" ");

  console.log("Running FFmpeg:", cmd);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`Output saved to ${opts.output}`);
  } catch (err) {
    console.error("FFmpeg failed. Make sure FFmpeg is installed.");
  }
}

// CLI entry point
if (process.argv[1]?.includes("compose-video")) {
  composeVideo({
    mascotVideo: process.argv[2] || "out/lesson.mp4",
    background: process.argv[3],
    voiceover: process.argv[4],
    music: process.argv[5],
    output: process.argv[6] || "out/final.mp4",
  });
}
