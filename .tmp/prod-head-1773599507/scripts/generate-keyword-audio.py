# -*- coding: utf-8 -*-
"""
Generate per-keyword TTS audio for demonstrate step audio-driven sync.
Each keyword gets its own short MP3: "ant!" spoken clearly for a child.
"""

import os
import sys
import wave
import subprocess
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Vertex AI config — uses gcloud access token
VERTEX_PROJECT = "project-ee27e1d4-eab0-406a-a19"
VERTEX_LOCATION = "us-central1"
TTS_MODEL = "gemini-2.5-flash-tts"

import google.auth.credentials

class _GcloudTokenCreds(google.auth.credentials.Credentials):
    def __init__(self):
        super().__init__()
        self.token = os.environ.get("GCLOUD_TOKEN", "")
    def refresh(self, request):
        pass
    @property
    def valid(self):
        return bool(self.token)

if not os.environ.get("GCLOUD_TOKEN"):
    print("ERROR: GCLOUD_TOKEN not set. Run: export GCLOUD_TOKEN=$(gcloud auth print-access-token)")
    sys.exit(1)

from google import genai
from google.genai import types

PROJECT_ROOT = Path(__file__).parent.parent
PUBLIC_AUDIO = PROJECT_ROOT / "public" / "audio" / "lessons"

FFMPEG_PATH = r"C:/Users/manhquy/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe"

# lesson_id -> list of keywords for demonstrate step
KEYWORD_AUDIO = {
    "am-a": ["ant", "apple", "map"],
    "am-e": ["egg", "bed", "pen"],
    "dien-chu-cvc": ["cat", "bed", "sit"],
    "van-at": ["cat", "bat", "hat"],
    "nghe-am-b": ["ball", "bat", "bus"],
}

VOICE_INSTRUCTION = """You are a warm Vietnamese kindergarten teacher speaking to children aged 2-6.
Speak VERY SLOWLY and CLEARLY. Pronounce this single English word with exaggerated clarity.
Say the word twice with a brief pause: "[word]... [word]!"
Sound encouraging and warm."""


def generate_keyword_audio(client, word):
    prompt = f"{VOICE_INSTRUCTION}\n\nNow say this word: {word}"
    response = client.models.generate_content(
        model=TTS_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
                )
            ),
        ),
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.data:
            return part.inline_data.data, part.inline_data.mime_type
    raise ValueError(f"No audio for: {word}")


def save_wav(pcm_data, wav_path, sample_rate=24000, channels=1, sample_width=2):
    with wave.open(str(wav_path), 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)


def convert_to_mp3(wav_path, mp3_path):
    ffmpeg = FFMPEG_PATH if Path(FFMPEG_PATH).exists() else "ffmpeg"
    result = subprocess.run(
        [ffmpeg, "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-qscale:a", "4", str(mp3_path)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr[-500:]}")
    wav_path.unlink()


def main():
    print("=== Per-Keyword TTS Audio Generator ===")
    client = genai.Client(
        vertexai=True,
        project=VERTEX_PROJECT,
        location=VERTEX_LOCATION,
        credentials=_GcloudTokenCreds(),
    )

    for lesson_id, keywords in KEYWORD_AUDIO.items():
        lesson_dir = PUBLIC_AUDIO / lesson_id
        lesson_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n[Lesson] {lesson_id}")

        for word in keywords:
            mp3_path = lesson_dir / f"kw-{word}.mp3"
            if mp3_path.exists():
                print(f"  [SKIP] kw-{word}.mp3 exists")
                continue

            print(f"  [GEN]  kw-{word}")
            try:
                audio_data, mime_type = generate_keyword_audio(client, word)
                wav_path = lesson_dir / f"kw-{word}.wav"

                if mime_type and "wav" in mime_type.lower():
                    wav_path.write_bytes(audio_data)
                elif mime_type and ("pcm" in mime_type.lower() or "l16" in mime_type.lower()):
                    save_wav(audio_data, wav_path)
                else:
                    if audio_data[:3] == b'ID3' or audio_data[:2] == b'\xff\xfb':
                        mp3_path.write_bytes(audio_data)
                        print(f"  [DONE] kw-{word}.mp3 (direct MP3)")
                        continue
                    else:
                        wav_path.write_bytes(audio_data)

                convert_to_mp3(wav_path, mp3_path)
                print(f"  [DONE] kw-{word}.mp3 ({mp3_path.stat().st_size // 1024}KB)")
            except Exception as e:
                print(f"  [ERR]  kw-{word}: {e}")

    print("\n=== Keyword audio generation complete! ===")


if __name__ == "__main__":
    main()
