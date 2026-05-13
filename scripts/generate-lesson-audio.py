# -*- coding: utf-8 -*-
"""
Generate child-friendly TTS audio files for all 7 interactive demo lessons.
Uses Gemini TTS model with warm, slow Vietnamese female kindergarten teacher voice.
Target audience: children ages 2-6.
"""

import os
import sys
import wave
import subprocess
from pathlib import Path

# Fix Windows console encoding for Vietnamese text
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
    """Static credentials from GCLOUD_TOKEN env var."""
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

# Output base directory
PROJECT_ROOT = Path(__file__).parent.parent
PUBLIC_AUDIO = PROJECT_ROOT / "public" / "audio" / "lessons"

FFMPEG_PATH = r"C:/Users/manhquy/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe"

# Lesson data: id -> list of (step_num, step_type, speech, extra_context)
# Steps with audioUrl in the data files: concept(2), demonstrate(3), reinforce(5), celebrate(6), hook(1), activity(4)
# All steps that have speech text should get audio generated
LESSONS = [
    {
        "id": "am-a",
        "title": "Sounds /a/ and /m/",
        "steps": [
            (1, "hook", "Hello! Today I'll learn the A sound!", "greet warmly, enthusiastic wave"),
            (2, "concept", "This is the sound A. A... A... A. Pronunciation: A as in ant!", "slow clear phonics teaching"),
            (3, "demonstrate", "Listen! ant... apple... map. Can you hear sound A?", "demonstrate words clearly"),
            (4, "activity", "Try it! Which word has the sound A?", "encouraging activity prompt"),
            (5, "reinforce", "Remember! Sound A as in ant, apple. Ah... Ah... Ah!", "gentle review, slow"),
            (6, "celebrate", "Great job! You study so well! Great!", "very enthusiastic celebration"),
        ],
    },
    {
        "id": "am-e",
        "title": "Short sound /e/",
        "steps": [
            (1, "hook", "Hello! Today I'll learn the short E sound!", "greet warmly"),
            (2, "concept", "Short E sound! E... E... E. Pronunciation: E as in egg!", "slow clear phonics"),
            (3, "demonstrate", "Listen! egg... bed... pen. Can you hear the E sound?", "demonstrate words clearly"),
            (4, "activity", "You choose! Which word has the short E sound?", "encouraging prompt"),
            (5, "reinforce", "Remember! Short E sound: egg, bed, pen. E... E... E!", "gentle review"),
            (6, "celebrate", "Great job! You study so well! Bravo!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "dien-chu-cvc",
        "title": "Fill in the letters CVC",
        "steps": [
            (1, "hook", "Hello! Today I will learn CVC structure!", "greet warmly"),
            (2, "concept", "CVC structure! Consonants - Vowels - Consonants. For example: c-a-t!", "slow teaching"),
            (3, "demonstrate", "Any example! cat... bed... sit. Do you see the structure?", "demonstrate clearly"),
            (4, "activity", "Please fill in! Fill in the blanks!", "encouraging prompt"),
            (5, "reinforce", "Remember! CVC is Consonant - Vowel - Consonant!", "gentle review"),
            (6, "celebrate", "Great job! You filled it in correctly! Excellent!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "van-at",
        "title": "Rhyme -at",
        "steps": [
            (1, "hook", "Hello! Today I'll learn the AT rhyme!", "greet warmly"),
            (2, "concept", "This is an AT rhyme! at... at... at. Combine consonants and AT into new words!", "slow phonics"),
            (3, "demonstrate", "Let's see! cat... bat... hat. They all rhyme AT!", "demonstrate clearly"),
            (4, "activity", "Let's arrange it! Going from short to long!", "encouraging prompt"),
            (5, "reinforce", "Remember! cat, bat, hat, flat all rhyme AT!", "gentle review"),
            (6, "celebrate", "Great job! You arranged it correctly! So great!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "nghe-am-b",
        "title": "Listen to the sound /b/",
        "steps": [
            (1, "hook", "Hello! Today I'll learn the B sound!", "greet warmly"),
            (2, "concept", "This B sound! B... B... B. Lips closed and then popped out: B!", "slow clear phonics with mouth instruction"),
            (3, "demonstrate", "Listen! ball... bat... bus. Can you hear the B sound?", "demonstrate clearly"),
            (4, "activity", "Choose correctly! Which word starts with the sound B?", "encouraging prompt"),
            (5, "reinforce", "Remember! B sound as in ball, bat. B... B... B!", "gentle review"),
            (6, "celebrate", "Great job! You chose right! Great!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "so-1-5",
        "title": "Numbers 1 to 5",
        "steps": [
            (1, "hook", "Hello! Today I will learn to count numbers 1 to 5!", "greet warmly"),
            (2, "concept", "Count from 1 to 5! One... two... three... four... five!", "slow clear counting"),
            (3, "demonstrate", "Look here! One apple... Three balls... Five stars!", "demonstrate with enthusiasm"),
            (4, "activity", "Let's count! Count how many dots there are?", "encouraging prompt"),
            (5, "reinforce", "Remember! Count slowly and point to each object: One... two... three...", "gentle slow review"),
            (6, "celebrate", "Great job! You counted correctly! So smart!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "hinh-tron-vuong",
        "title": "Round and square",
        "steps": [
            (1, "hook", "Hello! Today we will learn circles and squares!", "greet warmly"),
            (2, "concept", "These two pictures! Circles... and squares. Round has no corners, square has 4 corners!", "slow teaching"),
            (3, "demonstrate", "Look around! Round clock... Square book!", "demonstrate with discovery"),
            (4, "activity", "You choose! Which one is round?", "encouraging prompt"),
            (5, "reinforce", "Remember! Round has no corners, square has 4 equal corners!", "gentle review"),
            (6, "celebrate", "Great job! You got it right! Super good!", "enthusiastic celebration"),
        ],
    },
]

# TTS voice instruction for child education
VOICE_INSTRUCTION = """You are a warm, nurturing Vietnamese kindergarten teacher speaking to children aged 2-6 years old.
Speak in Vietnamese with a very warm, patient, encouraging tone.
Speak SLOWLY and CLEARLY — about 70% of normal speaking speed.
Use exaggerated, expressive pronunciation to help children learn.
Sound enthusiastic and nurturing, like the kindest teacher in the world.
Make each word clear and distinct."""


def generate_audio_for_text(client: genai.Client, speech_text: str, step_context: str) -> bytes:
    """Generate TTS audio bytes (WAV/PCM) using Gemini native audio model."""
    prompt = f"{VOICE_INSTRUCTION}\n\nNow speak this text naturally to a young child:\n{speech_text}"

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

    # Extract audio data from response
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.data:
            return part.inline_data.data, part.inline_data.mime_type

    raise ValueError(f"No audio data in response for text: {speech_text[:50]}")


def save_wav(pcm_data: bytes, wav_path: Path, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2):
    """Save raw PCM data as WAV file."""
    with wave.open(str(wav_path), 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)


def convert_to_mp3(wav_path: Path, mp3_path: Path):
    """Convert WAV to MP3 using ffmpeg."""
    ffmpeg = FFMPEG_PATH if Path(FFMPEG_PATH).exists() else "ffmpeg"
    result = subprocess.run(
        [ffmpeg, "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-qscale:a", "4", str(mp3_path)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr[-500:]}")
    wav_path.unlink()  # Remove temp WAV


def process_lesson(client: genai.Client, lesson: dict):
    """Generate all audio files for a single lesson."""
    lesson_id = lesson["id"]
    lesson_dir = PUBLIC_AUDIO / lesson_id
    lesson_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[Lesson] {lesson_id} — {lesson['title']}")

    for step_num, step_type, speech, context in lesson["steps"]:
        mp3_path = lesson_dir / f"step-{step_num}-{step_type}.mp3"

        if mp3_path.exists():
            print(f"  [SKIP] step-{step_num}-{step_type}.mp3 already exists")
            continue

        print(f"  [GEN]  step-{step_num} ({step_type}): {speech[:40]}...")

        try:
            audio_data, mime_type = generate_audio_for_text(client, speech, context)

            # Save as WAV first if PCM, then convert to MP3
            wav_path = lesson_dir / f"step-{step_num}-{step_type}.wav"

            if mime_type and "wav" in mime_type.lower():
                # Already WAV format
                wav_path.write_bytes(audio_data)
            elif mime_type and ("pcm" in mime_type.lower() or "l16" in mime_type.lower()):
                # Raw PCM — wrap in WAV container
                save_wav(audio_data, wav_path)
            else:
                # Try to save as-is (may already be MP3 or WAV)
                if audio_data[:3] == b'ID3' or audio_data[:2] == b'\xff\xfb':
                    # Already MP3
                    mp3_path.write_bytes(audio_data)
                    print(f"  [DONE] {mp3_path.name} (direct MP3)")
                    continue
                else:
                    # Assume WAV
                    wav_path.write_bytes(audio_data)

            # Convert WAV -> MP3
            convert_to_mp3(wav_path, mp3_path)
            print(f"  [DONE] {mp3_path.name} ({mp3_path.stat().st_size // 1024}KB)")

        except Exception as e:
            print(f"  [ERR]  step-{step_num}: {e}")
            # Continue with other steps


def main():
    print("=== Lesson TTS Audio Generator ===")
    print(f"Output: {PUBLIC_AUDIO}")
    print(f"Lessons: {len(LESSONS)}")

    client = genai.Client(
        vertexai=True,
        project=VERTEX_PROJECT,
        location=VERTEX_LOCATION,
        credentials=_GcloudTokenCreds(),
    )

    for lesson in LESSONS:
        process_lesson(client, lesson)

    print("\n=== Generation complete! ===")


if __name__ == "__main__":
    main()
