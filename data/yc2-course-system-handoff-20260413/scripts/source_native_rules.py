#!/usr/bin/env python3
import json
import re
from pathlib import Path
from typing import Optional

ALLOWED_SOURCES = ("abeka", "littlefox", "playtt", "playgg")
NOISE_TOKENS = {"css", "images", "image", "js", "javascript", "favicon", "public"}
TARGET_ABEKA_GRADES = ("k4", "k5", "g1", "g2", "g3", "g4", "g5", "g6")
PLAY_PROVIDERS = (
    "acellus",
    "alphablocks",
    "numberblocks",
    "teded",
    "heinemann",
    "muzzy",
    "kle",
    "noep",
    "peppapig",
    "ben10",
    "little-seed",
    "gogo",
)
ROOT = Path(__file__).resolve().parents[1]
LITTLEFOX_FIXED_MAP_PATH = ROOT / "scripts" / "littlefox-fs-level-map.json"


def slugify(value: str, default: str = "default") -> str:
    raw = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return raw or default


def has_noise_tokens(*parts: str) -> bool:
    text = " ".join(part or "" for part in parts).lower()
    return any(token in text for token in NOISE_TOKENS)


def parse_abeka_grade(*parts: str) -> str:
    text = " ".join(part or "" for part in parts).lower()
    compact = re.sub(r"[^a-z0-9]+", " ", text)

    # Canonical short patterns: k4, k-5, g1, g-6, g10...
    short_match = re.search(r"\b([kg])\s*[- ]?\s*(1[0-2]|[1-9])\b", compact)
    if short_match:
        prefix = short_match.group(1)
        value = int(short_match.group(2))
        if prefix == "k" and value in {4, 5}:
            return f"k{value}"
        if prefix == "g":
            return f"g{value}"

    # Verbose forms: grade 1, kindergarten 4 / kindergarten 5.
    grade_match = re.search(r"\bgrade\s*(1[0-2]|[1-9])\b", compact)
    if grade_match:
        return f"g{int(grade_match.group(1))}"
    kinder_match = re.search(r"\bkindergarten\s*([45])\b", compact)
    if kinder_match:
        return f"k{kinder_match.group(1)}"

    return "unknown"


def parse_lesson_no(*parts: str) -> Optional[int]:
    text = " ".join(part or "" for part in parts).lower()
    patterns = (
        r"\blesson(?:\s*no\.?)?\s*[-:#]?\s*(\d{1,3})\b",
        r"\bl\s*[-:#]?\s*(\d{1,3})\b",
        r"\bunit\s*[-:#]?\s*(\d{1,3})\b",
    )
    for pattern in patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        value = int(match.group(1))
        if 1 <= value <= 200:
            return value
    # Last-resort numeric extraction near "lesson"-like tokens.
    match = re.search(r"(?:lesson|unit|chapter)[^0-9]{0,6}(\d{1,3})", text)
    if match:
        value = int(match.group(1))
        if 1 <= value <= 200:
            return value
    # Generic fallback: first standalone small integer.
    match = re.search(r"\b([1-9]\d{0,2})\b", text)
    if match:
        value = int(match.group(1))
        if 1 <= value <= 200:
            return value
    return None


def infer_grade_from_title(*parts: str) -> Optional[str]:
    text = " ".join(part or "" for part in parts).lower()
    direct = parse_abeka_grade(text)
    if direct != "unknown":
        return direct if direct in TARGET_ABEKA_GRADES else None
    match = re.search(
        r"\b(?:arithmetic|phonics|spelling|reading|writing|language arts?|math)\s*([1-6])\b",
        text,
    )
    if match:
        return f"g{match.group(1)}"
    return None


def normalize_abeka_grade(raw_grade: str, lesson_no: Optional[int], title: str) -> str:
    if raw_grade in TARGET_ABEKA_GRADES:
        return raw_grade
    inferred_from_title = infer_grade_from_title(title)
    if inferred_from_title:
        return inferred_from_title
    if lesson_no is not None:
        # Deterministic fallback for out-of-scope/missing grades.
        if lesson_no <= 20:
            return "k4"
        if lesson_no <= 40:
            return "k5"
        if lesson_no <= 70:
            return "g1"
        if lesson_no <= 95:
            return "g2"
        if lesson_no <= 115:
            return "g3"
        if lesson_no <= 135:
            return "g4"
        if lesson_no <= 152:
            return "g5"
        return "g6"
    return "g6"


def load_littlefox_fixed_map() -> dict[str, int]:
    if not LITTLEFOX_FIXED_MAP_PATH.exists():
        return {}
    payload = json.loads(LITTLEFOX_FIXED_MAP_PATH.read_text(encoding="utf-8"))
    if isinstance(payload, dict):
        return {
            key.upper(): int(value)
            for key, value in payload.items()
            if isinstance(key, str) and str(key).upper().startswith("FS")
        }
    return {}


LITTLEFOX_FIXED_MAP = load_littlefox_fixed_map()


def infer_littlefox_level(*parts: str) -> str:
    text = " ".join(part or "" for part in parts).lower()
    match = re.search(r"level[- ]?([1-9])", text)
    if match:
        return f"level-{match.group(1)}"
    fs_match = re.search(r"\bfs0*([0-9]{1,4})\b", text)
    if not fs_match:
        return "level-unknown"
    fs_key = f"FS{int(fs_match.group(1)):04d}"
    if fs_key in LITTLEFOX_FIXED_MAP:
        return f"level-{LITTLEFOX_FIXED_MAP[fs_key]}"
    fs_num = int(fs_match.group(1))
    # Fixed fallback ranges when FS code does not exist in fixed map.
    if fs_num <= 20:
        level = 1
    elif fs_num <= 40:
        level = 2
    elif fs_num <= 60:
        level = 3
    elif fs_num <= 80:
        level = 4
    elif fs_num <= 100:
        level = 5
    elif fs_num <= 120:
        level = 6
    elif fs_num <= 140:
        level = 7
    elif fs_num <= 160:
        level = 8
    else:
        level = 9
    return f"level-{level}"


def parse_play_sub_provider(*parts: str) -> str:
    text = " ".join(part or "" for part in parts).lower()
    for provider in PLAY_PROVIDERS:
        if provider.replace("-", "") in text.replace("-", ""):
            return provider
    if "school bus" in text:
        return "school-bus"
    if "five little monkeys" in text:
        return "five-little-monkeys"
    if "little seed" in text:
        return "little-seed"
    return slugify(parts[0] or parts[1] or "", default="misc")


def source_native_bucket(
    source: str,
    provider: str,
    course: str,
    grade: str,
    collection_key: str,
    title: str,
) -> Optional[tuple[str, str]]:
    if source not in ALLOWED_SOURCES:
        return None
    if source in {"playtt", "playgg"} and has_noise_tokens(provider, course, collection_key, title):
        return None
    if source == "abeka":
        raw_grade = parse_abeka_grade(grade, provider, course, title, collection_key)
        lesson_no = parse_lesson_no(course, title, collection_key)
        grade_key = normalize_abeka_grade(raw_grade, lesson_no, title)
        label = f"Abeka {grade_key.upper()}"
        return (f"grade-{grade_key}", label)
    if source == "littlefox":
        level_key = infer_littlefox_level(provider, course, title, collection_key)
        level_label = level_key.replace("-", " ").title()
        return (level_key, f"Little Fox {level_label}")
    provider_key = parse_play_sub_provider(provider, course, collection_key, title)
    label = provider_key.replace("-", " ").title()
    prefix = "PlayTT" if source == "playtt" else "PlayGG"
    return (provider_key, f"{prefix} {label}")
