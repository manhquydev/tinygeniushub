#!/usr/bin/env python3
import argparse
import json
import os
import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import Any

from source_native_rules import ALLOWED_SOURCES, slugify, source_native_bucket

ROOT = Path(__file__).resolve().parents[1]
UNIFIED_DB = ROOT / "unified_content.db"
YC2_DB = Path(os.environ.get("YC2_DATABASE_PATH", ROOT / "output" / "database" / "topic-courses-yc2.db"))
REPORT_PATH = ROOT / "reports" / "yc2-source-native-report.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate source-native courses")
    parser.add_argument("--yc2-db", default=str(YC2_DB))
    parser.add_argument("--unified-db", default=str(UNIFIED_DB))
    parser.add_argument("--items-per-module", type=int, default=20)
    parser.add_argument("--min-items-per-course", type=int, default=30)
    parser.add_argument("--strict-mode", action="store_true", help="Reject small/noisy buckets instead of merging to Misc")
    parser.add_argument("--report", default=str(REPORT_PATH))
    return parser.parse_args()


def ensure_source_native_topics(conn: sqlite3.Connection) -> dict[str, int]:
    root_id = conn.execute("SELECT id FROM topics WHERE slug = 'source-native'").fetchone()
    if not root_id:
        conn.execute(
            """
            INSERT INTO topics (slug, name, description, category, parent_id, level, sort_order, is_active)
            VALUES ('source-native', 'Source Native', 'Courses split by original source structure', 'source-native', NULL, 0, 999, 1)
            """
        )
        root_value = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    else:
        root_value = root_id[0]

    children: dict[str, int] = {}
    for idx, source in enumerate(ALLOWED_SOURCES, start=1):
        slug = f"source-native-{source}"
        row = conn.execute("SELECT id FROM topics WHERE slug = ?", (slug,)).fetchone()
        if not row:
            conn.execute(
                """
                INSERT INTO topics (slug, name, description, category, parent_id, level, sort_order, is_active)
                VALUES (?, ?, ?, 'source-native', ?, 1, ?, 1)
                """,
                (slug, source.upper(), f"{source} source-native courses", root_value, idx),
            )
            children[source] = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        else:
            children[source] = row[0]
    return children


def next_slug(conn: sqlite3.Connection, base: str) -> str:
    slug = base
    n = 2
    while conn.execute("SELECT 1 FROM courses WHERE slug = ?", (slug,)).fetchone():
        slug = f"{base}-{n}"
        n += 1
    return slug


def chunked(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    step = max(1, size)
    return [items[i : i + step] for i in range(0, len(items), step)]


def difficulty_for_source(source: str) -> int:
    return {"abeka": 4, "littlefox": 4, "playtt": 5, "playgg": 5}.get(source, 4)


def source_display(source: str) -> str:
    return {"playtt": "PlayTT", "playgg": "PlayGG", "abeka": "Abeka", "littlefox": "Little Fox"}.get(source, source.title())


def build_source_native_courses(args: argparse.Namespace) -> dict[str, Any]:
    bucket_rows: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    noise_excluded = 0
    small_bucket_dropped_items = 0
    small_bucket_dropped_count = 0
    with sqlite3.connect(args.unified_db) as uconn:
        uconn.row_factory = sqlite3.Row
        rows = uconn.execute(
            """
            SELECT c.source_key, c.collection_key, c.provider, c.course, c.grade,
                   v.video_key, v.title, v.video_url
            FROM content_video v
            JOIN content_collection c ON c.collection_key = v.collection_key
            WHERE c.source_key IN ('abeka','littlefox','playtt','playgg')
            """
        )
        for row in rows:
            bucket = source_native_bucket(
                source=row["source_key"],
                provider=row["provider"] or "",
                course=row["course"] or "",
                grade=row["grade"] or "",
                collection_key=row["collection_key"] or "",
                title=row["title"] or "",
            )
            if not bucket:
                noise_excluded += 1
                continue
            bucket_rows[(row["source_key"], bucket[0], bucket[1])].append(dict(row))

    merged_rows: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for source in ALLOWED_SOURCES:
        source_buckets = {key: rows for key, rows in bucket_rows.items() if key[0] == source}
        for key, rows in source_buckets.items():
            if args.strict_mode and key[1] == "misc":
                small_bucket_dropped_items += len(rows)
                small_bucket_dropped_count += 1
                continue
            if len(rows) >= args.min_items_per_course:
                merged_rows[key] = rows
            else:
                if args.strict_mode:
                    small_bucket_dropped_items += len(rows)
                    small_bucket_dropped_count += 1
                else:
                    merged_rows[(source, "misc", f"{source_display(source)} Misc")] += rows

    with sqlite3.connect(args.yc2_db) as conn:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        topic_ids = ensure_source_native_topics(conn)
        conn.execute("DELETE FROM courses WHERE course_mode = 'source-native'")

        created: list[dict[str, Any]] = []
        for source in ALLOWED_SOURCES:
            rows_by_bucket = [(k, v) for k, v in merged_rows.items() if k[0] == source and v]
            rows_by_bucket.sort(key=lambda item: len(item[1]), reverse=True)
            for (src, bucket_key, label), rows in rows_by_bucket:
                slug = next_slug(conn, f"native-{src}-{slugify(bucket_key)}")
                difficulty = difficulty_for_source(src)
                conn.execute(
                    """
                    INSERT INTO courses (slug, title, description, topic_id, course_mode, difficulty_level, age_min, age_max, status, content_sources_json)
                    VALUES (?, ?, ?, ?, 'source-native', ?, 4, 15, 'draft', ?)
                    """,
                    (slug, label, f"Source-native split for {src}:{bucket_key}", topic_ids[src], difficulty, json.dumps([src])),
                )
                course_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

                collections: dict[str, list[dict[str, Any]]] = defaultdict(list)
                for row in rows:
                    collections[row["collection_key"]].append(row)
                module_order = 1
                seen_items: set[tuple[str, str]] = set()
                for collection_key in sorted(collections.keys()):
                    group = collections[collection_key]
                    group.sort(key=lambda item: (item.get("title") or "", item["video_key"]))
                    for chunk in chunked(group, args.items_per_module):
                        module_title = f"{collection_key} ({len(chunk)})"
                        conn.execute(
                            "INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)",
                            (course_id, module_title, module_order),
                        )
                        module_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                        for item_order, item in enumerate(chunk, start=1):
                            uniq = (item["collection_key"], item["video_key"])
                            if uniq in seen_items:
                                continue
                            seen_items.add(uniq)
                            conn.execute(
                                """
                                INSERT INTO course_items
                                (course_id, module_id, content_source, collection_key, video_key, title, video_url, difficulty_level, confidence, sort_order)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
                                """,
                                (
                                    course_id,
                                    module_id,
                                    src,
                                    item["collection_key"],
                                    item["video_key"],
                                    item["title"],
                                    item["video_url"],
                                    difficulty,
                                    item_order,
                                ),
                            )
                        module_order += 1
                created.append({"course_id": course_id, "title": label, "source": src, "items": len(seen_items)})
        conn.commit()

        by_source = conn.execute(
            """
            SELECT ci.content_source AS source, COUNT(*) AS item_count
            FROM courses c JOIN course_items ci ON ci.course_id = c.id
            WHERE c.course_mode = 'source-native'
            GROUP BY ci.content_source
            ORDER BY ci.content_source
            """
        ).fetchall()
    return {
        "courses_created": len(created),
        "noise_excluded": noise_excluded,
        "strict_mode": bool(args.strict_mode),
        "small_bucket_dropped_count": small_bucket_dropped_count,
        "small_bucket_dropped_items": small_bucket_dropped_items,
        "course_items_total": sum(item["items"] for item in created),
        "courses": created,
        "items_by_source": [dict(row) for row in by_source],
    }


def write_report(path: Path, summary: dict[str, Any]) -> None:
    lines = [
        "# YC2 Source-Native Course Report",
        "",
        f"- courses_created: {summary['courses_created']}",
        f"- course_items_total: {summary['course_items_total']}",
        f"- noise_excluded: {summary['noise_excluded']}",
        f"- strict_mode: {summary['strict_mode']}",
        f"- small_bucket_dropped_count: {summary['small_bucket_dropped_count']}",
        f"- small_bucket_dropped_items: {summary['small_bucket_dropped_items']}",
        "",
        "## Items by source",
    ]
    for row in summary["items_by_source"]:
        lines.append(f"- {row['source']}: {row['item_count']}")
    lines.append("")
    lines.append("## Courses")
    for row in sorted(summary["courses"], key=lambda item: (item["source"], -item["items"])):
        lines.append(f"- [{row['source']}] {row['title']} | items={row['items']}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    summary = build_source_native_courses(args)
    report_path = Path(args.report)
    write_report(report_path, summary)
    print(json.dumps(summary, indent=2))
    print(f"report={report_path}")


if __name__ == "__main__":
    main()
