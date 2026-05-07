#!/usr/bin/env python3
import json
import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path(os.environ.get("YC2_DATABASE_PATH", ROOT / "output" / "database" / "topic-courses-yc2.db"))
SCHEMA_PATH = ROOT / "output" / "database" / "schema.sql"
SEED_PATH = ROOT / "output" / "database" / "seed-topics.sql"
PATTERNS_PATH = ROOT / "scripts" / "tag-patterns.json"


def init_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        conn.executescript(SEED_PATH.read_text(encoding="utf-8"))
        seed_tags(conn)
        conn.commit()
        print_summary(conn)

    print(f"database={DB_PATH}")


def seed_tags(conn: sqlite3.Connection) -> None:
    if not PATTERNS_PATH.exists():
        return
    payload = json.loads(PATTERNS_PATH.read_text(encoding="utf-8"))
    rows = []
    for tag in payload.get("tags", []):
        rows.append(
            (
                tag["slug"],
                tag["name"],
                tag["category"],
                "keyword",
                ",".join(tag.get("keywords", [])),
                float(tag.get("threshold", 0.7)),
                1,
            )
        )
    conn.executemany(
        """
        INSERT OR REPLACE INTO tags
        (slug, name, category, pattern_type, pattern_value, confidence_threshold, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def print_summary(conn: sqlite3.Connection) -> None:
    topic_count = conn.execute("SELECT COUNT(*) FROM topics").fetchone()[0]
    root_count = conn.execute("SELECT COUNT(*) FROM topics WHERE parent_id IS NULL").fetchone()[0]
    sub_count = topic_count - root_count
    tag_count = conn.execute("SELECT COUNT(*) FROM tags").fetchone()[0]
    mapping_count = conn.execute("SELECT COUNT(*) FROM difficulty_mapping").fetchone()[0]
    print("init ok")
    print(f"topics={topic_count} roots={root_count} subs={sub_count}")
    print(f"tags={tag_count}")
    print(f"difficulty_mappings={mapping_count}")


if __name__ == "__main__":
    init_database()
