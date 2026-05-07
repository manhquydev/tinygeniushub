#!/usr/bin/env python3
import os
import re
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
YC2_DB = Path(os.environ.get("YC2_DATABASE_PATH", ROOT / "output" / "database" / "topic-courses-yc2.db"))
UNIFIED_DB = ROOT / "unified_content.db"
REPORT_PATH = ROOT / "reports" / "yc2-topic-course-report.md"
DEFAULT_SOURCE_QUOTA_MODE = "hard"
DEFAULT_ABEKA_MAX_RATIO = 0.35

import sys

sys.path.insert(0, str(ROOT / "mock_api_fastapi"))
from tag_service import CourseGenerationService  # noqa: E402


def parse_playtt_sub_provider(collection_key: str, provider: str, course: str) -> str:
    text = f"{collection_key} {provider} {course}".lower()
    known = ["acellus", "heinemann", "alphablocks", "numberblocks", "teded", "peppapig", "ben10", "noep", "muzzy", "kle"]
    for token in known:
        if token in text:
            return token
    if provider:
        return re.sub(r"[^a-z0-9]+", "-", provider.lower()).strip("-")
    return "default"


def templates(topic_map: dict[str, int]) -> list[dict]:
    return [
        {"title": "Math Number Sense Foundations", "topic_id": topic_map["mathematics"], "difficulty": 3, "tags": ["arithmetic", "grade-1", "level-2"]},
        {"title": "Geometry with Stories", "topic_id": topic_map["mathematics"], "difficulty": 4, "tags": ["geometry", "reading", "level-3"]},
        {"title": "Algebra Early Practice", "topic_id": topic_map["mathematics"], "difficulty": 6, "tags": ["algebra", "arithmetic", "level-4"]},
        {"title": "Phonics Core Builder", "topic_id": topic_map["language-arts"], "difficulty": 2, "tags": ["phonics", "reading", "level-1"]},
        {"title": "Reading Comprehension Mix", "topic_id": topic_map["language-arts"], "difficulty": 4, "tags": ["reading", "grammar", "level-3"]},
        {"title": "Grammar in Context", "topic_id": topic_map["language-arts"], "difficulty": 5, "tags": ["grammar", "writing", "level-4"]},
        {"title": "Science Discovery Lab", "topic_id": topic_map["science"], "difficulty": 4, "tags": ["general-science", "reading", "level-3"]},
        {"title": "Biology and Nature Basics", "topic_id": topic_map["science"], "difficulty": 4, "tags": ["biology", "general-science", "level-3"]},
        {"title": "Physics Concepts for Kids", "topic_id": topic_map["science"], "difficulty": 6, "tags": ["physics", "general-science", "level-5"]},
        {"title": "World History Stories", "topic_id": topic_map["social-studies"], "difficulty": 5, "tags": ["history", "reading", "level-4"]},
        {"title": "Geography Around Us", "topic_id": topic_map["social-studies"], "difficulty": 4, "tags": ["geography", "reading", "level-3"]},
        {"title": "ESL Speaking Starter", "topic_id": topic_map["esl-ell"], "difficulty": 2, "tags": ["level-1", "phonics", "reading"]},
        {"title": "ESL Reading Intermediate", "topic_id": topic_map["esl-ell"], "difficulty": 4, "tags": ["level-3", "reading", "writing"]},
        {"title": "Bible and Character Journey", "topic_id": topic_map["bible-religious"], "difficulty": 3, "tags": ["bible-stories", "character-ed", "reading"]},
        {"title": "Arts Music Life Skills Blend", "topic_id": topic_map["arts-music"], "difficulty": 3, "tags": ["music", "visual-arts", "social-skills"]},
    ]


def generate() -> tuple[list[dict], list[dict]]:
    with sqlite3.connect(YC2_DB) as conn:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        topic_map = {row["slug"]: row["id"] for row in conn.execute("SELECT id, slug FROM topics WHERE parent_id IS NULL")}
        conn.execute("DELETE FROM courses WHERE course_mode = 'topic-mixed'")
        conn.commit()

        service = CourseGenerationService(conn)
        ok, err = [], []
        for payload in templates(topic_map):
            result = service.generate_course(
                title=payload["title"],
                topic_id=payload["topic_id"],
                course_mode="topic-mixed",
                difficulty_level=payload["difficulty"],
                tag_slugs=payload["tags"],
                min_confidence=0.7,
                max_items=30,
                items_per_module=5,
                content_sources=["abeka", "littlefox", "playtt", "playgg"],
                source_quota_mode=DEFAULT_SOURCE_QUOTA_MODE,
                abeka_max_ratio=DEFAULT_ABEKA_MAX_RATIO,
            )
            if "error" in result:
                err.append({"title": payload["title"], "error": result["error"]})
            else:
                ok.append(result)
                print(
                    f"created: {result['title']} items={result['items_added']} "
                    f"sources={','.join(result['sources_used'])} quota={result.get('source_quota')} "
                    f"actual={result.get('source_distribution')}"
                )
        return ok, err


def report_markdown() -> str:
    with sqlite3.connect(YC2_DB) as conn:
        conn.row_factory = sqlite3.Row
        conn.execute("ATTACH DATABASE ? AS unified", (str(UNIFIED_DB),))
        rows = conn.execute(
            """
            SELECT t.category, t.slug AS topic_slug, t.name AS topic_name, c.id, c.title, c.difficulty_level,
                   (SELECT COUNT(*) FROM course_items ci WHERE ci.course_id = c.id) AS item_count
            FROM courses c
            JOIN topics t ON t.id = c.topic_id
            WHERE c.course_mode = 'topic-mixed'
            ORDER BY t.sort_order, c.id
            """
        ).fetchall()
        by_source = conn.execute(
            """
            SELECT content_source, COUNT(*) AS item_count
            FROM course_items
            WHERE course_id IN (SELECT id FROM courses WHERE course_mode = 'topic-mixed')
            GROUP BY content_source
            ORDER BY content_source
            """
        ).fetchall()
        total_videos = conn.execute(
            "SELECT COUNT(*) FROM unified.content_video v JOIN unified.content_collection c ON c.collection_key=v.collection_key WHERE c.source_key IN ('abeka','littlefox','playtt','playgg')"
        ).fetchone()[0]
        tagged_videos = conn.execute(
            "SELECT COUNT(DISTINCT content_source || ':' || collection_key || ':' || video_key) FROM content_tags"
        ).fetchone()[0]
        conf = conn.execute(
            """
            SELECT
              SUM(CASE WHEN confidence >= 0.9 THEN 1 ELSE 0 END) AS c90,
              SUM(CASE WHEN confidence >= 0.8 AND confidence < 0.9 THEN 1 ELSE 0 END) AS c80,
              SUM(CASE WHEN confidence >= 0.7 AND confidence < 0.8 THEN 1 ELSE 0 END) AS c70
            FROM content_tags
            """
        ).fetchone()
        playtt_rows = conn.execute(
            """
            SELECT
              ct.collection_key,
              ct.video_key,
              COALESCE(c.provider, '') AS provider,
              COALESCE(c.course, '') AS course
            FROM content_tags ct
            JOIN unified.content_collection c ON c.collection_key = ct.collection_key
            JOIN unified.content_video v
              ON v.collection_key = ct.collection_key
             AND v.video_key = ct.video_key
            WHERE ct.content_source = 'playtt'
            """
        ).fetchall()
        playtt_tag_rows = Counter()
        playtt_video_sets: dict[str, set[str]] = defaultdict(set)
        for row in playtt_rows:
            sub_provider = parse_playtt_sub_provider(row["collection_key"], row["provider"], row["course"]) or "unknown"
            playtt_tag_rows[sub_provider] += 1
            playtt_video_sets[sub_provider].add(f"{row['collection_key']}::{row['video_key']}")
        playtt = sorted(
            [
                {
                    "provider": provider,
                    "tagged_videos": len(playtt_video_sets[provider]),
                    "tag_rows": playtt_tag_rows[provider],
                }
                for provider in playtt_video_sets.keys()
            ],
            key=lambda item: item["tagged_videos"],
            reverse=True,
        )
        quota_rows = conn.execute(
            """
            SELECT c.title,
                   SUM(CASE WHEN ci.content_source = 'abeka' THEN 1 ELSE 0 END) AS abeka_items,
                   SUM(CASE WHEN ci.content_source = 'littlefox' THEN 1 ELSE 0 END) AS littlefox_items,
                   SUM(CASE WHEN ci.content_source = 'playtt' THEN 1 ELSE 0 END) AS playtt_items,
                   SUM(CASE WHEN ci.content_source = 'playgg' THEN 1 ELSE 0 END) AS playgg_items,
                   COUNT(*) AS total_items
            FROM courses c
            JOIN course_items ci ON ci.course_id = c.id
            WHERE c.course_mode = 'topic-mixed'
            GROUP BY c.id
            ORDER BY c.id
            """
        ).fetchall()
        ideal_quota = {"abeka": 10, "littlefox": 7, "playtt": 7, "playgg": 6}
        quota_violations = []
        for row in quota_rows:
            if row["abeka_items"] > ideal_quota["abeka"]:
                quota_violations.append(f"{row['title']}: abeka={row['abeka_items']} > {ideal_quota['abeka']}")

        lines = ["# YC2 Topic-Based Course Report", "", "## Courses by topic category"]
        current = None
        for row in rows:
            if row["category"] != current:
                current = row["category"]
                lines.append(f"\n### {current}")
            lines.append(
                f"- {row['title']} | topic={row['topic_slug']} | difficulty={row['difficulty_level']} | items={row['item_count']}"
            )
        lines.append("\n## Items by 4 sources breakdown")
        for row in by_source:
            lines.append(f"- {row['content_source']}: {row['item_count']} items")
        lines.append("\n## Tagging statistics")
        coverage = (tagged_videos / total_videos * 100) if total_videos else 0
        lines.append(f"- total_videos (4 sources): {total_videos}")
        lines.append(f"- tagged_videos: {tagged_videos}")
        lines.append(f"- coverage_percent: {coverage:.2f}%")
        lines.append(f"- confidence_0.90_plus: {conf['c90'] or 0}")
        lines.append(f"- confidence_0.80_0.89: {conf['c80'] or 0}")
        lines.append(f"- confidence_0.70_0.79: {conf['c70'] or 0}")
        lines.append("\n## Ideal vs Actual (Source Quota)")
        lines.append("- ideal_rule: hard abeka cap + balanced non-abeka targets for 30 items/course")
        lines.append("- target_quota: abeka<=10, littlefox≈7, playtt≈7, playgg≈6")
        lines.append("- note: if a source lacks enough candidates for a specific topic, slots are reallocated to other non-abeka sources")
        for row in quota_rows:
            lines.append(
                f"- {row['title']}: abeka={row['abeka_items']}, littlefox={row['littlefox_items']}, playtt={row['playtt_items']}, playgg={row['playgg_items']} (total={row['total_items']})"
            )
        if quota_violations:
            lines.append("- violations:")
            for issue in quota_violations:
                lines.append(f"- violation: {issue}")
        else:
            lines.append("- violations: none")
        lines.append("\n## PlayTT sub-provider analysis")
        if playtt:
            for row in playtt:
                lines.append(
                    f"- {row['provider']}: {row['tagged_videos']} tagged videos ({row['tag_rows']} tag rows)"
                )
        else:
            lines.append("- No PlayTT tagged items")
        return "\n".join(lines) + "\n"


def main() -> None:
    created, errors = generate()
    report = report_markdown()
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"courses_created={len(created)}")
    print(f"courses_failed={len(errors)}")
    if errors:
        for error in errors:
            print(f"error: {error['title']} -> {error['error']}")
    print(f"report={REPORT_PATH}")


if __name__ == "__main__":
    main()
