import { writeFileSync, mkdirSync, existsSync } from "fs";
import { PIPELINE_CONFIG } from "./pipeline-config";

export async function generateVoiceover(script: string, outputPath: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set. Skipping voiceover generation.");
    console.log("To generate voiceover, set GEMINI_API_KEY in .env");
    return;
  }

  const dir = outputPath.substring(0, outputPath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // Gemini TTS API call
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: script }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: PIPELINE_CONFIG.tts.voice },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    console.error("TTS API error:", response.status, await response.text());
    return;
  }

  const data = await response.json();
  const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (audioData) {
    writeFileSync(outputPath, Buffer.from(audioData, "base64"));
    console.log(`Voiceover saved to ${outputPath}`);
  } else {
    console.error("No audio data in response");
  }
}

// CLI entry point
if (process.argv[1]?.includes("generate-voiceover")) {
  const script = process.argv[2] || "Xin chào các bạn nhỏ! Hôm nay chúng ta sẽ học bài mới.";
  const output = process.argv[3] || "out/assets/voiceover.wav";
  generateVoiceover(script, output).catch(console.error);
}
