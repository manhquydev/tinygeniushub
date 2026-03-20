import { writeFileSync, mkdirSync, existsSync } from "fs";

type MusicMood = "happy" | "calm" | "exciting" | "curious";

const MOOD_PROMPTS: Record<MusicMood, string> = {
  happy: "Children's educational background music, happy upbeat melody, instrumental, ukulele and xylophone",
  calm: "Children's educational background music, calm gentle melody, instrumental, soft piano",
  exciting: "Children's educational background music, exciting energetic melody, instrumental, playful percussion",
  curious: "Children's educational background music, curious wonder melody, instrumental, light strings and bells",
};

export async function generateMusic(
  mood: MusicMood,
  durationSeconds: number,
  outputPath: string,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set. Skipping music generation.");
    console.log("To generate music, set GEMINI_API_KEY in .env");
    return;
  }

  const dir = outputPath.substring(0, outputPath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const prompt = `${MOOD_PROMPTS[mood]}, ${durationSeconds} seconds long, loopable`;
  console.log(`Generating ${mood} music (${durationSeconds}s)...`);

  // Lyria / MusicFX API via Gemini
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
        },
      }),
    },
  );

  if (!response.ok) {
    console.error("Music API error:", response.status, await response.text());
    return;
  }

  const data = await response.json();
  const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (audioData) {
    writeFileSync(outputPath, Buffer.from(audioData, "base64"));
    console.log(`Music saved to ${outputPath}`);
  } else {
    console.error("No audio data in response. Music generation may require Lyria API access.");
  }
}

// CLI entry point
if (process.argv[1]?.includes("generate-music")) {
  const mood = (process.argv[2] || "happy") as MusicMood;
  const duration = parseInt(process.argv[3] || "30");
  const output = process.argv[4] || "out/assets/music.mp3";
  generateMusic(mood, duration, output).catch(console.error);
}
