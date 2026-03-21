/**
 * Google Text-to-Speech service for pre-generating placement test audio.
 * Generates audio files for Phonics test items and saves to public/audio/placement/.
 */

import fs from "fs";
import path from "path";

const TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "placement");

function ensureAudioDir(): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

/**
 * Generate TTS audio for a phonics item text.
 * Saves to /public/audio/placement/{itemId}.mp3
 * Returns the public URL path.
 */
export async function generatePlacementAudio(text: string, itemId: string): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(itemId)) {
    throw new Error("Invalid itemId: must be alphanumeric with hyphens or underscores only");
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable not set");
  }

  ensureAudioDir();

  const filePath = path.join(AUDIO_DIR, `${itemId}.mp3`);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(AUDIO_DIR))) {
    throw new Error("Invalid audio file path");
  }

  // Skip if already generated
  if (fs.existsSync(filePath)) {
    return `/audio/placement/${itemId}.mp3`;
  }

  const response = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-F",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.85, // Slightly slower for children
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { audioContent: string };
  const audioBuffer = Buffer.from(data.audioContent, "base64");

  fs.writeFileSync(filePath, audioBuffer);

  return `/audio/placement/${itemId}.mp3`;
}

/**
 * Batch generate audio for multiple items.
 * Returns a map of itemId -> audioUrl.
 * Skips items where audio already exists.
 */
export async function batchGenerateAudio(
  items: Array<{ id: string; text: string }>,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const item of items) {
    try {
      const url = await generatePlacementAudio(item.text, item.id);
      results.set(item.id, url);
    } catch (error) {
      console.error(`Failed to generate audio for item ${item.id}:`, error);
      // Continue with other items
    }
  }

  return results;
}
