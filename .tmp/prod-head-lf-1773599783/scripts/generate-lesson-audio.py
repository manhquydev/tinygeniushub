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
        "title": "Âm /a/ và /m/",
        "steps": [
            (1, "hook", "Chào con! Hôm nay mình học âm A nhé!", "greet warmly, enthusiastic wave"),
            (2, "concept", "Đây là âm A. A... A... A. Phát âm: A như trong ant!", "slow clear phonics teaching"),
            (3, "demonstrate", "Nghe nào! ant... apple... map. Nghe thấy âm A không?", "demonstrate words clearly"),
            (4, "activity", "Con thử nhé! Từ nào có âm A?", "encouraging activity prompt"),
            (5, "reinforce", "Nhớ lại nào! Âm A như trong ant, apple. A... A... A!", "gentle review, slow"),
            (6, "celebrate", "Giỏi lắm! Con học giỏi quá! Tuyệt vời!", "very enthusiastic celebration"),
        ],
    },
    {
        "id": "am-e",
        "title": "Âm ngắn /e/",
        "steps": [
            (1, "hook", "Chào con! Hôm nay mình học âm E ngắn nhé!", "greet warmly"),
            (2, "concept", "Âm E ngắn! E... E... E. Phát âm: E như trong egg!", "slow clear phonics"),
            (3, "demonstrate", "Nghe nào! egg... bed... pen. Nghe thấy âm E không?", "demonstrate words clearly"),
            (4, "activity", "Con chọn nhé! Từ nào có âm E ngắn?", "encouraging prompt"),
            (5, "reinforce", "Nhớ lại nào! Âm E ngắn: egg, bed, pen. E... E... E!", "gentle review"),
            (6, "celebrate", "Giỏi lắm! Con học giỏi quá! Bravo!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "dien-chu-cvc",
        "title": "Điền chữ CVC",
        "steps": [
            (1, "hook", "Chào con! Hôm nay mình học cấu trúc CVC nhé!", "greet warmly"),
            (2, "concept", "Cấu trúc CVC! Phụ âm - Nguyên âm - Phụ âm. Ví dụ: c-a-t!", "slow teaching"),
            (3, "demonstrate", "Ví dụ nào! cat... bed... sit. Con thấy cấu trúc chưa?", "demonstrate clearly"),
            (4, "activity", "Con điền nhé! Điền vào chỗ trống nào!", "encouraging prompt"),
            (5, "reinforce", "Nhớ lại nào! CVC là Phụ âm - Nguyên âm - Phụ âm!", "gentle review"),
            (6, "celebrate", "Giỏi lắm! Con điền đúng rồi! Xuất sắc!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "van-at",
        "title": "Vần -at",
        "steps": [
            (1, "hook", "Chào con! Hôm nay mình học vần AT nhé!", "greet warmly"),
            (2, "concept", "Đây là vần AT! at... at... at. Ghép phụ âm và AT thành từ mới!", "slow phonics"),
            (3, "demonstrate", "Xem nào! cat... bat... hat. Tất cả đều có vần AT!", "demonstrate clearly"),
            (4, "activity", "Sắp xếp nhé! Sắp từ ngắn đến dài nào!", "encouraging prompt"),
            (5, "reinforce", "Nhớ lại nào! cat, bat, hat, flat đều có vần AT!", "gentle review"),
            (6, "celebrate", "Giỏi lắm! Con sắp xếp đúng rồi! Tuyệt quá!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "nghe-am-b",
        "title": "Nghe âm /b/",
        "steps": [
            (1, "hook", "Chào con! Hôm nay mình học âm B nhé!", "greet warmly"),
            (2, "concept", "Âm B này! B... B... B. Môi khép lại rồi bật ra: B!", "slow clear phonics with mouth instruction"),
            (3, "demonstrate", "Nghe đây! ball... bat... bus. Nghe thấy âm B không?", "demonstrate clearly"),
            (4, "activity", "Chọn đúng nhé! Từ nào bắt đầu bằng âm B?", "encouraging prompt"),
            (5, "reinforce", "Nhớ lại nào! Âm B như trong ball, bat. B... B... B!", "gentle review"),
            (6, "celebrate", "Giỏi lắm! Con chọn đúng rồi! Tuyệt vời!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "so-1-5",
        "title": "Số 1 đến 5",
        "steps": [
            (1, "hook", "Chào con! Hôm nay mình học đếm số 1 đến 5 nhé!", "greet warmly"),
            (2, "concept", "Đếm từ 1 đến 5! Một... hai... ba... bốn... năm!", "slow clear counting"),
            (3, "demonstrate", "Xem đây! Một táo... Ba bóng... Năm sao!", "demonstrate with enthusiasm"),
            (4, "activity", "Con đếm nhé! Đếm xem có mấy chấm tròn?", "encouraging prompt"),
            (5, "reinforce", "Nhớ lại nào! Đếm chậm và chỉ vào từng vật: Một... hai... ba...", "gentle slow review"),
            (6, "celebrate", "Giỏi lắm! Con đếm đúng rồi! Thông minh quá!", "enthusiastic celebration"),
        ],
    },
    {
        "id": "hinh-tron-vuong",
        "title": "Hình tròn và vuông",
        "steps": [
            (1, "hook", "Chào con! Hôm nay mình học hình tròn và hình vuông nhé!", "greet warmly"),
            (2, "concept", "Hai hình này! Hình tròn... và hình vuông. Tròn không có góc, vuông có 4 góc!", "slow teaching"),
            (3, "demonstrate", "Tìm xung quanh! Đồng hồ hình tròn... Sách hình vuông!", "demonstrate with discovery"),
            (4, "activity", "Con chọn nhé! Cái nào có hình tròn?", "encouraging prompt"),
            (5, "reinforce", "Nhớ lại nào! Tròn không có góc, vuông có 4 góc bằng nhau!", "gentle review"),
            (6, "celebrate", "Giỏi lắm! Con nhận biết đúng rồi! Siêu giỏi!", "enthusiastic celebration"),
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
