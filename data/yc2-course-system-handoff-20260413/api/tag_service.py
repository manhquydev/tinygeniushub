import json
import re
import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import Any, Optional

ALLOWED_SOURCES = ("abeka", "littlefox", "playtt", "playgg")
ROOT = Path(__file__).resolve().parents[1]
UNIFIED_DB = ROOT / "unified_content.db"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or "course"


def age_range_from_difficulty(level: int) -> tuple[int, int]:
    start = max(4, level + 3)
    return start, min(18, start + 4)


class CourseGenerationService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def generate_course(
        self,
        title: str,
        topic_id: int,
        difficulty_level: int,
        tag_slugs: list[str],
        min_confidence: float = 0.7,
        max_items: int = 30,
        items_per_module: int = 5,
        content_sources: Optional[list[str]] = None,
        course_mode: str = "topic-mixed",
        source_quota_mode: str = "hard",
        source_quota: Optional[dict[str, int]] = None,
        abeka_max_ratio: float = 0.35,
    ) -> dict[str, Any]:
        sources = content_sources or list(ALLOWED_SOURCES)
        sources = [source for source in sources if source in ALLOWED_SOURCES]
        if not sources:
            return {"error": "No valid content_sources provided"}
        if not tag_slugs:
            return {"error": "tag_slugs is required"}
        if course_mode not in {"topic-mixed", "source-native"}:
            return {"error": "course_mode must be 'topic-mixed' or 'source-native'"}

        topic = self.conn.execute("SELECT id, slug FROM topics WHERE id = ?", (topic_id,)).fetchone()
        if not topic:
            return {"error": f"topic_id={topic_id} not found"}

        candidates = self._query_candidates(
            tag_slugs=tag_slugs,
            difficulty_level=difficulty_level,
            min_confidence=min_confidence,
            max_items=max_items,
            sources=sources,
            quota_mode=source_quota_mode,
            source_quota=source_quota,
            abeka_max_ratio=abeka_max_ratio,
        )
        if not candidates:
            return {"error": "No candidate content found for the criteria"}
        source_distribution = self._count_items_by_source(candidates)
        resolved_quota = self._build_source_quota(
            max_items=max_items,
            sources=sources,
            source_quota=source_quota,
            abeka_max_ratio=abeka_max_ratio,
        )
        metadata_map = self._fetch_video_metadata_map([item["video_key"] for item in candidates])

        slug = self._next_slug(slugify(title))
        age_min, age_max = age_range_from_difficulty(difficulty_level)
        self.conn.execute(
            """
            INSERT INTO courses (slug, title, topic_id, course_mode, difficulty_level, age_min, age_max, status, content_sources_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
            """,
            (
                slug,
                title,
                topic_id,
                course_mode,
                difficulty_level,
                age_min,
                age_max,
                json.dumps(sorted({c["content_source"] for c in candidates})),
            ),
        )
        course_id = self.conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        modules = []
        for idx, chunk in enumerate(self._chunks(candidates, items_per_module), start=1):
            module_title = f"Module {idx}"
            self.conn.execute(
                "INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)",
                (course_id, module_title, idx),
            )
            module_id = self.conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            module_items = []
            for item_index, item in enumerate(chunk, start=1):
                meta = metadata_map.get(item["video_key"], {})
                self.conn.execute(
                    """
                    INSERT INTO course_items
                    (course_id, module_id, content_source, collection_key, video_key, title, video_url, difficulty_level, confidence, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        course_id,
                        module_id,
                        item["content_source"],
                        item["collection_key"],
                        item["video_key"],
                        meta.get("title"),
                        meta.get("video_url"),
                        item["difficulty_suggested"],
                        item["confidence"],
                        item_index,
                    ),
                )
                module_items.append(item)
            modules.append({"id": module_id, "title": module_title, "count": len(module_items)})
        self.conn.commit()

        return {
            "course_id": course_id,
            "slug": slug,
            "title": title,
            "topic_id": topic_id,
            "course_mode": course_mode,
            "difficulty_level": difficulty_level,
            "items_added": len(candidates),
            "modules_created": len(modules),
            "sources_used": sorted({c["content_source"] for c in candidates}),
            "source_quota_mode": source_quota_mode,
            "source_quota": resolved_quota,
            "source_distribution": source_distribution,
        }

    def list_courses(
        self,
        difficulty_min: Optional[int] = None,
        difficulty_max: Optional[int] = None,
        age: Optional[int] = None,
        source: Optional[str] = None,
        mode: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        clauses = ["1=1"]
        params: list[Any] = []
        if mode in {"topic-mixed", "source-native"}:
            clauses.append("c.course_mode = ?")
            params.append(mode)
        if difficulty_min is not None:
            clauses.append("c.difficulty_level >= ?")
            params.append(difficulty_min)
        if difficulty_max is not None:
            clauses.append("c.difficulty_level <= ?")
            params.append(difficulty_max)
        if age is not None:
            clauses.append("c.age_min <= ? AND c.age_max >= ?")
            params.extend([age, age])
        if source in ALLOWED_SOURCES:
            clauses.append("EXISTS (SELECT 1 FROM course_items ci WHERE ci.course_id = c.id AND ci.content_source = ?)")
            params.append(source)
        query = f"""
            SELECT c.id, c.slug, c.title, c.course_mode, c.difficulty_level, c.age_min, c.age_max, c.status, c.created_at,
                   t.slug AS topic_slug, t.name AS topic_name,
                   (SELECT COUNT(*) FROM course_items ci WHERE ci.course_id = c.id) AS item_count
            FROM courses c
            JOIN topics t ON t.id = c.topic_id
            WHERE {" AND ".join(clauses)}
            ORDER BY c.created_at DESC
        """
        rows = self.conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]

    def get_course_detail(self, course_id: int) -> Optional[dict[str, Any]]:
        course = self.conn.execute(
            """
            SELECT c.*, t.slug AS topic_slug, t.name AS topic_name
            FROM courses c
            JOIN topics t ON t.id = c.topic_id
            WHERE c.id = ?
            """,
            (course_id,),
        ).fetchone()
        if not course:
            return None
        module_rows = self.conn.execute(
            "SELECT id, title, sort_order FROM course_modules WHERE course_id = ? ORDER BY sort_order",
            (course_id,),
        ).fetchall()
        item_rows = self.conn.execute(
            """
            SELECT ci.id, ci.module_id, ci.content_source, ci.collection_key, ci.video_key, ci.title, ci.video_url, ci.confidence, ci.difficulty_level, ci.sort_order
            FROM course_items ci
            JOIN course_modules cm ON cm.id = ci.module_id
            WHERE ci.course_id = ?
            ORDER BY cm.sort_order, ci.sort_order
            """,
            (course_id,),
        ).fetchall()
        items_by_module: dict[int, list[dict[str, Any]]] = {}
        for item in item_rows:
            module_items = items_by_module.setdefault(item["module_id"], [])
            module_items.append(
                {
                    "id": item["id"],
                    "content_source": item["content_source"],
                    "collection_key": item["collection_key"],
                    "video_key": item["video_key"],
                    "title": item["title"],
                    "video_url": item["video_url"],
                    "confidence": item["confidence"],
                    "difficulty_level": item["difficulty_level"],
                    "sort_order": item["sort_order"],
                }
            )
        modules = []
        for module in module_rows:
            modules.append(
                {
                    "id": module["id"],
                    "title": module["title"],
                    "sort_order": module["sort_order"],
                    "items": items_by_module.get(module["id"], []),
                }
            )
        payload = dict(course)
        payload["modules"] = modules
        return payload

    def tagging_statistics(self) -> dict[str, Any]:
        row = self.conn.execute(
            """
            SELECT COUNT(*) AS total_tags,
                   COUNT(DISTINCT content_source || ':' || collection_key || ':' || video_key) AS tagged_videos,
                   AVG(confidence) AS avg_confidence
            FROM content_tags
            """
        ).fetchone()
        by_source = self.conn.execute(
            """
            SELECT content_source, COUNT(*) AS tag_count,
                   COUNT(DISTINCT collection_key || ':' || video_key) AS videos
            FROM content_tags
            GROUP BY content_source
            ORDER BY content_source
            """
        ).fetchall()
        return {"summary": dict(row), "by_source": [dict(item) for item in by_source]}

    def _query_candidates(
        self,
        tag_slugs: list[str],
        difficulty_level: int,
        min_confidence: float,
        max_items: int,
        sources: list[str],
        quota_mode: str,
        source_quota: Optional[dict[str, int]],
        abeka_max_ratio: float,
    ) -> list[dict[str, Any]]:
        resolved_mode = quota_mode if quota_mode in {"hard", "adaptive"} else "hard"
        quotas = self._build_source_quota(
            max_items=max_items,
            sources=sources,
            source_quota=source_quota,
            abeka_max_ratio=abeka_max_ratio,
        )
        selected_by_source: dict[str, list[dict[str, Any]]] = {source: [] for source in sources}
        extra_by_source: dict[str, list[dict[str, Any]]] = {source: [] for source in sources}
        diff_min = max(1, difficulty_level - 2)
        diff_max = min(10, difficulty_level + 2)

        for source in sources:
            quota = max(0, quotas.get(source, 0))
            pool_limit = max(quota * 8, max_items * 2, 60)
            strict_rows = self._query_source_candidates(
                tag_slugs=tag_slugs,
                source=source,
                min_confidence=min_confidence,
                difficulty_level=difficulty_level,
                difficulty_min=diff_min,
                difficulty_max=diff_max,
                limit=pool_limit,
            )
            if len(strict_rows) < quota:
                relaxed_rows = self._query_source_candidates(
                    tag_slugs=tag_slugs,
                    source=source,
                    min_confidence=max(0.55, min_confidence - 0.1),
                    difficulty_level=difficulty_level,
                    difficulty_min=max(1, diff_min - 1),
                    difficulty_max=min(10, diff_max + 1),
                    limit=pool_limit,
                )
                strict_rows = self._merge_candidate_rows(strict_rows, relaxed_rows)
            selected_by_source[source] = strict_rows[:quota]
            extra_by_source[source] = strict_rows[quota:]

        selected = self._interleave_by_source(selected_by_source, sources, max_items)
        if len(selected) >= max_items:
            return selected[:max_items]

        seen = {(item["content_source"], item["collection_key"], item["video_key"]) for item in selected}
        if resolved_mode == "hard":
            overflow_order = [source for source in sources if source != "abeka"] + (["abeka"] if "abeka" in sources else [])
        else:
            overflow_order = [source for source in sources if source != "abeka"] + (["abeka"] if "abeka" in sources else [])

        for source in overflow_order:
            for item in extra_by_source.get(source, []):
                key = (item["content_source"], item["collection_key"], item["video_key"])
                if key in seen:
                    continue
                selected.append(item)
                seen.add(key)
                if len(selected) >= max_items:
                    return selected[:max_items]
        return selected

    def _query_source_candidates(
        self,
        tag_slugs: list[str],
        source: str,
        min_confidence: float,
        difficulty_level: int,
        difficulty_min: int,
        difficulty_max: int,
        limit: int,
    ) -> list[dict[str, Any]]:
        tag_ph = ",".join(["?"] * len(tag_slugs))
        rows = self.conn.execute(
            f"""
            SELECT ct.content_source, ct.collection_key, ct.video_key,
                   MAX(ct.confidence) AS confidence,
                   MAX(ct.difficulty_suggested) AS difficulty_suggested
            FROM content_tags ct
            WHERE ct.tag_slug IN ({tag_ph})
              AND ct.content_source = ?
              AND ct.confidence >= ?
              AND COALESCE(ct.difficulty_suggested, ?) BETWEEN ? AND ?
            GROUP BY ct.content_source, ct.collection_key, ct.video_key
            ORDER BY MAX(ct.confidence) DESC,
                     ABS(COALESCE(MAX(ct.difficulty_suggested), ?) - ?) ASC
            LIMIT ?
            """,
            [
                *tag_slugs,
                source,
                min_confidence,
                difficulty_level,
                difficulty_min,
                difficulty_max,
                difficulty_level,
                difficulty_level,
                limit,
            ],
        ).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def _merge_candidate_rows(primary: list[dict[str, Any]], fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
        merged: dict[tuple[str, str, str], dict[str, Any]] = {}
        for item in primary + fallback:
            key = (item["content_source"], item["collection_key"], item["video_key"])
            current = merged.get(key)
            if current is None:
                merged[key] = item
                continue
            if float(item.get("confidence") or 0) > float(current.get("confidence") or 0):
                merged[key] = item
        rows = list(merged.values())
        rows.sort(
            key=lambda item: (
                -float(item.get("confidence") or 0),
                float(item.get("difficulty_suggested") or 0),
            )
        )
        return rows

    @staticmethod
    def _build_source_quota(
        max_items: int,
        sources: list[str],
        source_quota: Optional[dict[str, int]],
        abeka_max_ratio: float,
    ) -> dict[str, int]:
        if not sources:
            return {}
        if source_quota:
            quota = {source: max(0, int(source_quota.get(source, 0))) for source in sources}
            missing_sources = [source for source in sources if quota[source] == 0]
            remaining = max(0, max_items - sum(quota.values()))
            for idx, source in enumerate(missing_sources):
                share = remaining // max(1, len(missing_sources))
                if idx < (remaining % max(1, len(missing_sources))):
                    share += 1
                quota[source] += share
            if sum(quota.values()) > max_items:
                overflow = sum(quota.values()) - max_items
                for source in sorted(sources, key=lambda s: (s == "abeka", quota[s]), reverse=True):
                    take = min(quota[source], overflow)
                    quota[source] -= take
                    overflow -= take
                    if overflow == 0:
                        break
            return quota

        if len(sources) == 1:
            return {sources[0]: max_items}

        quota = {source: 0 for source in sources}
        if "abeka" in sources:
            capped_ratio = min(0.8, max(0.15, abeka_max_ratio))
            abeka_cap = max(1, int(max_items * capped_ratio))
            non_abeka_sources = [source for source in sources if source != "abeka"]
            non_abeka_total = max_items - abeka_cap
            base = non_abeka_total // max(1, len(non_abeka_sources))
            remainder = non_abeka_total % max(1, len(non_abeka_sources))
            quota["abeka"] = abeka_cap
            for idx, source in enumerate(non_abeka_sources):
                quota[source] = base + (1 if idx < remainder else 0)
            return quota

        base = max_items // len(sources)
        remainder = max_items % len(sources)
        for idx, source in enumerate(sources):
            quota[source] = base + (1 if idx < remainder else 0)
        return quota

    @staticmethod
    def _interleave_by_source(
        buckets: dict[str, list[dict[str, Any]]], sources: list[str], max_items: int
    ) -> list[dict[str, Any]]:
        output: list[dict[str, Any]] = []
        seen: set[tuple[str, str, str]] = set()
        active = [source for source in sources if buckets.get(source)]
        while active and len(output) < max_items:
            next_active: list[str] = []
            for source in active:
                source_bucket = buckets.get(source, [])
                if not source_bucket:
                    continue
                item = source_bucket.pop(0)
                key = (item["content_source"], item["collection_key"], item["video_key"])
                if key not in seen:
                    seen.add(key)
                    output.append(item)
                    if len(output) >= max_items:
                        break
                if source_bucket:
                    next_active.append(source)
            active = next_active
        return output

    @staticmethod
    def _count_items_by_source(items: list[dict[str, Any]]) -> dict[str, int]:
        counter: defaultdict[str, int] = defaultdict(int)
        for item in items:
            source = item.get("content_source")
            if source:
                counter[source] += 1
        return dict(sorted(counter.items()))

    def _next_slug(self, base: str) -> str:
        slug = base
        n = 2
        while self.conn.execute("SELECT 1 FROM courses WHERE slug = ?", (slug,)).fetchone():
            slug = f"{base}-{n}"
            n += 1
        return slug

    @staticmethod
    def _chunks(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
        return [items[i : i + max(1, size)] for i in range(0, len(items), max(1, size))]

    @staticmethod
    def _fetch_video_metadata_map(video_keys: list[str]) -> dict[str, dict[str, Any]]:
        if not UNIFIED_DB.exists():
            return {}
        unique_keys = [key for key in dict.fromkeys(video_keys) if key]
        if not unique_keys:
            return {}
        result: dict[str, dict[str, Any]] = {}
        with sqlite3.connect(UNIFIED_DB) as conn:
            conn.row_factory = sqlite3.Row
            chunk_size = 500
            for i in range(0, len(unique_keys), chunk_size):
                chunk = unique_keys[i : i + chunk_size]
                placeholders = ",".join("?" for _ in chunk)
                rows = conn.execute(
                    f"SELECT video_key, title, video_url FROM content_video WHERE video_key IN ({placeholders})",
                    chunk,
                ).fetchall()
                for row in rows:
                    result[row["video_key"]] = {"title": row["title"], "video_url": row["video_url"]}
        return result
