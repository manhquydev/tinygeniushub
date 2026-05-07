#!/usr/bin/env python3
import argparse
import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
YC2_DB = Path(os.environ.get("YC2_DATABASE_PATH", ROOT / "output" / "database" / "topic-courses-yc2.db"))
SUMMARY_JSON = ROOT / "reports" / "yc2-dual-pipeline-summary.json"
SUMMARY_MD = ROOT / "reports" / "yc2-dual-pipeline-summary.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run source-native and topic-mixed course pipelines")
    parser.add_argument("--init-db", action="store_true")
    parser.add_argument("--run-tagger", action="store_true")
    parser.add_argument("--confidence", type=float, default=0.7)
    parser.add_argument("--source-native-strict", action="store_true")
    return parser.parse_args()


def run_step(script: Path, *extra: str) -> None:
    cmd = [sys.executable, str(script), *extra]
    subprocess.run(cmd, check=True, cwd=ROOT)


def summarize(db_path: Path) -> dict:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        summary = {
            "courses_total": conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
            "course_items_total": conn.execute("SELECT COUNT(*) FROM course_items").fetchone()[0],
            "phim_items": conn.execute("SELECT COUNT(*) FROM course_items WHERE content_source='phim'").fetchone()[0],
            "courses_by_mode": {
                row["course_mode"]: row["course_count"]
                for row in conn.execute(
                    "SELECT course_mode, COUNT(*) AS course_count FROM courses GROUP BY course_mode ORDER BY course_mode"
                )
            },
            "items_by_mode_source": [
                dict(row)
                for row in conn.execute(
                    """
                    SELECT c.course_mode, ci.content_source, COUNT(*) AS item_count
                    FROM courses c
                    JOIN course_items ci ON ci.course_id = c.id
                    GROUP BY c.course_mode, ci.content_source
                    ORDER BY c.course_mode, ci.content_source
                    """
                )
            ],
        }
    return summary


def main() -> None:
    args = parse_args()
    if args.init_db:
        run_step(ROOT / "output" / "database" / "init-database.py")
    if args.run_tagger:
        run_step(ROOT / "scripts" / "auto-tagger.py", "--confidence", str(args.confidence))

    run_step(ROOT / "scripts" / "generate-topic-mixed-courses.py")
    strict_args = ["--strict-mode"] if args.source_native_strict else []
    run_step(ROOT / "scripts" / "generate-source-native-courses.py", *strict_args)

    summary = summarize(YC2_DB)
    SUMMARY_JSON.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    lines = [
        "# YC2 Dual Pipeline Summary",
        "",
        f"- courses_total: {summary['courses_total']}",
        f"- course_items_total: {summary['course_items_total']}",
        f"- phim_items: {summary['phim_items']}",
        "",
        "## Courses by mode",
    ]
    for mode, count in summary["courses_by_mode"].items():
        lines.append(f"- {mode}: {count}")
    lines.append("")
    lines.append("## Items by mode/source")
    for row in summary["items_by_mode_source"]:
        lines.append(f"- {row['course_mode']} | {row['content_source']} | {row['item_count']}")
    SUMMARY_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print(f"summary_json={SUMMARY_JSON}")
    print(f"summary_md={SUMMARY_MD}")


if __name__ == "__main__":
    main()
