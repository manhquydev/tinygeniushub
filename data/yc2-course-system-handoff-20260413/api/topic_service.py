import sqlite3
from typing import Any, Optional


class TopicService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_topic_tree(self) -> list[dict[str, Any]]:
        roots = self._list_topics(parent_id=None)
        result = []
        for root in roots:
            children = self._list_topics(parent_id=root["id"])
            node = self._node_with_counts(root, children)
            result.append(node)
        return result

    def get_topic_by_slug(self, slug: str) -> Optional[dict[str, Any]]:
        topic = self.conn.execute(
            "SELECT id, slug, name, description, category, parent_id, level, sort_order, is_active FROM topics WHERE slug = ?",
            (slug,),
        ).fetchone()
        if not topic:
            return None
        base = dict(topic)
        children = self._list_topics(parent_id=base["id"])
        return self._node_with_counts(base, children)

    def list_topics(
        self,
        parent_id: Optional[int] = None,
        level: Optional[int] = None,
        category: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        clauses = ["is_active = 1"]
        params: list[Any] = []
        if parent_id is not None:
            clauses.append("parent_id = ?")
            params.append(parent_id)
        if level is not None:
            clauses.append("level = ?")
            params.append(level)
        if category:
            clauses.append("category = ?")
            params.append(category)
        else:
            clauses.append("category <> 'source-native'")
        query = f"""
            SELECT id, slug, name, description, category, parent_id, level, sort_order, is_active
            FROM topics
            WHERE {" AND ".join(clauses)}
            ORDER BY sort_order, name
        """
        rows = self.conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]

    def get_topic_courses(
        self,
        topic_slug: str,
        difficulty_min: Optional[int] = None,
        difficulty_max: Optional[int] = None,
        age: Optional[int] = None,
        source: Optional[str] = None,
        mode: Optional[str] = "topic-mixed",
    ) -> Optional[list[dict[str, Any]]]:
        topic = self.conn.execute("SELECT id FROM topics WHERE slug = ?", (topic_slug,)).fetchone()
        if not topic:
            return None
        clauses = ["c.topic_id = ?"]
        params: list[Any] = [topic["id"]]
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
        if source:
            clauses.append("EXISTS (SELECT 1 FROM course_items ci WHERE ci.course_id = c.id AND ci.content_source = ?)")
            params.append(source)
        rows = self.conn.execute(
            f"""
            SELECT c.id, c.slug, c.title, c.description, c.course_mode, c.difficulty_level,
                   c.age_min, c.age_max, c.status, c.created_at,
                   (SELECT COUNT(*) FROM course_items ci WHERE ci.course_id = c.id) AS item_count
            FROM courses c
            WHERE {" AND ".join(clauses)}
            ORDER BY c.created_at DESC
            """,
            params,
        ).fetchall()
        return [dict(row) for row in rows]

    def _list_topics(self, parent_id: Optional[int]) -> list[dict[str, Any]]:
        if parent_id is None:
            rows = self.conn.execute(
                """
                SELECT id, slug, name, description, category, parent_id, level, sort_order, is_active
                FROM topics
                WHERE is_active = 1 AND parent_id IS NULL AND category <> 'source-native'
                ORDER BY sort_order, name
                """
            ).fetchall()
        else:
            rows = self.conn.execute(
                """
                SELECT id, slug, name, description, category, parent_id, level, sort_order, is_active
                FROM topics
                WHERE is_active = 1 AND parent_id = ? AND category <> 'source-native'
                ORDER BY sort_order, name
                """,
                (parent_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def _node_with_counts(self, topic: dict[str, Any], children: list[dict[str, Any]]) -> dict[str, Any]:
        course_count = self.conn.execute(
            "SELECT COUNT(*) FROM courses WHERE topic_id = ? AND course_mode = 'topic-mixed'",
            (topic["id"],),
        ).fetchone()[0]
        item_count = self.conn.execute(
            "SELECT COUNT(*) FROM course_items WHERE course_id IN (SELECT id FROM courses WHERE topic_id = ? AND course_mode = 'topic-mixed')",
            (topic["id"],),
        ).fetchone()[0]
        return {
            **topic,
            "course_count": course_count,
            "item_count": item_count,
            "children": [self._node_with_counts(child, []) for child in children],
        }
