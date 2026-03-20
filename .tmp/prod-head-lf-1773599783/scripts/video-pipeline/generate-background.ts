import { writeFileSync, mkdirSync, existsSync } from "fs";
import { PIPELINE_CONFIG } from "./pipeline-config";

type BackgroundStyle = "classroom" | "outdoor" | "space" | "forest";

const STYLE_PROMPTS: Record<BackgroundStyle, string> = {
  classroom: "Children's educational cartoon classroom background, bright colors, chalkboard, desks, soft lighting, no characters, 2D cartoon style",
  outdoor: "Children's educational cartoon outdoor park background, green trees, blue sky, flowers, no characters, 2D cartoon style",
  space: "Children's educational cartoon space background, planets, stars, galaxy, soft purple-blue palette, no characters, 2D cartoon style",
  forest: "Children's educational cartoon magical forest background, friendly trees, mushrooms, soft green palette, no characters, 2D cartoon style",
};

export async function generateBackground(
  style: BackgroundStyle,
  outputPath: string,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set. Skipping background generation.");
    return;
  }

  const dir = outputPath.substring(0, outputPath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const prompt = STYLE_PROMPTS[style];
  console.log(`Generating ${style} background...`);

  // Use Veo via Gemini API (or Imagen for still images)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
        },
      }),
    },
  );

  if (!response.ok) {
    console.error("Background API error:", response.status, await response.text());
    return;
  }

  const data = await response.json();
  const imageData = data?.predictions?.[0]?.bytesBase64Encoded;
  if (imageData) {
    writeFileSync(outputPath, Buffer.from(imageData, "base64"));
    console.log(`Background saved to ${outputPath}`);
  } else {
    console.error("No image data in response");
  }
}

// CLI entry point
if (process.argv[1]?.includes("generate-background")) {
  const style = (process.argv[2] || "classroom") as BackgroundStyle;
  const output = process.argv[3] || "out/assets/background.png";
  generateBackground(style, output).catch(console.error);
}
