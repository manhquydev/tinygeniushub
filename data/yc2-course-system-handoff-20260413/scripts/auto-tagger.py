#!/usr/bin/env python3
import argparse
import json
import os
import re
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path

ALLOWED_SOURCES = ("abeka", "littlefox", "playtt", "playgg")

ROOT = Path(__file__).resolve().parents[1]
UNIFIED_DB = ROOT / "unified_content.db"
YC2_DB = Path(os.environ.get("YC2_DATABASE_PATH", ROOT / "output" / "database" / "topic-courses-yc2.db"))
PATTERNS = ROOT / "scripts" / "tag-patterns.json"
GRADE_TAG_BY_VALUE = {
    "k4": "grade-k4",
    "k5": "grade-k5",
    "g1": "grade-1",
    "g2": "grade-2",
    "g3": "grade-3",
    "g4": "grade-4",
    "g5": "grade-5",
    "g6": "grade-6",
}
LEVEL_TAG_BY_VALUE = {
    "level-1": "level-1",
    "level-2": "level-2",
    "level-3": "level-3",
    "level-4": "level-4",
    "level-5": "level-5",
    "level-6": "level-6",
    "s01": "level-1",
    "s02": "level-2",
    "s03": "level-3",
    "s04": "level-4",
    "s05": "level-5",
    "s06": "level-6",
}
SUBJECT_SIGNAL_TERMS = {
    "arithmetic": ("arithmetic", "math", "number", "counting", "numberblocks"),
    "algebra": ("algebra", "equation", "variable", "expression"),
    "geometry": ("geometry", "shape", "angle", "perimeter"),
    "consumer-math": ("consumer math", "money", "clock", "calendar", "time"),
    "phonics": ("phonics", "alphablocks", "letter", "sound", "spelling"),
    "reading": ("reading", "story", "book", "episode", "muzzy", "littlefox"),
    "writing": ("writing", "composition", "sentence", "paragraph", "cursive", "manuscript"),
    "grammar": ("grammar", "noun", "verb", "adjective", "punctuation", "spelling", "language art"),
    "general-science": ("science", "experiment", "nature", "discover", "observation"),
    "biology": ("biology", "animal", "plant", "life", "cell"),
    "chemistry": ("chemistry", "chemical", "reaction", "atom", "molecule"),
    "physics": ("physics", "force", "motion", "energy", "gravity"),
    "history": ("history", "ancient", "civilization", "timeline"),
    "geography": ("geography", "map", "country", "continent", "region"),
    "civics": ("civics", "government", "citizen", "constitution", "law"),
    "bible-stories": ("bible", "scripture", "gospel", "testament"),
    "character-ed": ("character", "virtue", "honesty", "kindness", "respect", "classroom routines"),
    "visual-arts": ("art", "drawing", "painting", "color", "design"),
    "music": ("music", "song", "melody", "rhythm", "sing"),
    "health-safety": ("health", "safety", "hygiene", "exercise", "nutrition"),
    "social-skills": ("social", "friend", "sharing", "respect", "team", "classroom routines"),
}
SUBJECT_SIGNAL_GROUPS = {
    "language-art": ("phonics", "reading", "writing", "grammar"),
    "social-studies": ("history", "geography", "civics"),
    "science": ("general-science", "biology", "chemistry", "physics"),
    "math": ("arithmetic", "algebra", "geometry", "consumer-math"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="YC2 auto tagger")
    parser.add_argument("--unified-db", default=str(UNIFIED_DB))
    parser.add_argument("--yc2-db", default=str(YC2_DB))
    parser.add_argument("--patterns", default=str(PATTERNS))
    parser.add_argument("--confidence", type=float, default=0.7)
    parser.add_argument("--report", default=str(ROOT / "reports" / "yc2-tagging-stats.json"))
    return parser.parse_args()


def parse_playtt_sub_provider(collection_key: str, provider: str, course: str) -> str:
    text = f"{collection_key} {provider} {course}".lower()
    known = ["acellus", "heinemann", "alphablocks", "numberblocks", "teded", "peppapig", "ben10", "noep"]
    for token in known:
        if token in text:
            return token
    if provider:
        return re.sub(r"[^a-z0-9]+", "-", provider.lower()).strip("-")
    return "default"


def infer_source_value(source: str, row: sqlite3.Row, sub_provider: str) -> str:
    text = f"{row['collection_key']} {row['provider']} {row['course']} {row['grade']} {row['title']}".lower()
    if source == "abeka":
        m = re.search(r"\bk[45]\b|\bg[1-6]\b", text)
        return m.group(0) if m else "g1"
    if source == "littlefox":
        m = re.search(r"level[- ]?([1-9])", text)
        return f"level-{m.group(1)}" if m else "level-3"
    if source == "playtt":
        m = re.search(r"\bgk\b|\bg[1-5]\b|public", text)
        if m:
            return m.group(0)
        m = re.search(r"\bs0?([1-9])\b", text)
        if m:
            return f"s0{m.group(1)}" if sub_provider in {"numberblocks", "alphablocks"} else "public"
        return "public"
    if source == "playgg":
        m = re.search(r"\bs0?([1-9])\b", text)
        return f"s0{m.group(1)}" if m else "s03"
    return "public"


def build_text(row: sqlite3.Row) -> str:
    parts = [
        row["source_key"] or "",
        row["collection_key"] or "",
        row["provider"] or "",
        row["course"] or "",
        row["grade"] or "",
        row["title"] or "",
        row["description"] or "",
    ]
    return " ".join(parts).lower()


def matched_keywords(keywords: list[str], text: str) -> list[str]:
    hits = []
    for keyword in keywords:
        token = keyword.strip().lower()
        if token and token in text:
            hits.append(token)
    return sorted(set(hits))


def infer_level_tags(source: str, source_value: str) -> set[str]:
    tags: set[str] = set()
    if source_value in GRADE_TAG_BY_VALUE:
        tags.add(GRADE_TAG_BY_VALUE[source_value])
    if source_value in LEVEL_TAG_BY_VALUE:
        tags.add(LEVEL_TAG_BY_VALUE[source_value])
    if source == "playtt" and source_value in {"gk", "g1", "g2", "g3", "g4", "g5"}:
        if source_value == "gk":
            tags.add("grade-k4")
        else:
            tags.add(f"grade-{source_value[-1]}")
    return tags


def has_subject_signal(slug: str, text: str) -> bool:
    if any(term in text for term in SUBJECT_SIGNAL_TERMS.get(slug, ())):
        return True
    for term, tags in SUBJECT_SIGNAL_GROUPS.items():
        if slug in tags and term in text:
            return True
    if "alphablocks" in text and slug in {"phonics", "reading"}:
        return True
    if "numberblocks" in text and slug in {"arithmetic"}:
        return True
    return False


def apply_structured_boost(
    row: sqlite3.Row,
    source: str,
    source_value: str,
    tag: dict[str, str],
    text: str,
    hits: list[str],
) -> list[str]:
    boosted = set(hits)
    category = tag.get("category", "")
    slug = tag.get("slug", "")

    if category == "source" and slug == f"source-{source}":
        # Force exact source tagging so every allowed source is represented.
        boosted.update({f"source:{source}", "source:exact"})

    if category == "level" and slug in infer_level_tags(source, source_value):
        boosted.update({f"level:{source_value}", "level:structured"})

    if category == "subject":
        structured_text = " ".join(
            [
                source,
                row["provider"] or "",
                row["course"] or "",
                row["collection_key"] or "",
                row["title"] or "",
                row["description"] or "",
            ]
        ).lower()
        if has_subject_signal(slug, structured_text):
            boosted.add(f"subject:{slug}")

    return sorted(boosted)


def confidence_for_matches(count: int) -> float:
    return min(1.0, 0.4 + 0.15 * count)


def load_mapping(conn: sqlite3.Connection) -> dict[tuple[str, str, str], tuple[int, int | None, int | None]]:
    cursor = conn.execute(
        "SELECT source, sub_provider, source_value, unified_level, age_min, age_max FROM difficulty_mapping"
    )
    mapping = {}
    for source, sub_provider, source_value, level, age_min, age_max in cursor.fetchall():
        mapping[(source, sub_provider, source_value)] = (level, age_min, age_max)
    return mapping


def lookup_difficulty(mapping: dict, source: str, sub_provider: str, source_value: str) -> int:
    for key in [(source, sub_provider, source_value), (source, "", source_value)]:
        if key in mapping:
            return mapping[key][0]
    defaults = {"abeka": 4, "littlefox": 4, "playtt": 4, "playgg": 5}
    return defaults[source]


def main() -> None:
    args = parse_args()
    patterns = json.loads(Path(args.patterns).read_text(encoding="utf-8"))["tags"]

    with sqlite3.connect(args.unified_db) as uconn, sqlite3.connect(args.yc2_db) as yconn:
        uconn.row_factory = sqlite3.Row
        yconn.row_factory = sqlite3.Row
        mapping = load_mapping(yconn)
        yconn.execute("DELETE FROM content_tags WHERE content_source IN ('abeka','littlefox','playtt','playgg')")
        inserts = []
        tagged_videos = set()
        source_totals = Counter()
        source_tagged = Counter()
        tag_totals = Counter()
        confidence_bins = defaultdict(int)
        playtt_sub_provider_counts = Counter()

        rows = uconn.execute(
            """
            SELECT v.video_key, v.collection_key, v.title, v.description,
                   c.source_key, c.provider, c.course, c.grade
            FROM content_video v
            JOIN content_collection c ON c.collection_key = v.collection_key
            WHERE c.source_key IN ('abeka','littlefox','playtt','playgg')
            """
        )

        for row in rows:
            source = row["source_key"]
            source_totals[source] += 1
            text = build_text(row)
            sub_provider = parse_playtt_sub_provider(row["collection_key"], row["provider"], row["course"]) if source == "playtt" else ""
            if source == "playtt":
                playtt_sub_provider_counts[sub_provider] += 1
            source_value = infer_source_value(source, row, sub_provider)
            difficulty = lookup_difficulty(mapping, source, sub_provider, source_value)

            video_had_tag = False
            for tag in patterns:
                hits = matched_keywords(tag["keywords"], text)
                hits = apply_structured_boost(
                    row=row,
                    source=source,
                    source_value=source_value,
                    tag=tag,
                    text=text,
                    hits=hits,
                )
                score = confidence_for_matches(len(hits))
                if score < max(args.confidence, float(tag.get("threshold", 0.7))):
                    continue
                video_had_tag = True
                tag_totals[tag["slug"]] += 1
                confidence_bins[f"{score:.2f}"] += 1
                inserts.append(
                    (
                        source,
                        row["collection_key"],
                        row["video_key"],
                        tag["slug"],
                        score,
                        difficulty,
                        ",".join(hits[:8]),
                    )
                )

            if video_had_tag:
                tagged_videos.add((source, row["collection_key"], row["video_key"]))
                source_tagged[source] += 1

        yconn.executemany(
            """
            INSERT INTO content_tags
            (content_source, collection_key, video_key, tag_slug, confidence, difficulty_suggested, matched_keywords)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(content_source, collection_key, video_key, tag_slug)
            DO UPDATE SET confidence=excluded.confidence,
                          difficulty_suggested=excluded.difficulty_suggested,
                          matched_keywords=excluded.matched_keywords,
                          created_at=CURRENT_TIMESTAMP
            """,
            inserts,
        )
        yconn.commit()

    total_videos = sum(source_totals.values())
    total_tagged = len(tagged_videos)
    coverage = (total_tagged / total_videos * 100) if total_videos else 0.0
    report = {
        "sources": list(ALLOWED_SOURCES),
        "excluded_sources": ["phim", "littlefoxcn"],
        "total_videos": total_videos,
        "tagged_videos": total_tagged,
        "coverage_percent": round(coverage, 2),
        "tag_applications": len(inserts),
        "source_breakdown": {
            s: {
                "videos": source_totals[s],
                "tagged_videos": source_tagged[s],
                "coverage_percent": round((source_tagged[s] / source_totals[s] * 100), 2) if source_totals[s] else 0.0,
            }
            for s in ALLOWED_SOURCES
        },
        "top_tags": tag_totals.most_common(20),
        "confidence_distribution": dict(sorted(confidence_bins.items())),
        "playtt_sub_provider_analysis": dict(playtt_sub_provider_counts),
    }
    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
